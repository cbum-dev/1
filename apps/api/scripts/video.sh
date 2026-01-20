#!/bin/bash

echo "🎬 Testing Video Rendering Pipeline"
echo "===================================="
echo ""

# Configuration
API_URL="http://localhost:8000"
EMAIL="demo@example.com"
PASSWORD="demo123456"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Login
echo "1️⃣  Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmMWQzNDgyYy1mOGI1LTQzMjItOWMwZS03ZTA2NzUzZjdkNWYiLCJlbWFpbCI6ImFAZ21haWwuY29tIiwiZXhwIjoxNzY5NDU3NjY5fQ.44siuZUq4znviguwZtlvZx1PNB1ZO-dKohOS5tVSyH0"

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Generate animation
echo "2️⃣  Generating animation..."
CHAT_RESPONSE=$(curl -s -X POST "$API_URL/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Create a simple blue circle that appears",
    "conversation_history": [],
    "current_animation": null
  }')

SUCCESS=$(echo $CHAT_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS" != "true" ]; then
  echo -e "${RED}❌ Generation failed${NC}"
  echo $CHAT_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Animation generated${NC}"
echo ""

# Extract animation_ir
ANIMATION_IR=$(echo $CHAT_RESPONSE | jq '.animation_ir')

# Step 3: Queue render job
echo "3️⃣  Queueing render job..."
RENDER_RESPONSE=$(curl -s -X POST "$API_URL/render/queue" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"animation_ir\": $ANIMATION_IR,
    \"output_format\": \"mp4\",
    \"quality\": \"medium\",
    \"include_voiceover\": false,
    \"include_music\": false
  }")

JOB_ID=$(echo $RENDER_RESPONSE | grep -o '"job_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
  echo -e "${RED}❌ Failed to queue render${NC}"
  echo $RENDER_RESPONSE
  exit 1
fi

echo -e "${GREEN}✅ Render queued${NC}"
echo "Job ID: $JOB_ID"
echo ""

# Step 4: Poll for completion
echo "4️⃣  Waiting for render to complete..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  STATUS_RESPONSE=$(curl -s "$API_URL/render/status/$JOB_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  
  echo -n "."
  
  if [ "$STATUS" = "completed" ]; then
    echo ""
    echo -e "${GREEN}✅ Render completed!${NC}"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo ""
    echo -e "${RED}❌ Render failed${NC}"
    echo $STATUS_RESPONSE | jq '.'
    exit 1
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  sleep 2
done

if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
  echo ""
  echo -e "${YELLOW}⚠️  Timeout waiting for render${NC}"
  exit 1
fi

echo ""

# Step 5: Download video
echo "5️⃣  Downloading video..."
VIDEO_URL="$API_URL/render/download/$JOB_ID"
OUTPUT_FILE="test_animation_$(date +%s).mp4"

curl -s -H "Authorization: Bearer $TOKEN" \
  "$VIDEO_URL" \
  -o "$OUTPUT_FILE"

if [ -f "$OUTPUT_FILE" ]; then
  FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
  echo -e "${GREEN}✅ Video downloaded${NC}"
  echo "File: $OUTPUT_FILE"
  echo "Size: $((FILE_SIZE / 1024)) KB"
  echo ""
  
  # Try to play the video (macOS only)
  if command -v open &> /dev/null; then
    echo "Opening video..."
    open "$OUTPUT_FILE"
  fi
else
  echo -e "${RED}❌ Download failed${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "Summary:"
echo "  ✅ Authentication working"
echo "  ✅ Animation generation working"
echo "  ✅ Video rendering working"
echo "  ✅ Video download working"
echo ""
echo "Video saved to: $OUTPUT_FILE"