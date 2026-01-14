from pydantic import BaseModel, Field, field_validator
from typing import List, Literal, Optional


class Animation(BaseModel):
    type: Literal["write", "create", "fade_in", "fade_out", "move_to", "scale", "rotate"]
    start_time: float = Field(ge=0)
    duration: float = Field(gt=0)
    target_position: Optional[List[float]] = None
    scale_factor: Optional[float] = None
    angle: Optional[float] = None


class AnimationObject(BaseModel):
    type: Literal["text", "shape", "latex"]
    id: str
    content: Optional[str] = None
    shape: Optional[Literal["circle", "square", "rectangle", "triangle"]] = None
    radius: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    side_length: Optional[float] = None
    position: List[float] = Field(default=[0, 0, 0])
    font_size: Optional[int] = Field(default=36, ge=12, le=120)
    color: str = "#ffffff"
    fill_opacity: float = Field(default=1.0, ge=0, le=1)
    animations: List[Animation] = []

    @field_validator('position')
    @classmethod
    def validate_position(cls, v):
        if len(v) != 3:
            raise ValueError("Position must have exactly 3 coordinates [x, y, z]")
        # Manim coordinate bounds
        if not (-7 <= v[0] <= 7 and -4 <= v[1] <= 4):
            raise ValueError("Position out of bounds: x in [-7,7], y in [-4,4]")
        return v


class Scene(BaseModel):
    scene_id: str
    duration: float = Field(gt=0, le=10)
    background_color: str = "#1a1a2e"
    objects: List[AnimationObject] = Field(max_length=5)


class AnimationIR(BaseModel):
    version: str = "1.0"
    metadata: dict
    scenes: List[Scene]

    @field_validator('scenes')
    @classmethod
    def validate_scenes(cls, v):
        if not v:
            raise ValueError("Must have at least one scene")
        if len(v) > 20:
            raise ValueError("Too many scenes (max 20)")
        return v


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=10, max_length=2000)


class GenerateResponse(BaseModel):
    success: bool
    message: str
    video_url: Optional[str] = None