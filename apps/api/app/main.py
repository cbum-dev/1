from fastapi import FastAPI, HTTPException, Depends, Header, Request, Response, status
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime
import os
import uuid
from typing import Optional, List

from .models import (
    GenerateRequest,
    AnimationIR,
    ConversationRequest,
    ConversationResponse,
    RenderQueueRequest,
    UserCreate,
    UserLogin,
    Token,
    User,
    UserTier,
    TIER_LIMITS,
    RenderJob,
    ChatMessage,
    SaveProjectRequest,
    SaveProjectResponse,
    ProjectSummary,
    ConversationSummary,
    ConversationDetail,
)
from .services.gemini_service import GeminiService
from .services.manim_service import ManimService
from .services.video_service import VideoService
from .services.audio_service import AudioService
from .services.auth_service import AuthService
from .services.template_service import TemplateService
from .services.job_queue_service import JobQueueService
from .services.marketplace_service import MarketplaceService
from .database.database import get_db, init_db
from .database.models import (
    DBUser,
    DBAnimationProject,
    DBConversation,
    DBMarketplaceItem,
    UserTierEnum,
)
from .config import get_settings

settings = get_settings()
security = HTTPBearer()

app = FastAPI(
    title="Animation Studio API (Complete)",
    description="Professional 2D animation platform with AI, payments, and marketplace",
    version="4.0.0"
)


init_db()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "https://manim-flow.vercel.app",
        "https://www.manim-flow.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]  
)


gemini_service = GeminiService()
manim_service = ManimService()
video_service = VideoService()
audio_service = AudioService()
auth_service = AuthService()
template_service = TemplateService()
job_queue_service = JobQueueService()
marketplace_service = MarketplaceService()


RATE_LIMIT_STORE = {}




async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    user_data = auth_service.get_current_user(token)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    

    db_user = db.query(DBUser).filter(DBUser.id == user_data["user_id"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(
        id=db_user.id,
        email=db_user.email,
        username=db_user.username,
        tier=db_user.tier,
        credits_remaining=db_user.credits_remaining,
        credits_used=db_user.credits_used,
        animations_created=db_user.animations_created,
        created_at=db_user.created_at.isoformat()
    )


async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Dependency to get user if authenticated, None otherwise"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.replace("Bearer ", "")
    user_data = auth_service.get_current_user(token)
    
    if not user_data:
        return None
    
    db_user = db.query(DBUser).filter(DBUser.id == user_data["user_id"]).first()
    if not db_user:
        return None
    
    return User(
        id=db_user.id,
        email=db_user.email,
        username=db_user.username,
        tier=db_user.tier,
        credits_remaining=db_user.credits_remaining,
        credits_used=db_user.credits_used,
        animations_created=db_user.animations_created,
        created_at=db_user.created_at.isoformat()
    )


def check_rate_limit(user: User, db: Session) -> None:
    """Check if user has exceeded rate limits"""
    limits = TIER_LIMITS[user.tier]
    today = datetime.utcnow().date()
    
    key = f"{user.id}:{today}"
    current_count = RATE_LIMIT_STORE.get(key, 0)
    
    if current_count >= limits.max_generations_per_day:
        raise HTTPException(
            status_code=429,
            detail=f"Daily generation limit reached ({limits.max_generations_per_day}). Upgrade to Pro for more!"
        )
    
    RATE_LIMIT_STORE[key] = current_count + 1


def validate_animation_limits(animation_ir: AnimationIR, user: User) -> None:
    """Validate animation against user tier limits"""
    limits = TIER_LIMITS[user.tier]
    
    if len(animation_ir.scenes) > limits.max_scenes_per_animation:
        raise HTTPException(
            status_code=400,
            detail=f"Too many scenes. Your tier allows {limits.max_scenes_per_animation} scenes."
        )
    
    for scene in animation_ir.scenes:
        if len(scene.objects) > limits.max_objects_per_scene:
            raise HTTPException(
                status_code=400,
                detail=f"Too many objects in scene. Your tier allows {limits.max_objects_per_scene} objects per scene."
            )
    
    total_duration = sum(scene.duration for scene in animation_ir.scenes)
    if total_duration > limits.max_animation_duration:
        raise HTTPException(
            status_code=400,
            detail=f"Animation too long. Your tier allows {limits.max_animation_duration}s maximum."
        )


def _project_to_summary(project: DBAnimationProject) -> ProjectSummary:
    return ProjectSummary(
        id=project.id,
        title=project.title,
        description=project.description,
        thumbnail_url=project.thumbnail_url,
        created_at=project.created_at,
        updated_at=project.updated_at or project.created_at,
    )


def _conversation_to_summary(conversation: DBConversation) -> ConversationSummary:
    message_count = conversation.message_count or (
        len(conversation.messages) if conversation.messages else 0
    )
    return ConversationSummary(
        id=conversation.id,
        title=conversation.title,
        last_message=conversation.last_message,
        message_count=message_count,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at or conversation.created_at,
    )


def _conversation_to_detail(conversation: DBConversation) -> ConversationDetail:
    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        description=conversation.description,
        animation_ir=conversation.animation_ir,
        manim_code=conversation.manim_code,
        messages=conversation.messages or [],
        created_at=conversation.created_at,
        updated_at=conversation.updated_at or conversation.created_at,
    )




@app.get("/")
async def root():
    return {
        "message": "Animation Studio API (Complete)",
        "version": "4.0.0",
        "features": ["auth", "templates", "stripe", "marketplace", "chat"]
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}




@app.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        token_response = auth_service.register_user(user_data, db)
        return token_response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token"""
    try:
        token_response = auth_service.login_user(credentials.email, credentials.password, db)
        return token_response
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@app.get("/auth/limits")
async def get_limits(current_user: User = Depends(get_current_user)):
    """Get user's tier limits"""
    return TIER_LIMITS[current_user.tier]




@app.get("/templates")
async def list_templates(user: Optional[User] = Depends(get_optional_user)):
    """List all available templates"""
    include_premium = user and user.tier != UserTier.FREE
    templates = template_service.get_all_templates(include_premium)
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "category": t.category,
            "is_premium": t.is_premium,
            "use_count": t.use_count
        }
        for t in templates
    ]


