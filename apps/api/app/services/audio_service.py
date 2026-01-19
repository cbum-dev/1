import subprocess
import os
from typing import Optional, Literal
from google import genai
from ..config import get_settings

settings = get_settings()
client = genai.Client(api_key=settings.GEMINI_API_KEY)


class AudioService:
    """Service for adding voiceover and background music to animations"""
    
    def __init__(self):
        self.temp_dir = settings.TEMP_DIR
        os.makedirs(self.temp_dir, exist_ok=True)
    
    def generate_voiceover_script(self, animation_description: str) -> str:
        """
        Use Gemini to generate a voiceover script based on animation description
        """
        prompt = f"""Generate a natural, engaging voiceover script for this animation:

{animation_description}

Requirements:
- Keep it concise (30-60 seconds when spoken)
- Natural, conversational tone
- Match the animation timing
- No stage directions, just the spoken words
- Professional but friendly

Output ONLY the script text, nothing else:"""
        
        try:
            response = client.models.generate_content(
                model="models/gemini-flash-lite-latest",
                contents=prompt,
                config={"temperature": 0.8, "max_output_tokens": 500}
            )
            return response.text.strip()
        except Exception as e:
            print(f"Voiceover script generation failed: {e}")
            return ""
    
    def generate_tts_audio(
        self, 
        text: str, 
        voice: Literal["alloy", "echo", "fable", "onyx", "nova", "shimmer"] = "alloy",
        output_path: Optional[str] = None
    ) -> str:
        """
        Generate text-to-speech audio using OpenAI TTS
        Note: This requires OpenAI API key. For demo, we'll use a simple implementation.
        In production, integrate with OpenAI, ElevenLabs, or Google Cloud TTS.
        """
        if not output_path:
            output_path = os.path.join(self.temp_dir, f"tts_{os.urandom(8).hex()}.mp3")
        
        # TODO: Replace with actual TTS service
        # For now, create a silent audio file as placeholder
        self._create_silent_audio(output_path, duration=5.0)
        
        return output_path
    
    def add_voiceover_to_video(
        self, 
        video_path: str, 
        audio_path: str,
        output_path: Optional[str] = None,
        audio_volume: float = 1.0
    ) -> str:
        """
        Add voiceover audio to video using FFmpeg
        """
        if not output_path:
            output_path = video_path.replace('.mp4', '_with_audio.mp4')
        
        # FFmpeg command to merge video and audio
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-i', audio_path,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-filter:a', f'volume={audio_volume}',
            '-shortest',  # Match shortest stream
            output_path,
            '-y'
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return output_path
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Failed to add audio: {e.stderr.decode()}")
    
    def add_background_music(
        self,
        video_path: str,
        music_path: str,
        output_path: Optional[str] = None,
        music_volume: float = 0.3,
        fade_in: float = 2.0,
        fade_out: float = 2.0
    ) -> str:
        """
        Add background music to video with fade in/out
        """
        if not output_path:
            output_path = video_path.replace('.mp4', '_with_music.mp4')
        
        # Get video duration
        duration = self._get_video_duration(video_path)
        
        # FFmpeg command with audio mixing and fading
        audio_filter = f"volume={music_volume},afade=t=in:st=0:d={fade_in},afade=t=out:st={duration-fade_out}:d={fade_out}"
        
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-i', music_path,
            '-filter_complex',
            f"[1:a]{audio_filter}[music];[0:a][music]amix=inputs=2:duration=first[aout]",
            '-map', '0:v',
            '-map', '[aout]',
            '-c:v', 'copy',
            '-c:a', 'aac',
            output_path,
            '-y'
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return output_path
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Failed to add music: {e.stderr.decode()}")
    
    def add_audio_complete(
        self,
        video_path: str,
        voiceover_text: Optional[str] = None,
        music_path: Optional[str] = None,
        voice: str = "alloy",
        music_volume: float = 0.2,
        voiceover_volume: float = 1.0
    ) -> str:
        """
        Complete audio pipeline: voiceover + background music
        """
        current_video = video_path
        
        # Add voiceover if provided
        if voiceover_text:
            audio_path = self.generate_tts_audio(voiceover_text, voice=voice)
            current_video = self.add_voiceover_to_video(
                current_video,
                audio_path,
                audio_volume=voiceover_volume
            )
            # Cleanup temp audio
            if os.path.exists(audio_path):
                os.remove(audio_path)
        
        # Add background music if provided
        if music_path:
            current_video = self.add_background_music(
                current_video,
                music_path,
                music_volume=music_volume
            )
        
        return current_video
    
    def get_stock_music(self, mood: Literal["upbeat", "calm", "dramatic", "corporate"]) -> str:
        """
        Get path to stock music based on mood.
        In production, integrate with stock music APIs or CDN.
        """
        # TODO: Implement stock music library
        # For now, return placeholder path
        stock_music = {
            "upbeat": "/path/to/upbeat.mp3",
            "calm": "/path/to/calm.mp3",
            "dramatic": "/path/to/dramatic.mp3",
            "corporate": "/path/to/corporate.mp3"
        }
        return stock_music.get(mood, stock_music["corporate"])
    
    def _get_video_duration(self, video_path: str) -> float:
        """Get video duration using ffprobe"""
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            video_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return float(result.stdout.strip())
        except:
            return 10.0  # Default fallback
    
    def _create_silent_audio(self, output_path: str, duration: float):
        """Create silent audio file (placeholder for TTS)"""
        cmd = [
            'ffmpeg',
            '-f', 'lavfi',
            '-i', f'anullsrc=r=44100:cl=stereo',
            '-t', str(duration),
            '-q:a', '9',
            '-acodec', 'libmp3lame',
            output_path,
            '-y'
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
        except:
            pass  # Fallback if ffmpeg fails