from typing import List, Optional
from ..models import AnimationTemplate, AnimationIR, Scene, AnimationObject, Animation

TEMPLATES: dict[str, AnimationTemplate] = {}


class TemplateService:
    def __init__(self):
        self._initialize_templates()
    
    def _initialize_templates(self):
        """Initialize built-in templates"""
        TEMPLATES.clear()

        logo_reveal = AnimationTemplate(
            id="logo_reveal",
            name="Logo Reveal",
            description="Simple logo reveal animation with fade and scale",
            category="logo",
            is_premium=False,
            animation_ir=AnimationIR(
                version="1.0",
                metadata={
                    "title": "Logo Reveal",
                    "duration_estimate": 3.0,
                    "total_scenes": 1
                },
                scenes=[
                    Scene(
                        scene_id="scene_1",
                        duration=3.0,
                        background_color="#000000",
                        objects=[
                            AnimationObject(
                                type="text",
                                id="logo",
                                content="YOUR LOGO",
                                position=[0, 0, 0],
                                font_size=72,
                                color="#ffffff",
                                fill_opacity=0.0,
                                animations=[
                                    Animation(type="fade_in", start_time=0.0, duration=1.5),
                                    Animation(type="scale", start_time=0.0, duration=1.5, scale_factor=1.5)
                                ]
                            )

                        ]
                    )
                ]
            )
        )

        title_card = AnimationTemplate(
            id="title_card",
            name="Title Card",
            description="Professional title card with subtitle",
            category="presentation",
            is_premium=False,
            animation_ir=AnimationIR(
                version="1.0",
                metadata={
                    "title": "Title Card",
                    "duration_estimate": 4.0,
                    "total_scenes": 1
                },
                scenes=[
                    Scene(
                        scene_id="scene_1",
                        duration=4.0,
                        background_color="#1a1a2e",
                        objects=[
                            AnimationObject(
                                type="text",
                                id="title",
                                content="Main Title",
                                position=[0, 1, 0],
                                font_size=64,
                                color="#00d9ff",
                                animations=[
                                    Animation(type="write", start_time=0.0, duration=1.5)
                                ]
                            ),
                            AnimationObject(
                                type="text",
                                id="subtitle",
                                content="Subtitle Here",
                                position=[0, -1, 0],
                                font_size=32,
                                color="#ffffff",
                                animations=[
                                    Animation(type="fade_in", start_time=1.5, duration=1.0)
                                ]
                            )
                        ]
                    )
                ]
            )
        )

        loading = AnimationTemplate(
            id="loading",
            name="Loading Animation",
            description="Circular loading indicator",
            category="social",
            is_premium=False,
            animation_ir=AnimationIR(
                version="1.0",
                metadata={
                    "title": "Loading",
                    "duration_estimate": 3.0,
                    "total_scenes": 1
                },
                scenes=[
                    Scene(
                        scene_id="scene_1",
                        duration=3.0,
                        background_color="#1a1a2e",
                        objects=[
                            AnimationObject(
                                type="shape",
                                id="spinner",
                                shape="circle",
                                radius=1.5,
                                position=[0, 0, 0],
                                color="#00d9ff",
                                fill_opacity=0.0,
                                stroke_width=4.0,
                                animations=[
                                    Animation(type="rotate", start_time=0.0, duration=3.0, angle=360)
                                ]
                            )
                        ]
                    )
                ]
            )
        )

        three_steps = AnimationTemplate(
            id="three_steps",
            name="Three Steps",
            description="Animated three-step process visualization",
            category="explainer",
            is_premium=True,
            animation_ir=AnimationIR(
                version="1.0",
                metadata={
                    "title": "Three Steps",
                    "duration_estimate": 9.0,
                    "total_scenes": 3
                },
                scenes=[
                    Scene(
                        scene_id="step_1",
                        duration=3.0,
                        background_color="#1a1a2e",
                        objects=[
                            AnimationObject(
                                type="shape",
                                id="circle_1",
                                shape="circle",
                                radius=1.0,
                                position=[-3, 0, 0],
                                color="#00d9ff",
                                fill_opacity=0.8,
                                animations=[
                                    Animation(type="create", start_time=0.0, duration=1.0)
                                ]
                            ),
                            AnimationObject(
                                type="text",
                                id="step_1_text",
                                content="Step 1",
                                position=[-3, -2, 0],
                                font_size=36,
                                color="#ffffff",
                                animations=[
                                    Animation(type="write", start_time=1.0, duration=1.0)
                                ]
                            )
                        ]
                    ),
                    Scene(
                        scene_id="step_2",
                        duration=3.0,
                        background_color="#1a1a2e",
                        objects=[
                            AnimationObject(
                                type="shape",
                                id="square_2",
                                shape="square",
                                side_length=2.0,
                                position=[0, 0, 0],
                                color="#ff6b6b",
                                fill_opacity=0.8,
                                animations=[
                                    Animation(type="create", start_time=0.0, duration=1.0)
                                ]
                            ),
                            AnimationObject(
                                type="text",
                                id="step_2_text",
                                content="Step 2",
                                position=[0, -2, 0],
                                font_size=36,
                                color="#ffffff",
                                animations=[
                                    Animation(type="write", start_time=1.0, duration=1.0)
                                ]
                            )
                        ]
                    ),
                    Scene(
                        scene_id="step_3",
                        duration=3.0,
                        background_color="#1a1a2e",
                        objects=[
                            AnimationObject(
                                type="shape",
                                id="triangle_3",
                                shape="triangle",
                                position=[3, 0, 0],
                                color="#4ecdc4",
                                fill_opacity=0.8,
                                animations=[
                                    Animation(type="create", start_time=0.0, duration=1.0)
                                ]
                            ),
                            AnimationObject(
                                type="text",
                                id="step_3_text",
                                content="Step 3",
                                position=[3, -2, 0],
                                font_size=36,
                                color="#ffffff",
                                animations=[
                                    Animation(type="write", start_time=1.0, duration=1.0)
                                ]
                            )
                        ]
                    )
                ]
            )
        )

        for template in (logo_reveal, title_card, loading, three_steps):
            TEMPLATES[template.id] = template
    
    def get_all_templates(self, include_premium: bool = False) -> List[AnimationTemplate]:
        """Get all available templates"""
        if include_premium:
            return list(TEMPLATES.values())
        return [t for t in TEMPLATES.values() if not t.is_premium]
    
    def get_template_by_id(self, template_id: str) -> Optional[AnimationTemplate]:
        """Get a specific template by ID"""
        return TEMPLATES.get(template_id)
    
    def get_templates_by_category(
        self, 
        category: str, 
        include_premium: bool = False
    ) -> List[AnimationTemplate]:
        """Get templates filtered by category"""
        templates = self.get_all_templates(include_premium)
        return [t for t in templates if t.category == category]
    
    def apply_template(
        self, 
        template_id: str, 
        customizations: dict = None
    ) -> AnimationIR:
        """
        Apply a template and optionally customize it
        customizations format: {
            "text_replacements": {"YOUR LOGO": "My Company"},
            "color_scheme": {"#ffffff": "#ff0000"},
            "background_color": "#000000"
        }
        """
        template = self.get_template_by_id(template_id)
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        animation_ir = template.animation_ir.model_copy(deep=True)
        
        if not customizations:
            return animation_ir
        
        if "text_replacements" in customizations:
            for scene in animation_ir.scenes:
                for obj in scene.objects:
                    if obj.type == "text" and obj.content:
                        for old, new in customizations["text_replacements"].items():
                            obj.content = obj.content.replace(old, new)
        
        if "color_scheme" in customizations:
            for scene in animation_ir.scenes:
                for obj in scene.objects:
                    old_color = obj.color
                    if old_color in customizations["color_scheme"]:
                        obj.color = customizations["color_scheme"][old_color]
        
        if "background_color" in customizations:
            for scene in animation_ir.scenes:
                scene.background_color = customizations["background_color"]
        
        return animation_ir