@app.get("/templates/categories")
async def list_categories():
    """List template categories"""
    return [
        {"id": "educational", "name": "Educational"},
        {"id": "marketing", "name": "Marketing"},
        {"id": "social", "name": "Social Media"},
        {"id": "presentation", "name": "Presentation"},
        {"id": "logo", "name": "Logo Animations"},
        {"id": "explainer", "name": "Explainer Videos"}
    ]


@app.post("/templates/{template_id}/apply")
async def apply_template(
    template_id: str,
    customizations: dict = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Apply a template with optional customizations"""
    try:
        animation_ir = template_service.apply_template(template_id, customizations)
        validate_animation_limits(animation_ir, current_user)
        
        manim_code = manim_service.generate_full_code(animation_ir)
        description = _generate_description(animation_ir)
        
        return {
            "success": True,
            "animation_ir": animation_ir.model_dump(),
            "manim_code": manim_code,
            "description": description
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))




@app.post("/chat")
async def chat(
    request: ConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Conversational animation generation with auth and credits"""
    try:

        check_rate_limit(current_user, db)
        

        db_user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
        

        if db_user.credits_remaining <= 0:
            raise HTTPException(
                status_code=402,
                detail="No credits remaining. Please upgrade your plan!"
            )
        

        assistant_text, updated_animation = gemini_service.generate_conversational_response(
            user_message=request.message,
            conversation_history=request.conversation_history,
            current_animation=request.current_animation
        )
        

        validate_animation_limits(updated_animation, current_user)
        

        db_user.credits_remaining -= 1
        db_user.credits_used += 1
        db_user.animations_created += 1
        db.commit()
        

        manim_code = manim_service.generate_full_code(updated_animation)
        description = _generate_description(updated_animation)
        

        user_msg = ChatMessage(
            role="user",
            content=request.message,
            timestamp=datetime.utcnow(),
            animation_state=request.current_animation
        )
        
        assistant_msg = ChatMessage(
            role="assistant",
            content=assistant_text,
            timestamp=datetime.utcnow(),
            animation_state=updated_animation
        )
        
        updated_history = request.conversation_history + [user_msg, assistant_msg]
        
        return JSONResponse(content={
            "success": True,
            "assistant_message": assistant_text,
            "animation_ir": updated_animation.model_dump(),
            "manim_code": manim_code,
            "description": description,
            "validation": {"valid": True, "errors": []},
            "conversation_history": [
                {
                    **msg.model_dump(exclude={"timestamp"}),
                    "timestamp": msg.timestamp.isoformat()
                }
                for msg in updated_history
            ],
                        "credits_used": 1,
            "credits_remaining": db_user.credits_remaining
        })
        
    except HTTPException:
        raise
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "assistant_message": f"Error: {str(e)}",
                "animation_ir": None,
                "manim_code": None,
                "description": None,
                "validation": {"valid": False, "errors": [str(e)]},
                "conversation_history": [
                    {
                        **msg.model_dump(exclude={"timestamp"}),
                        "timestamp": msg.timestamp.isoformat()
                    }
                    for msg in request.conversation_history
                ],
                "credits_used": 0,
                "credits_remaining": current_user.credits_remaining
            }
        )




