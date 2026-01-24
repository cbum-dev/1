# Use Python 3.13 slim as base
FROM python:3.13-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    # Manim config
    MANIM_RENDERER="cairo"

# Install system dependencies for Manim and UV
# texlive-full is significantly larger but ensures all latex packages are available. 
# For production, we might want to trim this down, but for "Dockerize my backend", reliability comes first.
# We also need gcc/build-essential for some python packages if no wheels exist.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    texlive \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-latex-recommended \
    texlive-science \
    tipa \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set working directory
WORKDIR /app

# Copy project files
# Copy project files
COPY pyproject.toml uv.lock ./
COPY app ./app

# Install dependencies
RUN uv sync --frozen --no-dev

# Create temp directory for manim
RUN mkdir -p /tmp/animations && chmod 777 /tmp/animations

# Expose port
EXPOSE 8000

# Run commands using the virtual environment created by uv
CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
