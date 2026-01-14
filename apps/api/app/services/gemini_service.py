from google import genai
import json
from ..config import get_settings
from ..models import AnimationIR

settings = get_settings()

client = genai.Client(api_key=settings.GEMINI_API_KEY)


SYSTEM_PROMPT = """You are a JSON generation engine for 2D animations. Your ONLY job is to output valid JSON.

CRITICAL RULES:
1. Output ONLY valid JSON. No markdown, no code blocks, no explanations.
2. Follow the exact schema structure provided.
3. Each scene should be 3-8 seconds long.
4. Use simple, clear animations.
5. Maximum 5 objects per scene.
6. Keep positions within bounds: x: [-6, 6], y: [-3, 3]
7. Colors must be in hex format (e.g., "#ff0000")
8. All timing values must be non-negative numbers
9. ONLY use the animation types listed below - NO OTHER TYPES ALLOWED

ALLOWED ANIMATION TYPES (USE ONLY THESE):
- "write": For text objects (animates writing text)
- "create": For shapes (creates/draws the shape)
- "fade_in": Fades object in
- "fade_out": Fades object out
- "move_to": Moves object to new position (MUST include "target_position": [x, y, z])
- "scale": Scales object (MUST include "scale_factor": number)
- "rotate": Rotates object (MUST include "angle": degrees)

DO NOT USE: "translate", "color_change", "transform", "morph", or any other animation types not listed above.

IMPORTANT NOTES:
- To move an object, use "move_to" with "target_position"
- Color changes are NOT supported - create objects with final colors
- For appearing effects, use "create" or "fade_in"
- For disappearing effects, use "fade_out"

SCHEMA:
{
  "version": "1.0",
  "metadata": {
    "title": "string",
    "duration_estimate": 0.0,
    "total_scenes": 0
  },
  "scenes": [
    {
      "scene_id": "unique_string",
      "duration": 5.0,
      "background_color": "#1a1a2e",
      "objects": [
        {
          "type": "text",
          "id": "unique_id",
          "content": "text content",
          "position": [0, 0, 0],
          "font_size": 36,
          "color": "#ffffff",
          "fill_opacity": 1.0,
          "animations": [
            {
              "type": "write",
              "start_time": 0.0,
              "duration": 2.0
            }
          ]
        }
      ]
    }
  ]
}

OBJECT TYPES:
- "text": Requires "content", "font_size"
- "shape": Requires "shape" (circle/square/rectangle/triangle)
  - circle: requires "radius"
  - square: requires "side_length"
  - rectangle: requires "width", "height"
  - triangle: auto-sized
- "latex": Requires "content" (LaTeX formula)

EXAMPLES:

Example 1 - Moving circle:
{
  "version": "1.0",
  "metadata": {"title": "Moving Circle", "duration_estimate": 5.0, "total_scenes": 1},
  "scenes": [{
    "scene_id": "scene_1",
    "duration": 5.0,
    "background_color": "#1a1a2e",
    "objects": [{
      "type": "shape",
      "id": "circle1",
      "shape": "circle",
      "radius": 1.0,
      "position": [-3, 0, 0],
      "color": "#00d9ff",
      "fill_opacity": 0.8,
      "animations": [
        {"type": "create", "start_time": 0.0, "duration": 1.0},
        {"type": "move_to", "start_time": 1.5, "duration": 2.5, "target_position": [3, 0, 0]}
      ]
    }]
  }]
}

Example 2 - Text appearing:
{
  "version": "1.0",
  "metadata": {"title": "Hello Text", "duration_estimate": 4.0, "total_scenes": 1},
  "scenes": [{
    "scene_id": "scene_1",
    "duration": 4.0,
    "background_color": "#1a1a2e",
    "objects": [{
      "type": "text",
      "id": "hello",
      "content": "Hello World",
      "position": [0, 0, 0],
      "font_size": 48,
      "color": "#ffffff",
      "fill_opacity": 1.0,
      "animations": [
        {"type": "write", "start_time": 0.0, "duration": 2.0},
        {"type": "fade_out", "start_time": 3.0, "duration": 1.0}
      ]
    }]
  }]
}

Remember: Output ONLY the JSON object. No other text. Use ONLY the allowed animation types."""


class GeminiService:
    def __init__(self):
        self.client = client
        self.model = "models/gemini-flash-lite-latest"
    
    def generate_animation_json(self, user_prompt: str) -> AnimationIR:
        """
        Calls Gemini to convert text prompt to JSON IR.
        Strictly validates output against schema.
        """
        full_prompt = f"{SYSTEM_PROMPT}\n\nUSER PROMPT:\n{user_prompt}\n\nOUTPUT (JSON only):"
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_prompt,
                config={
                    "temperature": 0.7,
                    "max_output_tokens": 4096,
                }
            )
            
            raw_output = response.text.strip()
            
            if raw_output.startswith("```json"):
                raw_output = raw_output[7:]
            if raw_output.startswith("```"):
                raw_output = raw_output[3:]
            if raw_output.endswith("```"):
                raw_output = raw_output[:-3]
            
            raw_output = raw_output.strip()
            
            json_data = json.loads(raw_output)
            animation_ir = AnimationIR(**json_data)
            
            return animation_ir
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Gemini output was not valid JSON: {e}")
        except Exception as e:
            raise ValueError(f"Failed to generate valid animation IR: {e}")