from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pathlib import Path

from .models import GenerateRequest, GenerateResponse
from .services.gemini_service import GeminiService
from .services.manim_service import ManimService
from .services.video_service import VideoService
from .config import get_settings

settings = get_settings()

app = FastAPI(
    title="Text to Animation API",
    description="Convert natural language to 2D animations",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
gemini_service = GeminiService()
manim_service = ManimService()
video_service = VideoService()


@app.get("/")
async def root():
    return {"message": "Text to Animation API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/generate")
async def generate_animation(request: GenerateRequest):
    """
    Main endpoint: text → Gemini → JSON IR → Manim → FFmpeg → MP4
    """
    try:
        print(f"Generating JSON IR for prompt: {request.prompt[:100]}...")
        animation_ir = gemini_service.generate_animation_json(request.prompt)
        print(f"Generated IR with {len(animation_ir.scenes)} scenes")
        
        print("Rendering scenes with Manim...")
        video_files = manim_service.render_scenes(animation_ir)
        print(f"Rendered {len(video_files)} video files")
        
        final_video_id = str(uuid.uuid4())
        final_video_path = os.path.join(
            settings.TEMP_DIR,
            f"final_{final_video_id}.mp4"
        )
        
        print("Merging videos...")
        video_service.merge_videos(video_files, final_video_path)
        print(f"Final video saved to: {final_video_path}")
        
        return FileResponse(
            final_video_path,
            media_type="video/mp4",
            filename=f"animation_{final_video_id}.mp4",
            background=lambda: video_service.cleanup_file(final_video_path)
        )
        
    except ValueError as e:
        print(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Generation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.post("/generate-json")
async def generate_json_only(request: GenerateRequest):
    """
    Debug endpoint: Returns only the JSON IR without rendering
    """
    try:
        animation_ir = gemini_service.generate_animation_json(request.prompt)
        return JSONResponse(content=animation_ir.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)