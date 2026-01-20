import asyncio
from typing import Optional
from datetime import datetime
from ..models import RenderJob, RenderJobStatus, AnimationIR
from .manim_service import ManimService
from .video_service import VideoService
from .audio_service import AudioService
from ..config import get_settings

settings = get_settings()

JOB_QUEUE: dict[str, RenderJob] = {}


class JobQueueService:
    def __init__(self):
        self.manim_service = ManimService()
        self.video_service = VideoService()
        self.audio_service = AudioService()
        self.max_concurrent_jobs = 3
        self.current_jobs = 0
    
    def create_render_job(
        self,
        user_id: str,
        animation_ir: AnimationIR,
        output_format: str = "mp4",
        quality: str = "medium",
        project_id: Optional[str] = None,
        include_voiceover: bool = False,
        voiceover_text: Optional[str] = None,
        voiceover_voice: str = "alloy",
        include_music: bool = False,
        music_mood: str = "corporate",
        music_volume: float = 0.2
    ) -> RenderJob:
        """Create a new render job"""
        total_duration = sum(scene.duration for scene in animation_ir.scenes)
        estimated_render_time = total_duration * 2 
        
        job = RenderJob(
            user_id=user_id,
            project_id=project_id,
            animation_ir=animation_ir,
            output_format=output_format,
            quality=quality,
            estimated_duration=estimated_render_time,
            include_voiceover=include_voiceover,
            voiceover_text=voiceover_text,
            voiceover_voice=voiceover_voice,
            include_music=include_music,
            music_mood=music_mood,
            music_volume=music_volume
        )
        
        JOB_QUEUE[job.id] = job
        

        asyncio.create_task(self._process_job(job.id))
        
        return job
    
    async def _process_job(self, job_id: str):
        """Process a render job asynchronously"""
        job = JOB_QUEUE.get(job_id)
        if not job:
            return
        
        while self.current_jobs >= self.max_concurrent_jobs:
            await asyncio.sleep(1)
        
        try:
            self.current_jobs += 1
            job.status = RenderJobStatus.PROCESSING
            job.started_at = datetime.utcnow()
            

            video_files = self.manim_service.render_scenes(job.animation_ir)
            

            import os
            output_path = os.path.join(
                settings.TEMP_DIR,
                f"job_{job_id}.mp4"
            )
            
            final_video = self.video_service.merge_videos(video_files, output_path)
            

            if job.include_voiceover or job.include_music:
                voiceover_text = job.voiceover_text
                

                if job.include_voiceover and not voiceover_text:
                    from ..models import AnimationIR
                    desc = self._generate_animation_description(job.animation_ir)
                    voiceover_text = self.audio_service.generate_voiceover_script(desc)
                
                music_path = None
                if job.include_music:
                    music_path = self.audio_service.get_stock_music(job.music_mood)
                
                final_video = self.audio_service.add_audio_complete(
                    final_video,
                    voiceover_text=voiceover_text if job.include_voiceover else None,
                    music_path=music_path if job.include_music else None,
                    voice=job.voiceover_voice,
                    music_volume=job.music_volume
                )
            

            if job.output_format == "gif":
                final_video = self._convert_to_gif(final_video)
            elif job.output_format == "webm":
                final_video = self._convert_to_webm(final_video)
            
            job.video_url = final_video
            job.status = RenderJobStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            
        except Exception as e:
            job.status = RenderJobStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
        
        finally:
            self.current_jobs -= 1
    
    def _generate_animation_description(self, animation_ir) -> str:
        """Generate description for voiceover generation"""
        parts = [f"This is {animation_ir.metadata.get('title', 'an animation')}."]
        for i, scene in enumerate(animation_ir.scenes, 1):
            parts.append(f"Scene {i} shows {len(scene.objects)} elements.")
        return " ".join(parts)
    
    def get_job_status(self, job_id: str) -> Optional[RenderJob]:
        """Get the status of a render job"""
        return JOB_QUEUE.get(job_id)
    
    def get_user_jobs(self, user_id: str) -> list[RenderJob]:
        """Get all jobs for a user"""
        return [job for job in JOB_QUEUE.values() if job.user_id == user_id]
    
    def cancel_job(self, job_id: str, user_id: str) -> bool:
        """Cancel a pending or processing job"""
        job = JOB_QUEUE.get(job_id)
        if not job or job.user_id != user_id:
            return False
        
        if job.status in [RenderJobStatus.PENDING, RenderJobStatus.PROCESSING]:
            job.status = RenderJobStatus.FAILED
            job.error_message = "Cancelled by user"
            job.completed_at = datetime.utcnow()
            return True
        
        return False
    
    def _convert_to_gif(self, mp4_path: str) -> str:
        """Convert MP4 to GIF using FFmpeg"""
        import subprocess
        import os
        
        gif_path = mp4_path.replace('.mp4', '.gif')
        

        cmd = [
            'ffmpeg',
            '-i', mp4_path,
            '-vf', 'fps=15,scale=640:-1:flags=lanczos',
            '-c:v', 'gif',
            gif_path,
            '-y'
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        

        if os.path.exists(mp4_path):
            os.remove(mp4_path)
        
        return gif_path
    
    def _convert_to_webm(self, mp4_path: str) -> str:
        """Convert MP4 to WebM using FFmpeg"""
        import subprocess
        import os
        
        webm_path = mp4_path.replace('.mp4', '.webm')
        
        cmd = [
            'ffmpeg',
            '-i', mp4_path,
            '-c:v', 'libvpx-vp9',
            '-crf', '30',
            '-b:v', '0',
            webm_path,
            '-y'
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        

        if os.path.exists(mp4_path):
            os.remove(mp4_path)
        
        return webm_path