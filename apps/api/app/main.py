from fastapi import FastAPI, HTTPException, Depends, Header, status
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import uuid
from datetime import datetime
from typing import Optional

from .models import (
    GenerateRequest, AnimationIR, ConversationRequest,
    ConversationResponse, ChatMessage, UserCreate, UserLogin,
    Token, User, UserTier, TIER_LIMITS, RenderJob
)
from .services.gemini_service import GeminiService
from .services.manim_service import ManimService
from .services.video_service import VideoService
from .services.auth_service import AuthService
from .services.template_service import TemplateService
from .services.job_queue_service import JobQueueService
from .config import get_settings

settings = get_settings()
security = HTTPBearer()

app = FastAPI(
    title="Animation Studio API (Enterprise)",
    description="Professional 2D animation generation platform",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gemini_service = GeminiService()
manim_service = ManimService()
video_service = VideoService()
auth_service = AuthService()
template_service = TemplateService()
job_queue_service = JobQueueService()

RATE_LIMIT_STORE = {}



async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Dependency to get current authenticated user"""
    user = auth_service.get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    return user


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[User]:
    """Dependency to get user if authenticated, None otherwise"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    return auth_service.get_current_user(token)


def check_rate_limit(user: User) -> None:
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



@app.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        return auth_service.register_user(user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login and get access token"""
    try:
        return auth_service.login_user(credentials.email, credentials.password)
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
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
):
    """Conversational animation generation with auth and credits"""
    try:
        check_rate_limit(current_user)
        
        if not auth_service.check_credits(current_user):
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
        
        auth_service.deduct_credit(current_user)
        
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
            "conversation_history": [msg.model_dump() for msg in updated_history],
            "credits_used": 1,
            "credits_remaining": current_user.credits_remaining
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
                "conversation_history": [msg.model_dump() for msg in request.conversation_history],
                "credits_used": 0,
                "credits_remaining": current_user.credits_remaining
            }
        )



@app.post("/render/queue")
async def queue_render_job(
    animation_ir: AnimationIR,
    output_format: str = "mp4",
    quality: str = "medium",
    current_user: User = Depends(get_current_user)
):
    """Queue a render job (non-blocking)"""
    limits = TIER_LIMITS[current_user.tier]
    
    if output_format == "gif" and not limits.can_export_gif:
        raise HTTPException(status_code=403, detail="GIF export requires Pro plan")
    if output_format == "webm" and not limits.can_export_webm:
        raise HTTPException(status_code=403, detail="WebM export requires Pro plan")
    if quality == "4k" and limits.max_render_quality != "4k":
        raise HTTPException(status_code=403, detail="4K rendering requires Enterprise plan")
    
    job = job_queue_service.create_render_job(
        user_id=current_user.id,
        animation_ir=animation_ir,
        output_format=output_format,
        quality=quality
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
    
    return {
        "job_id": job.id,
        "status": job.status,
        "video_url": job.video_url,
        "error_message": job.error_message,
        "created_at": job.created_at,
        "completed_at": job.completed_at,
        "estimated_duration": job.estimated_duration
    }


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
    current_user: User = Depends(get_current_user)
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



@app.get("/analytics/stats")
async def get_user_stats(current_user: User = Depends(get_current_user)):
    """Get user analytics and usage stats"""
    return {
        "tier": current_user.tier,
        "credits_remaining": current_user.credits_remaining,
        "credits_used": current_user.credits_used,
        "animations_created": current_user.animations_created,
        "member_since": current_user.created_at,
        "last_login": current_user.last_login
    }



@app.get("/")
async def root():
    return {
        "message": "Animation Studio API (Enterprise)",
        "version": "3.0.0",
        "features": ["auth", "templates", "job_queue", "multi_format"]
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}



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