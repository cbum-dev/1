from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import List, Literal, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid




class Animation(BaseModel):
    type: Literal["write", "create", "fade_in", "fade_out", "move_to", "scale", "rotate"]
    start_time: float = Field(ge=0)
    duration: float = Field(gt=0)
    target_position: Optional[List[float]] = None
    scale_factor: Optional[float] = None
    angle: Optional[float] = None
    easing: Optional[Literal["linear", "ease_in", "ease_out", "ease_in_out", "bounce"]] = "linear"


class AnimationObject(BaseModel):
    type: Literal["text", "shape", "latex", "image"]
    id: str
    content: Optional[str] = None
    shape: Optional[Literal["circle", "square", "rectangle", "triangle", "polygon", "arrow"]] = None
    radius: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    side_length: Optional[float] = None
    position: List[float] = Field(default=[0, 0, 0])
    font_size: Optional[int] = Field(default=36, ge=12, le=120)
    color: str = "#ffffff"
    fill_opacity: float = Field(default=1.0, ge=0, le=1)
    stroke_width: Optional[float] = Field(default=2.0, ge=0, le=10)
    animations: List[Animation] = []

    @field_validator('position')
    @classmethod
    def validate_position(cls, v):
        if len(v) != 3:
            raise ValueError("Position must have exactly 3 coordinates [x, y, z]")
        if not (-7 <= v[0] <= 7 and -4 <= v[1] <= 4):
            raise ValueError("Position out of bounds: x in [-7,7], y in [-4,4]")
        return v


class Scene(BaseModel):
    scene_id: str
    duration: float = Field(gt=0, le=10)
    background_color: str = "#1a1a2e"
    objects: List[AnimationObject] = Field(max_length=10)  


class AnimationIR(BaseModel):
    version: str = "1.0"
    metadata: dict
    scenes: List[Scene]
    style: Optional[str] = "default"  

    @field_validator('scenes')
    @classmethod
    def validate_scenes(cls, v):
        if not v:
            raise ValueError("Must have at least one scene")
        if len(v) > 20:
            raise ValueError("Too many scenes (max 20)")
        return v


class UserTier(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    tier: UserTier = UserTier.FREE
    credits_remaining: int = 10
    credits_used: int = 0
    animations_created: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class AnimationProject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    animation_ir: AnimationIR
    thumbnail_url: Optional[str] = None
    is_public: bool = False
    fork_count: int = 0
    view_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = []


class AnimationVersion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    version_number: int
    animation_ir: AnimationIR
    commit_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AnimationTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: Literal["educational", "marketing", "social", "presentation", "logo", "explainer"]
    animation_ir: AnimationIR
    thumbnail_url: Optional[str] = None
    is_premium: bool = False
    use_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)




class RenderJobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class RenderJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    project_id: Optional[str] = None
    animation_ir: AnimationIR
    status: RenderJobStatus = RenderJobStatus.PENDING
    output_format: Literal["mp4", "gif", "webm"] = "mp4"
    quality: Literal["low", "medium", "high", "4k"] = "medium"

    video_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_duration: Optional[float] = None


class RenderQueueRequest(BaseModel):
    animation_ir: AnimationIR
    output_format: Literal["mp4", "gif", "webm"] = "mp4"
    quality: Literal["low", "medium", "high", "4k"] = "medium"
    project_id: Optional[str] = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    animation_state: Optional[AnimationIR] = None


class ConversationRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_history: List[ChatMessage] = Field(default=[])
    current_animation: Optional[AnimationIR] = None
    style_preference: Optional[str] = None  


class ConversationResponse(BaseModel):
    success: bool
    assistant_message: str
    animation_ir: Optional[AnimationIR] = None
    manim_code: Optional[str] = None
    description: Optional[str] = None
    validation: dict
    conversation_history: List[ChatMessage]
    credits_used: int = 0
    credits_remaining: Optional[int] = None


class SaveProjectRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    animation_ir: Dict[str, Any]
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    manim_code: Optional[str] = None


class SaveProjectResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProjectSummary(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ConversationSummary(BaseModel):
    id: str
    title: str
    last_message: Optional[str] = None
    message_count: int = 0
    created_at: datetime
    updated_at: datetime


class ConversationDetail(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    animation_ir: Dict[str, Any]
    manim_code: Optional[str] = None
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class QuotaLimits(BaseModel):
    tier: UserTier
    max_generations_per_day: int
    max_scenes_per_animation: int
    max_objects_per_scene: int
    max_animation_duration: float 
    max_render_quality: str
    can_export_gif: bool
    can_export_webm: bool
    can_use_templates: bool
    can_fork_projects: bool
    can_make_public: bool
    storage_limit_mb: int


TIER_LIMITS = {
    UserTier.FREE: QuotaLimits(
        tier=UserTier.FREE,
        max_generations_per_day=10,
        max_scenes_per_animation=3,
        max_objects_per_scene=5,
        max_animation_duration=15.0,
        max_render_quality="medium",
        can_export_gif=False,
        can_export_webm=False,
        can_use_templates=True,
        can_fork_projects=False,
        can_make_public=False,
        storage_limit_mb=50
    ),
    UserTier.PRO: QuotaLimits(
        tier=UserTier.PRO,
        max_generations_per_day=100,
        max_scenes_per_animation=10,
        max_objects_per_scene=10,
        max_animation_duration=60.0,
        max_render_quality="high",
        can_export_gif=True,
        can_export_webm=True,
        can_use_templates=True,
        can_fork_projects=True,
        can_make_public=True,
        storage_limit_mb=500
    ),
    UserTier.ENTERPRISE: QuotaLimits(
        tier=UserTier.ENTERPRISE,
        max_generations_per_day=1000,
        max_scenes_per_animation=20,
        max_objects_per_scene=20,
        max_animation_duration=300.0,
        max_render_quality="4k",
        can_export_gif=True,
        can_export_webm=True,
        can_use_templates=True,
        can_fork_projects=True,
        can_make_public=True,
        storage_limit_mb=5000
    )
}




class UsageStats(BaseModel):
    user_id: str
    date: datetime
    generations_count: int = 0
    renders_count: int = 0
    total_duration_rendered: float = 0.0
    api_calls: int = 0




class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=10, max_length=2000)


class GenerateResponse(BaseModel):
    success: bool
    message: str
    video_url: Optional[str] = None
    