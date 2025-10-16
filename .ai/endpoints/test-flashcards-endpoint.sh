#!/bin/bash

# Test script for POST /api/flashcards endpoint
# Usage: ./test-flashcards-endpoint.sh <access_token> <generation_id>

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:4321/api/flashcards"

if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo "Usage: $0 <access_token> <generation_id>"
    echo "Example: $0 'eyJhbGc...' 123"
    exit 1
fi

TOKEN=$1
GENERATION_ID=$2

echo -e "${YELLOW}Testing POST /api/flashcards endpoint${NC}"
echo "URL: $API_URL"
echo "Generation ID: $GENERATION_ID"
echo ""

# Test 1: Success case
echo -e "${YELLOW}Test 1: Success - Creating 2 flashcards${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"generationId\": $GENERATION_ID,
    \"flashcards\": [
      {\"front\": \"What is TypeScript?\", \"back\": \"A typed superset of JavaScript\", \"source\": \"ai-full\"},
      {\"front\": \"What is Astro?\", \"back\": \"A modern web framework\", \"source\": \"ai-edited\"}
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Success (201 Created)${NC}"
    echo "Response: $BODY" | jq '.'
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 2: Validation error - front too long
echo -e "${YELLOW}Test 2: Validation Error - Front too long (>200 chars)${NC}"
LONG_FRONT=$(printf 'A%.0s' {1..250})
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"generationId\": $GENERATION_ID,
    \"flashcards\": [{\"front\": \"$LONG_FRONT\", \"back\": \"Answer\", \"source\": \"ai-full\"}]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${GREEN}✓ Correctly rejected (400 Bad Request)${NC}"
    echo "Response: $BODY" | jq '.'
else
    echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 3: Validation error - empty array
echo -e "${YELLOW}Test 3: Validation Error - Empty flashcards array${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"generationId\": $GENERATION_ID,
    \"flashcards\": []
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${GREEN}✓ Correctly rejected (400 Bad Request)${NC}"
    echo "Response: $BODY" | jq '.'
else
    echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 4: Auth error - no token
echo -e "${YELLOW}Test 4: Auth Error - No token${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"generationId\": $GENERATION_ID,
    \"flashcards\": [{\"front\": \"Q\", \"back\": \"A\", \"source\": \"ai-full\"}]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${GREEN}✓ Correctly rejected (401 Unauthorized)${NC}"
    echo "Response: $BODY" | jq '.'
else
    echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 5: Not found - invalid generation ID
echo -e "${YELLOW}Test 5: Not Found - Invalid generation ID${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"generationId\": 999999,
    \"flashcards\": [{\"front\": \"Q\", \"back\": \"A\", \"source\": \"ai-full\"}]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${GREEN}✓ Correctly rejected (404 Not Found)${NC}"
    echo "Response: $BODY" | jq '.'
else
    echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

echo -e "${YELLOW}==================${NC}"
echo -e "${YELLOW}Testing Complete!${NC}"
echo -e "${YELLOW}==================${NC}"

