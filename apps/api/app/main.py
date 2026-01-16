from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from datetime import datetime

from .models import (
    GenerateRequest, 
    GenerateResponse, 
    AnimationIR,
    ConversationRequest,
    ConversationResponse,
    ChatMessage
)
from .services.gemini_service import GeminiService
from .services.manim_service import ManimService
from .services.video_service import VideoService
from .config import get_settings

settings = get_settings()

app = FastAPI(
    title="Text to Animation API",
    description="Conversational 2D animation generation",
    version="2.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


gemini_service = GeminiService()
manim_service = ManimService()
video_service = VideoService()


@app.get("/")
async def root():
    return {"message": "Text to Animation API (Conversational)", "version": "2.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}




@app.post("/chat")
async def chat(request: ConversationRequest):
    """
    Conversational endpoint: User sends a message, gets back updated animation.
    Supports both creating new animations and modifying existing ones.
    """
    try:
        print(f"Chat request: {request.message[:100]}...")
        

        assistant_text, updated_animation = gemini_service.generate_conversational_response(
            user_message=request.message,
            conversation_history=request.conversation_history,
            current_animation=request.current_animation
        )
        

        manim_code = manim_service.generate_full_code(updated_animation)
        description = _generate_description(updated_animation)
        

        user_msg = ChatMessage(
            role="user",
            content=request.message,
            animation_state=request.current_animation
        )
        
        assistant_msg = ChatMessage(
            role="assistant",
            content=assistant_text,
            animation_state=updated_animation
        )
        
        updated_history = request.conversation_history + [user_msg, assistant_msg]
        
        return JSONResponse(content={
            "success": True,
            "assistant_message": assistant_text,
            "animation_ir": updated_animation.model_dump(),
            "manim_code": manim_code,
            "description": description,
            "validation": {
                "valid": True,
                "errors": []
            },
            "conversation_history": [msg.model_dump(mode='json') for msg in updated_history]
        })
        
    except ValueError as e:
        error_message = str(e)
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "assistant_message": f"Sorry, I encountered an error: {error_message}",
                "animation_ir": None,
                "manim_code": None,
                "description": None,
                "validation": {
                    "valid": False,
                    "errors": [error_message]
                },
                "conversation_history": [msg.model_dump(mode='json') for msg in request.conversation_history]
            }
        )
    except Exception as e:
        print(f"Chat failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@app.post("/render")
async def render_animation(animation_ir: AnimationIR):
    """
    Render an animation from JSON IR to video.
    This is separate from chat so users can iterate without re-rendering.
    """
    try:
        print("Rendering animation...")
        
    
        video_files = manim_service.render_scenes(animation_ir)
        
    
        final_video_id = str(uuid.uuid4())
        final_video_path = os.path.join(
            settings.TEMP_DIR,
            f"final_{final_video_id}.mp4"
        )
        
        video_service.merge_videos(video_files, final_video_path)
        
        
        return FileResponse(
            final_video_path,
            media_type="video/mp4",
            filename=f"animation_{final_video_id}.mp4",
            background=lambda: video_service.cleanup_file(final_video_path)
        )
        
    except Exception as e:
        print(f"Render failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Render failed: {str(e)}")



@app.post("/generate-plan")
async def generate_animation_plan(request: GenerateRequest):
    """Legacy endpoint: Generate plan without conversation"""
    try:
        animation_ir = gemini_service.generate_animation_json(request.prompt)
        manim_code = manim_service.generate_full_code(animation_ir)
        description = _generate_description(animation_ir)
        
        return JSONResponse(content={
            "success": True,
            "json_ir": animation_ir.model_dump(),
            "manim_code": manim_code,
            "description": description,
            "validation": {
                "valid": True,
                "errors": []
            }
        })
        
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "json_ir": None,
                "manim_code": None,
                "description": None,
                "validation": {
                    "valid": False,
                    "errors": [str(e)]
                }
            }
        )


@app.post("/generate")
async def generate_animation(request: GenerateRequest):
    """Legacy endpoint: Generate and render in one step"""
    try:
        animation_ir = gemini_service.generate_animation_json(request.prompt)
        video_files = manim_service.render_scenes(animation_ir)
        
        final_video_id = str(uuid.uuid4())
        final_video_path = os.path.join(
            settings.TEMP_DIR,
            f"final_{final_video_id}.mp4"
        )
        
        video_service.merge_videos(video_files, final_video_path)
        
        return FileResponse(
            final_video_path,
            media_type="video/mp4",
            filename=f"animation_{final_video_id}.mp4",
            background=lambda: video_service.cleanup_file(final_video_path)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")




def _generate_description(animation_ir: AnimationIR) -> str:
    """Generate human-readable description"""
    desc_parts = [f"**{animation_ir.metadata.get('title', 'Animation')}**\n"]
    desc_parts.append(f"Duration: ~{animation_ir.metadata.get('duration_estimate', 0):.1f} seconds")
    desc_parts.append(f"Scenes: {len(animation_ir.scenes)}\n")
    
    for i, scene in enumerate(animation_ir.scenes, 1):
        desc_parts.append(f"**Scene {i}** ({scene.duration}s):")
        desc_parts.append(f"- Background: {scene.background_color}")
        desc_parts.append(f"- Objects: {len(scene.objects)}")
        
        for obj in scene.objects:
            obj_desc = f"  • {obj.type.upper()}"
            if obj.type == "text":
                obj_desc += f": \"{obj.content}\""
            elif obj.type == "shape":
                obj_desc += f": {obj.shape}"
            obj_desc += f" ({len(obj.animations)} animations)"
            desc_parts.append(obj_desc)
        desc_parts.append("")
    
    return "\n".join(desc_parts)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)