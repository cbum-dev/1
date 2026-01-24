import os
import uuid
from gtts import gTTS
from ..config import get_settings

settings = get_settings()

class AudioService:
    """Service to handle audio generation (TTS) and processing."""

    def __init__(self):
        os.makedirs(settings.TEMP_DIR, exist_ok=True)

    def generate_voiceover(self, text: str, lang: str = "en") -> str:
        """
        Generate MP3 voiceover from text using gTTS.
        Returns the path to the generated file.
        """
        if not text or not text.strip():
            raise ValueError("Text content is empty")

        filename = f"voiceover_{uuid.uuid4()}.mp3"
        output_path = os.path.join(settings.TEMP_DIR, filename)

        try:
            tts = gTTS(text=text, lang=lang, slow=False)
            tts.save(output_path)
            return output_path
        except Exception as e:
            raise RuntimeError(f"TTS generation failed: {str(e)}")

    def cleanup_audio(self, filepath: str):
        """Delete audio file."""
        if os.path.exists(filepath):
            os.remove(filepath)