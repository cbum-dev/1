from google import genai
import json
from ..config import get_settings
from ..models import AnimationIR, ChatMessage

settings = get_settings()
client = genai.Client(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = settings.SYSTEM_PROMPT
MODIFICATION_PROMPT_TEMPLATE = settings.MODIFICATION_PROMPT_TEMPLATE


class GeminiService:
    def __init__(self):
        self.client = client
        self.model = "models/gemini-flash-lite-latest"
    
    def generate_animation_json(self, user_prompt: str) -> AnimationIR:
        """
        Generate a NEW animation from scratch.
        """
        full_prompt = f"{SYSTEM_PROMPT}\n\nUSER REQUEST:\n{user_prompt}\n\nOUTPUT (JSON only):"
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_prompt,
                config={
                    "temperature": 0.7,
                    "max_output_tokens": 4096,
                }
            )
            
            raw_output = self._clean_output(response.text)
            json_data = json.loads(raw_output)
            animation_ir = AnimationIR(**json_data)
            
            return animation_ir
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Gemini output was not valid JSON: {e}")
        except Exception as e:
            raise ValueError(f"Failed to generate valid animation IR: {e}")
    
    def modify_animation_json(
        self, 
        user_request: str, 
        current_animation: AnimationIR
    ) -> AnimationIR:
        """
        MODIFY an existing animation based on user request.
        """
        current_json = json.dumps(current_animation.model_dump(), indent=2)
        
        full_prompt = MODIFICATION_PROMPT_TEMPLATE.format(
            current_animation=current_json,
            user_request=user_request
        )
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_prompt,
                config={
                    "temperature": 0.7,
                    "max_output_tokens": 4096,
                }
            )
            
            raw_output = self._clean_output(response.text)
            json_data = json.loads(raw_output)
            animation_ir = AnimationIR(**json_data)
            
            return animation_ir
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Gemini output was not valid JSON: {e}")
        except Exception as e:
            raise ValueError(f"Failed to modify animation IR: {e}")
    
    def generate_conversational_response(
        self,
        user_message: str,
        conversation_history: list[ChatMessage],
        current_animation: AnimationIR | None
    ) -> tuple[str, AnimationIR]:
        """
        Generate response in conversational mode.
        Returns (assistant_message, updated_animation)
        """
        if current_animation:
            updated_animation = self.modify_animation_json(user_message, current_animation)
            assistant_message = self._generate_modification_message(user_message, updated_animation)
        else:
            updated_animation = self.generate_animation_json(user_message)
            assistant_message = self._generate_creation_message(updated_animation)
        
        return assistant_message, updated_animation
    
    def _generate_creation_message(self, animation: AnimationIR) -> str:
        """Generate a friendly message for new animations"""
        scene_count = len(animation.scenes)
        object_count = sum(len(scene.objects) for scene in animation.scenes)
        duration = animation.metadata.get('duration_estimate', 0)
        
        return f"I've created a new animation with {scene_count} scene(s) and {object_count} object(s), running for about {duration:.1f} seconds. You can preview it or ask me to modify anything!"
    
    def _generate_modification_message(self, request: str, animation: AnimationIR) -> str:
        """Generate a friendly message for modifications"""
        return f"I've updated the animation based on your request. The changes have been applied!"
    
    def _clean_output(self, raw_output: str) -> str:
        """Clean markdown artifacts from output"""
        raw_output = raw_output.strip()
        
        if raw_output.startswith("```json"):
            raw_output = raw_output[7:]
        if raw_output.startswith("```"):
            raw_output = raw_output[3:]
        if raw_output.endswith("```"):
            raw_output = raw_output[:-3]
        
        return raw_output.strip()