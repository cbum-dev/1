import subprocess
import os
from pathlib import Path
from ..config import get_settings

settings = get_settings()


class VideoService:
    """Service to merge video chunks using FFmpeg"""
    
    def merge_videos(self, video_files: list[str], output_path: str) -> str:
        """
        Merge multiple video files into one using FFmpeg.
        Returns path to final video.
        """
        if len(video_files) == 1:
            os.rename(video_files[0], output_path)
            return output_path
        
        concat_file = os.path.join(settings.TEMP_DIR, "concat_list.txt")
        with open(concat_file, 'w') as f:
            for video_file in video_files:
                f.write(f"file '{video_file}'\n")
        
        # FFmpeg concat command
        cmd = [
            'ffmpeg',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_file,
            '-c', 'copy',
            output_path,
            '-y'  # Overwrite output
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return output_path
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"FFmpeg merge failed: {e.stderr.decode()}")
        finally:
            if os.path.exists(concat_file):
                os.remove(concat_file)
            for video_file in video_files:
                if os.path.exists(video_file):
                    os.remove(video_file)
    
    def add_audio_track(self, video_path: str, audio_path: str, output_path: str) -> str:
        """
        Merge video and audio files.
        Trims to the shortest stream (usually video).
        """
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-i', audio_path,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-shortest',
            output_path,
            '-y'
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return output_path
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"FFmpeg audio merge failed: {e.stderr.decode()}")
            
    def cleanup_file(self, file_path: str):
        """Delete a file if it exists"""
        if os.path.exists(file_path):
            os.remove(file_path)