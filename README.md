# Conversational Text-to-Animation Studio

## Overview
This monorepo delivers a conversational experience for turning natural-language prompts into 2D Manim animations. A FastAPI backend coordinates Google Gemini for JSON-based animation plans, Manim for rendering scenes, and FFmpeg for video assembly. A Next.js frontend offers a chat-style interface where users iteratively refine animations, preview generated Manim code, and download rendered MP4 outputs.

## Tech Stack
- **Backend:** FastAPI, Pydantic, Manim, google-genai, FFmpeg utilities
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix UI primitives, Lucide icons
- **Tooling:** Turborepo for workspace orchestration, pnpm/npm workspaces, Uvicorn for development server

## Repository Structure
```
my-monorepo/
├── apps/
│   ├── api/          # FastAPI service with conversational + legacy endpoints
│   └── web/          # Next.js frontend with chat-based animation studio
├── package.json      # Workspace scripts (runs Turbo, API, and web apps)
├── pnpm-workspace.yaml
├── pnpm-lock.yaml / package-lock.json
└── README.md         # (This file)
```

## Getting Started

### Prerequisites
- Node.js ≥ 18 (Next.js 16 requirement)
- Python 3.13 (per `apps/api/pyproject.toml`)
- FFmpeg available on your PATH (Manim uses it to compose videos)
- (Recommended) `pnpm` for workspace management
- Google Gemini API key with access to `gemini-flash-lite` models

### Install dependencies
```bash
# Install JavaScript/TypeScript deps at repo root
pnpm install

# Create & activate Python virtualenv for the API
cd apps/api
python -m venv .venv
source .venv/bin/activate

# Install Python deps (choose one approach)
pip install -e .               # Uses pyproject metadata
# or, if you have uv installed
devenv ...? # uv sync using uv.lock
uv sync
```

### Environment variables
Create `apps/api/.env` (already git-ignored) and populate:
```
GEMINI_API_KEY=your_key_here
SYSTEM_PROMPT="""
...base prompt text...
"""
MODIFICATION_PROMPT_TEMPLATE="""
CURRENT ANIMATION STATE:
{current_animation}

USER REQUEST:
{user_request}

...rest of template...
"""
MANIM_QUALITY=medium_quality   # optional: low_quality / high_quality
TEMP_DIR=/tmp/animations       # optional render workspace
MAX_SCENE_DURATION=10          # optional overrides
MAX_TOTAL_DURATION=60          # optional overrides
```

For the frontend, optionally set `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`).

### Running the apps
```bash
# From repo root (will activate API virtualenv first)
pnpm run dev:api   # starts Uvicorn on http://localhost:8000
pnpm run dev:web   # starts Next.js on https://manim-flow.vercel.app

# Or launch both with Turbo + Concurrently
pnpm run dev:all
```
> `dev:api` assumes your virtual environment is located at `apps/api/.venv`.

## Backend API

### Conversational workflow
- `POST /chat`
  - **Body:**
    ```json
    {
      "message": "Make the circle red",
      "conversation_history": [ { "role": "user", "content": "...", "timestamp": "..." } ],
      "current_animation": { ... } // optional AnimationIR snapshot
    }
    ```
  - **Response:** Assistant summary text, updated `animation_ir`, generated Manim code, validation status, and updated conversation transcript.
- `POST /render`
  - Accepts a valid `AnimationIR` payload and returns an MP4 file after rendering scenes and merging them.

### Legacy endpoints
Retained for backward compatibility and automation scripts:
- `POST /generate-plan` → returns JSON IR, auto-generated Manim code, and description.
- `POST /generate` → renders the video immediately and streams the MP4 response.

Health endpoints:
- `GET /` → API version info
- `GET /health` → basic readiness check

## Frontend Application
The Next.js UI at `https://manim-flow.vercel.app` offers:
1. **Chat panel** to describe new animations or modifications ("add a square", "make the text bigger", etc.).
2. **Live preview tabs**:
   - Validation/status summary and natural-language description
   - JSON Intermediate Representation (copyable)
   - Generated Manim Python code (copyable)
   - Video playback & download once rendered
3. **One-click rendering** that posts the current IR to `/render` and surfaces the video when ready.

## Useful Scripts
- `pnpm run build` – Run Turbo build pipeline across workspaces
- `pnpm run dev:web` / `pnpm run dev:api` – Start individual services
- `pnpm run dev:all` – Launch web + API concurrently
- `npm` equivalents exist if you prefer npm over pnpm (due to `package-lock.json`).

## Troubleshooting
- Ensure the Python virtual environment is activated before launching `dev:api` (or adjust the script to match your environment path).
- Manim may require additional system packages (LaTeX, Cairo, etc.) depending on your OS; consult the [Manim installation guide](https://docs.manim.community/en/stable/installation.html) if rendering fails.
- Gemini API failures usually stem from missing/invalid `GEMINI_API_KEY` or insufficient model access rights.

## Next Steps
- Expand automated tests for conversational flows and rendering pipeline.
- Add persistent storage (e.g., database) for conversation history or rendered assets if required.
- Enhance frontend UX with live scene previews or timeline editors.
