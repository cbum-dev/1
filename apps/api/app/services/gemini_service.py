from google import genai   # ✅ CHANGED (was google.generativeai)
import json
from ..config import get_settings
from ..models import AnimationIR

settings = get_settings()

client = genai.Client(api_key=settings.GEMINI_API_KEY)


SYSTEM_PROMPT = """You are a JSON generation engine for 2D animations. Your ONLY job is to output valid JSON.

RULES:
1. Output ONLY valid JSON. No markdown, no code blocks, no explanations.
2. Follow the exact schema structure provided.
3. Each scene should be 3-8 seconds long.
4. Use simple, clear animations.
5. Maximum 5 objects per scene.
6. Keep positions within bounds: x: [-6, 6], y: [-3, 3]
7. Colors must be in hex format (e.g., "#ff0000")
8. All timing values must be non-negative numbers

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

Remember: Output ONLY the JSON object. No other text.
"""


class GeminiService:
    def __init__(self):
        self.model = "models/gemini-flash-lite-latest"

    def generate_animation_json(self, user_prompt: str) -> AnimationIR:
        """
        Calls Gemini to convert text prompt to JSON IR.
        Strictly validates output against schema.
        """
        full_prompt = f"{SYSTEM_PROMPT}\n\nUSER PROMPT:\n{user_prompt}\n\nOUTPUT (JSON only):"

        try:
            response = client.models.generate_content(
                model=self.model,
                contents=full_prompt,
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