@app.post("/projects", response_model=SaveProjectResponse)
async def save_project(
    request: SaveProjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()

    project = DBAnimationProject(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=request.title,
        description=request.description,
        animation_ir=request.animation_ir,
        thumbnail_url=None,
        created_at=now,
        updated_at=now,
    )

    conversation = DBConversation(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        project_id=project.id,
        title=request.title,
        description=request.description,
        animation_ir=request.animation_ir,
        manim_code=request.manim_code,
        messages=request.messages,
        message_count=len(request.messages),
        last_message=(request.messages[-1].get("content") if request.messages else None),
        created_at=now,
        updated_at=now,
    )

    db.add(project)
    db.add(conversation)
    db.commit()
    db.refresh(project)
    db.refresh(conversation)

    return SaveProjectResponse(
        id=conversation.id,
        title=project.title,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@app.put("/projects/{project_id}", response_model=SaveProjectResponse)
async def update_project(
    project_id: str,
    request: SaveProjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing project and its conversation"""
    # First find the conversation since the UI tracks conversation ID primarily
    # But wait, the ID passed from UI (currentConversationId) IS the conversation ID usually
    # Let's check save_project return value: it returns conversation.id as 'id'.
    # So the ID passed here is likely the conversation ID if we are just calling it with currentConversationId.
    
    # Actually, the UI calls saveProject which hits POST /projects.
    # If the user is passing currentConversationId to the new updateProject function, 
    # we should probably assume we are updating the CONVERSATION, which maps to a Project.
    
    # However, standard REST would be PUT /projects/{project_id}. 
    # But the UI doesn't explicitly track project_id separate from conversation_id in the main flow (it just has currentConversationId).
    
    # So, let's look up the conversation first by the passed ID.
    conversation = db.query(DBConversation).filter(
        DBConversation.id == project_id, # ambiguous naming in URL, but logic holds
        DBConversation.user_id == current_user.id
    ).first()

    project = None
    if conversation:
        project = conversation.project
    else:
        # Fallback: maybe it IS a project ID?
        project = db.query(DBAnimationProject).filter(
            DBAnimationProject.id == project_id,
            DBAnimationProject.user_id == current_user.id
        ).first()

    if not project:
         raise HTTPException(status_code=404, detail="Project/Conversation not found")

    now = datetime.utcnow()
    
    # Update Project
    project.title = request.title
    project.description = request.description
    project.animation_ir = request.animation_ir
    project.updated_at = now
    
    # Update Conversation
    if conversation:
        conversation.title = request.title
        conversation.description = request.description
        conversation.animation_ir = request.animation_ir
        conversation.manim_code = request.manim_code
        conversation.messages = request.messages
        conversation.message_count = len(request.messages)
        conversation.last_message = (request.messages[-1].get("content") if request.messages else None)
        conversation.updated_at = now
    
    db.commit()
    db.refresh(project)
    if conversation:
        db.refresh(conversation)
    
    return SaveProjectResponse(
        id=conversation.id if conversation else project.id,
        title=project.title,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@app.get("/projects", response_model=List[ProjectSummary])
async def get_user_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    projects = (
        db.query(DBAnimationProject)
        .filter(DBAnimationProject.user_id == current_user.id)
        .order_by(DBAnimationProject.created_at.desc())
        .all()
    )
    return [_project_to_summary(project) for project in projects]


@app.get("/conversations", response_model=List[ConversationSummary])
async def get_user_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversations = (
        db.query(DBConversation)
        .filter(DBConversation.user_id == current_user.id)
        .order_by(DBConversation.updated_at.desc())
        .all()
    )
    return [_conversation_to_summary(conversation) for conversation in conversations]


@app.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def load_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = (
        db.query(DBConversation)
        .filter(
            DBConversation.id == conversation_id,
            DBConversation.user_id == current_user.id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return _conversation_to_detail(conversation)


@app.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = (
        db.query(DBConversation)
        .filter(
            DBConversation.id == conversation_id,
            DBConversation.user_id == current_user.id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    project = conversation.project

    db.delete(conversation)
    if project and project.user_id == current_user.id:
        db.delete(project)

    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/render/queue")
async def queue_render_job(
    request: RenderQueueRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Queue a render job (non-blocking)"""

    limits = TIER_LIMITS[current_user.tier]
    
    if request.output_format == "gif" and not limits.can_export_gif:
        raise HTTPException(status_code=403, detail="GIF export requires Pro plan")
    if request.output_format == "webm" and not limits.can_export_webm:
        raise HTTPException(status_code=403, detail="WebM export requires Pro plan")
    if request.quality == "4k" and limits.max_render_quality != "4k":
        raise HTTPException(status_code=403, detail="4K rendering requires Enterprise plan")
    

    job = job_queue_service.create_render_job(
        user_id=current_user.id,
        animation_ir=request.animation_ir,
        output_format=request.output_format,
        quality=request.quality,
        project_id=request.project_id,
        manim_code=request.manim_code
    )
    
    return {
        "job_id": job.id,
        "status": job.status,
        "estimated_duration": job.estimated_duration,
        "message": "Render job queued successfully"
    }


@app.get("/render/status/{job_id}")
async def get_render_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get status of a render job"""
    job = job_queue_service.get_job_status(job_id)
    
    if not job or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Job not found")
    

    video_url = None
    if job.video_url and job.status == "completed":
        video_url = f"/render/download/{job_id}"
    
    return {
        "job_id": job.id,
        "status": job.status,
        "video_url": video_url,
        "error_message": job.error_message,
        "created_at": job.created_at,
        "completed_at": job.completed_at,
        "estimated_duration": job.estimated_duration
    }


@app.get("/render/download/{job_id}")
async def download_render(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Download rendered video"""
    job = job_queue_service.get_job_status(job_id)
    
    if not job or job.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != "completed" or not job.video_url:
        raise HTTPException(status_code=400, detail="Video not ready")
    
    if not os.path.exists(job.video_url):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        job.video_url,
        media_type="video/mp4",
        filename=f"animation_{job_id}.mp4"
    )


@app.get("/render/jobs")
async def list_user_jobs(current_user: User = Depends(get_current_user)):
    """List all render jobs for current user"""
    jobs = job_queue_service.get_user_jobs(current_user.id)
    return [
        {
            "job_id": job.id,
            "status": job.status,
            "created_at": job.created_at,
            "completed_at": job.completed_at
        }
        for job in jobs
    ]


@app.post("/render/instant")
async def instant_render(
    animation_ir: AnimationIR,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Render animation instantly (blocking, for small animations)"""
    try:
        validate_animation_limits(animation_ir, current_user)
        
        video_files = manim_service.render_scenes(animation_ir)
        
        final_video_id = str(uuid.uuid4())
        final_video_path = os.path.join(
            settings.TEMP_DIR,
            f"final_{final_video_id}.mp4"
        )
        
        video_service.merge_videos(video_files, final_video_path)
        
        return FileResponse(
            final_video_path,
            media_type="video/mp4",
            filename=f"animation_{final_video_id}.mp4",
            background=lambda: video_service.cleanup_file(final_video_path)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Render failed: {str(e)}")




@app.post("/billing/create-checkout-session")
async def create_checkout_session(
    plan: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create Stripe checkout session for subscription"""
    try:
        db_user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
        
        session = stripe_service.create_checkout_session(
            user=db_user,
            plan=plan,
            success_url=f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/billing/canceled"
        )
        
        return session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/billing/create-marketplace-checkout")
async def create_marketplace_checkout(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create Stripe checkout for marketplace item"""
    try:
        item = marketplace_service.get_listing(db, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        db_user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
        
        session = stripe_service.create_marketplace_checkout(
            user=db_user,
            item_price=item.price,
            item_title=item.title,
            item_id=item_id,
            success_url=f"{settings.FRONTEND_URL}/marketplace/purchase-success?item_id={item_id}",
            cancel_url=f"{settings.FRONTEND_URL}/marketplace/{item_id}"
        )
        
        return session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/billing/cancel-subscription")
async def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel subscription at period end"""
    try:
        db_user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
        
        if not db_user.stripe_subscription_id:
            raise HTTPException(status_code=400, detail="No active subscription")
        
        success = stripe_service.cancel_subscription(db_user.stripe_subscription_id)
        
        return {"success": success, "message": "Subscription will cancel at period end"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/billing/resume-subscription")
async def resume_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resume a canceled subscription"""
    try:
        db_user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
        
        if not db_user.stripe_subscription_id:
            raise HTTPException(status_code=400, detail="No subscription found")
        
        success = stripe_service.resume_subscription(db_user.stripe_subscription_id)
        
        return {"success": success, "message": "Subscription resumed"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/billing/subscription")
async def get_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current subscription details"""
    db_user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
    
    if not db_user.stripe_subscription_id:
        return {"has_subscription": False}
    
    subscription = stripe_service.get_subscription(db_user.stripe_subscription_id)
    
    return {
        "has_subscription": True,
        "subscription": subscription,
        "tier": db_user.tier
    }


@app.post("/billing/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe_service.construct_webhook_event(payload, sig_header)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        
        if session.get("metadata", {}).get("type") == "marketplace_purchase":
            user_id = session["metadata"]["user_id"]
            item_id = session["metadata"]["item_id"]
            payment_intent = session.get("payment_intent")
            
            marketplace_service.purchase_item(db, user_id, item_id, payment_intent)
    
    elif event["type"] == "customer.subscription.created":
        subscription = event["data"]["object"]
        data = stripe_service.handle_subscription_created(subscription)
        
        user = db.query(DBUser).filter(DBUser.id == data["user_id"]).first()
        if user:
            user.stripe_subscription_id = data["subscription_id"]
            user.subscription_status = data["status"]
            user.tier = UserTierEnum.PRO
            db.commit()
    
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        data = stripe_service.handle_subscription_deleted(subscription)
        
        user = db.query(DBUser).filter(DBUser.id == data["user_id"]).first()
        if user:
            user.tier = UserTierEnum.FREE
            user.subscription_status = "canceled"
            db.commit()
    
    return {"status": "success"}




@app.post("/marketplace/list")
async def create_marketplace_listing(
    project_id: str,
    title: str,
    description: str,
    category: str,
    price: float,
    tags: list[str] = [],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List an animation project in the marketplace"""
    try:
        item = marketplace_service.create_listing(
            db=db,
            project_id=project_id,
            creator_id=current_user.id,
            title=title,
            description=description,
            category=category,
            price=price,
            tags=tags
        )
        
        return {
            "success": True,
            "item_id": item.id,
            "status": item.status,
            "message": "Listing created and pending approval"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/marketplace")
async def browse_marketplace(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    featured: bool = False,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Browse marketplace listings"""
    items = marketplace_service.get_listings(
        db=db,
        category=category,
        search=search,
        min_price=min_price,
        max_price=max_price,
        featured_only=featured,
        limit=limit,
        offset=offset
    )
    
    return [
        {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "category": item.category,
            "price": item.price,
            "tags": item.tags,
            "sales_count": item.sales_count,
            "rating": item.rating_sum / item.rating_count if item.rating_count > 0 else 0,
            "featured": item.featured,
            "creator": {"username": item.creator.username}
        }
        for item in items
    ]


@app.get("/marketplace/{item_id}")
async def get_marketplace_item(item_id: str, db: Session = Depends(get_db)):
    """Get detailed marketplace item"""
    item = marketplace_service.get_listing(db, item_id)
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {
        "id": item.id,
        "title": item.title,
        "description": item.description,
        "category": item.category,
        "price": item.price,
        "tags": item.tags,
        "sales_count": item.sales_count,
        "revenue": item.revenue,
        "rating": item.rating_sum / item.rating_count if item.rating_count > 0 else 0,
        "featured": item.featured,
        "animation_ir": item.project.animation_ir,
        "creator": {"id": item.creator.id, "username": item.creator.username},
        "created_at": item.created_at
    }


@app.get("/marketplace/trending")
async def get_trending_items(db: Session = Depends(get_db)):
    """Get trending marketplace items"""
    items = marketplace_service.get_trending(db, limit=10)
    
    return [
        {
            "id": item.id,
            "title": item.title,
            "price": item.price,
            "sales_count": item.sales_count,
            "creator": {"username": item.creator.username}
        }
        for item in items
    ]


@app.get("/marketplace/featured")
async def get_featured_items(db: Session = Depends(get_db)):
    """Get featured marketplace items"""
    items = marketplace_service.get_featured(db, limit=5)
    
    return [
        {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "price": item.price,
            "thumbnail": item.project.thumbnail_url
        }
        for item in items
    ]


@app.get("/marketplace/my-purchases")
async def get_my_purchases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's marketplace purchases"""
    purchases = marketplace_service.get_user_purchases(db, current_user.id)
    
    return [
        {
            "id": purchase.id,
            "item": {
                "id": purchase.item.id,
                "title": purchase.item.title,
                "animation_ir": purchase.item.project.animation_ir
            },
            "price_paid": purchase.price_paid,
            "purchased_at": purchase.purchased_at
        }
        for purchase in purchases
    ]


@app.get("/marketplace/my-sales")
async def get_my_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get creator's sales statistics"""
    items = marketplace_service.get_creator_sales(db, current_user.id)
    total_revenue = marketplace_service.get_creator_revenue(db, current_user.id)
    
    return {
        "total_revenue": total_revenue,
        "items": [
            {
                "id": item.id,
                "title": item.title,
                "price": item.price,
                "sales_count": item.sales_count,
                "revenue": item.revenue
            }
            for item in items
        ]
    }




@app.get("/analytics/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user analytics and usage stats"""
    db_user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
    
    return {
        "tier": db_user.tier,
        "credits_remaining": db_user.credits_remaining,
        "credits_used": db_user.credits_used,
        "animations_created": db_user.animations_created,
        "member_since": db_user.created_at,
        "last_login": db_user.last_login
    }




@app.post("/generate-plan")
async def generate_animation_plan(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """Legacy endpoint: Generate plan without conversation"""
    try:
        animation_ir = gemini_service.generate_animation_json(request.prompt)
        manim_code = manim_service.generate_full_code(animation_ir)
        description = _generate_description(animation_ir)
        
        return JSONResponse(content={
            "success": True,
            "json_ir": animation_ir.model_dump(),
            "manim_code": manim_code,
            "description": description,
            "validation": {"valid": True, "errors": []}
        })
        
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "json_ir": None,
                "manim_code": None,
                "description": None,
                "validation": {"valid": False, "errors": [str(e)]}
            }
        )


@app.post("/generate")
async def generate_animation(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Legacy endpoint: Generate and render in one step"""
    try:
        animation_ir = gemini_service.generate_animation_json(request.prompt)
        video_files = manim_service.render_scenes(animation_ir)
        
        final_video_id = str(uuid.uuid4())
        final_video_path = os.path.join(
            settings.TEMP_DIR,
            f"final_{final_video_id}.mp4"
        )
        
        video_service.merge_videos(video_files, final_video_path)
        
        return FileResponse(
            final_video_path,
            media_type="video/mp4",
            filename=f"animation_{final_video_id}.mp4",
            background=lambda: video_service.cleanup_file(final_video_path)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")




def _generate_description(animation_ir: AnimationIR) -> str:
    """Generate human-readable description"""
    desc_parts = [f"**{animation_ir.metadata.get('title', 'Animation')}**\n"]
    desc_parts.append(f"Duration: ~{animation_ir.metadata.get('duration_estimate', 0):.1f} seconds")
    desc_parts.append(f"Scenes: {len(animation_ir.scenes)}\n")
    
    for i, scene in enumerate(animation_ir.scenes, 1):
        desc_parts.append(f"**Scene {i}** ({scene.duration}s):")
        desc_parts.append(f"- Background: {scene.background_color}")
        desc_parts.append(f"- Objects: {len(scene.objects)}")
        
        for obj in scene.objects:
            obj_desc = f"  • {obj.type.upper()}"
            if obj.type == "text":
                obj_desc += f": \"{obj.content}\""
            elif obj.type == "shape":
                obj_desc += f": {obj.shape}"
            obj_desc += f" ({len(obj.animations)} animations)"
            desc_parts.append(obj_desc)
        desc_parts.append("")
    
    return "\n".join(desc_parts)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)