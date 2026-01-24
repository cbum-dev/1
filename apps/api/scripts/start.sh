#!/bin/bash

echo "🎬 Animation Studio - Quick Start Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 is installed${NC}"
        return 0
    fi
}

echo "📋 Checking prerequisites..."
check_command psql || exit 1
check_command node || exit 1
check_command pnpm || exit 1
check_command ffmpeg || exit 1
echo ""

# Check if .env exists
if [ ! -f "apps/api/.env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    
    cat > apps/api/.env << 'EOF'
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Database
DATABASE_URL=postgresql://animation_user:animation_password@localhost/animation_studio
DEBUG=false

# Stripe (Get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# JWT
JWT_SECRET_KEY=$(openssl rand -hex 32)

# URLs
FRONTEND_URL=https://1-web-seven.vercel.app

# Features
ENABLE_AUTH=true
ENABLE_TEMPLATES=true
ENABLE_JOB_QUEUE=true
ENABLE_MARKETPLACE=true
EOF
    
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please update apps/api/.env with your API keys before continuing${NC}"
    echo ""
    read -p "Press Enter when you've updated the .env file..."
fi

# Setup database
echo ""
echo "📦 Setting up database..."
./scripts/setup_database.sh

# Install backend dependencies
echo ""
echo "📥 Installing backend dependencies..."
cd apps/api
uv sync
cd ../..

# Install frontend dependencies
echo ""
echo "📥 Installing frontend dependencies..."
pnpm install

# Initialize database
echo ""
echo "🗄️  Initializing database tables..."
cd apps/api
uv run python -m app.database.init_db
cd ../..

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "🚀 To start the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd apps/api"
echo "    uv run uvicorn app.main:app --reload --port 8000"
echo ""
echo "  Terminal 2 (Stripe Webhooks - if using Stripe):"
echo "    stripe listen --forward-to localhost:8000/billing/webhook"
echo ""
echo "  Terminal 3 (Frontend):"
echo "    cd apps/web"
echo "    pnpm dev"
echo ""
echo "  Then open: https://1-web-seven.vercel.app"
echo ""
echo "📚 Documentation:"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - Setup Guide: STRIPE_MARKETPLACE_SETUP.md"
echo ""
echo "🎉 Happy animating!"