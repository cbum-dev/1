from manim import *
import os
import subprocess
from pathlib import Path
from ..models import AnimationIR, Scene as SceneModel, AnimationObject
from ..config import get_settings

settings = get_settings()


class ManimService:
    """Service to render individual scenes using Manim"""
    
    def __init__(self):
        self.quality = settings.MANIM_QUALITY
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
    
    def render_scene(self, scene_data: SceneModel, scene_index: int) -> str:
        """
        Render a single scene to video file.
        Returns path to rendered video.
        """
        temp_scene_file = os.path.join(
            settings.TEMP_DIR,
            f"temp_scene_{scene_index}.py"
        )
        
        output_name = f"scene_{scene_index:03d}_{scene_data.scene_id}"
        
        scene_code = self._generate_scene_code(scene_data, scene_index)
        with open(temp_scene_file, 'w') as f:
            f.write(scene_code)
        
        cmd = [
            'manim',
            '-ql',
            '--disable_caching',
            '-o', f'{output_name}.mp4',
            temp_scene_file,
            f'DynamicScene{scene_index}'
        ]
        
        try:
            result = subprocess.run(
                cmd,
                cwd=settings.TEMP_DIR,
                capture_output=True,
                text=True,
                check=True
            )
            
            output_file = os.path.join(
                settings.TEMP_DIR,
                'media', 'videos', f'temp_scene_{scene_index}', '480p15',
                f'{output_name}.mp4'
            )
            
            final_path = os.path.join(settings.TEMP_DIR, f'{output_name}.mp4')
            if os.path.exists(output_file):
                os.rename(output_file, final_path)
                return final_path
            else:
                raise RuntimeError(f"Output file not found: {output_file}")
                
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Manim rendering failed: {e.stderr}")
        finally:
            if os.path.exists(temp_scene_file):
                os.remove(temp_scene_file)
    
    def _generate_scene_code(self, scene_data: SceneModel, scene_index: int) -> str:
        """Generate Python code for a Manim scene"""
        code = f"""from manim import *

class DynamicScene{scene_index}(Scene):
    def construct(self):
        self.camera.background_color = "{scene_data.background_color}"
        
"""
        
        for obj in scene_data.objects:
            code += f"        # Object: {obj.id}\n"
            code += f"        {obj.id} = {self._generate_object_code(obj)}\n"
        
        code += "\n        # Animations\n"
        animations_timeline = []
        for obj in scene_data.objects:
            for anim in obj.animations:
                animations_timeline.append((anim.start_time, obj.id, anim))
        
        animations_timeline.sort(key=lambda x: x[0])
        
        current_time = 0.0
        for start_time, obj_id, anim in animations_timeline:
            wait_time = start_time - current_time
            if wait_time > 0.01:
                code += f"        self.wait({wait_time})\n"
                current_time = start_time
            
            anim_code = self._generate_animation_code(obj_id, anim)
            if anim_code:
                code += f"        {anim_code}\n"
                current_time += anim.duration
        
        remaining = scene_data.duration - current_time
        if remaining > 0.01:
            code += f"        self.wait({remaining})\n"
        
        return code
    
    def _generate_object_code(self, obj: AnimationObject) -> str:
        """Generate code to create a Manim object"""
        pos = obj.position or [0, 0, 0]
        
        if obj.type == "text":
            content = obj.content.replace('"', '\\"') if obj.content else ""
            return f'Text("{content}", font_size={obj.font_size}, color="{obj.color}").move_to([{pos[0]}, {pos[1]}, {pos[2]}])'
        elif obj.type == "latex":
            content = obj.content.replace('"', '\\"') if obj.content else "x"
            return f'MathTex("{content}", color="{obj.color}").move_to([{pos[0]}, {pos[1]}, {pos[2]}])'
        elif obj.type == "shape":
            if obj.shape == "circle":
                return f'Circle(radius={obj.radius or 1.0}, color="{obj.color}", fill_opacity={obj.fill_opacity}).move_to([{pos[0]}, {pos[1]}, {pos[2]}])'
            elif obj.shape == "square":
                return f'Square(side_length={obj.side_length or 2.0}, color="{obj.color}", fill_opacity={obj.fill_opacity}).move_to([{pos[0]}, {pos[1]}, {pos[2]}])'
            elif obj.shape == "rectangle":
                return f'Rectangle(width={obj.width or 2.0}, height={obj.height or 1.0}, color="{obj.color}", fill_opacity={obj.fill_opacity}).move_to([{pos[0]}, {pos[1]}, {pos[2]}])'
            elif obj.shape == "triangle":
                return f'Triangle(color="{obj.color}", fill_opacity={obj.fill_opacity}).move_to([{pos[0]}, {pos[1]}, {pos[2]}])'
        
        return f'Dot(color="{obj.color}").move_to([{pos[0]}, {pos[1]}, {pos[2]}])'
    
    def _generate_animation_code(self, obj_id: str, anim) -> str:
        """Generate code for a Manim animation"""
        if anim.type == "write":
            return f'self.play(Write({obj_id}), run_time={anim.duration})'
        elif anim.type == "create":
            return f'self.play(Create({obj_id}), run_time={anim.duration})'
        elif anim.type == "fade_in":
            return f'self.play(FadeIn({obj_id}), run_time={anim.duration})'
        elif anim.type == "fade_out":
            return f'self.play(FadeOut({obj_id}), run_time={anim.duration})'
        elif anim.type == "move_to" and anim.target_position:
            pos = anim.target_position
            return f'self.play({obj_id}.animate.move_to([{pos[0]}, {pos[1]}, {pos[2]}]), run_time={anim.duration})'
        elif anim.type == "scale":
            return f'self.play({obj_id}.animate.scale({anim.scale_factor or 1.0}), run_time={anim.duration})'
        elif anim.type == "rotate":
            return f'self.play(Rotate({obj_id}, angle={anim.angle or 0.0}*DEGREES), run_time={anim.duration})'
        return ""
    
    def render_scenes(self, animation_ir: AnimationIR) -> list[str]:
        """
        Render all scenes from IR.
        Returns list of video file paths.
        """
        video_files = []
        
        for i, scene in enumerate(animation_ir.scenes):
            video_file = self.render_scene(scene, i)
            video_files.append(video_file)
        
        return video_files
    
    def generate_full_code(self, animation_ir: AnimationIR) -> str:
        """
        Generate complete Manim Python code for all scenes.
        Returns the full code as a string without rendering.
        """
        code_parts = ["from manim import *\n\n"]
        
        for i, scene in enumerate(animation_ir.scenes):
            code_parts.append(self._generate_scene_code(scene, i))
            code_parts.append("\n\n")
        
        code_parts.append('if __name__ == "__main__":\n')
        code_parts.append('    # Render all scenes\n')
        for i in range(len(animation_ir.scenes)):
            code_parts.append(f'    # scene = DynamicScene{i}()\n')
            code_parts.append(f'    # scene.render()\n')
        
        return "".join(code_parts)