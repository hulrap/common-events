#!/bin/bash
# Storage Migration Script
# Migrates files from Supabase Storage to MinIO

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Common Events Storage Migration ===${NC}"

BACKUP_DIR="./storage-backup"
mkdir -p "$BACKUP_DIR"

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Installing Supabase CLI...${NC}"
    npm install -g supabase
fi

echo -e "${YELLOW}Step 1: Downloading from Supabase Storage...${NC}"

# You'll need to be logged into Supabase CLI
# supabase login

# List and download all files from the bucket
# Note: Supabase CLI doesn't have a direct download command for storage
# You may need to use the Supabase dashboard or API

echo -e "${YELLOW}Manual step required:${NC}"
echo "1. Go to Supabase Dashboard > Storage > event-banners"
echo "2. Download all files to: $BACKUP_DIR"
echo ""
echo "Or use the Supabase API:"
echo "  curl -X GET 'https://YOUR_PROJECT.supabase.co/storage/v1/object/list/event-banners' \\"
echo "    -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'"
echo ""
read -p "Press Enter when files are downloaded to $BACKUP_DIR..."

echo -e "${YELLOW}Step 2: Uploading to MinIO...${NC}"

# Configure MinIO client
MINIO_ALIAS="local"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ROOT_USER:-minio_admin}"
MINIO_SECRET_KEY="${MINIO_ROOT_PASSWORD}"

if [ -z "$MINIO_SECRET_KEY" ]; then
    echo -e "${RED}Error: MINIO_ROOT_PASSWORD environment variable required${NC}"
    exit 1
fi

# Check if mc (MinIO Client) is available
if ! command -v mc &> /dev/null; then
    echo -e "${YELLOW}Using Docker for MinIO client...${NC}"
    
    # Set up alias
    docker run --rm --network host minio/mc \
        alias set $MINIO_ALIAS $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
    
    # Create bucket if not exists
    docker run --rm --network host minio/mc \
        mb --ignore-existing $MINIO_ALIAS/event-banners
    
    # Set public policy
    docker run --rm --network host minio/mc \
        anonymous set public $MINIO_ALIAS/event-banners
    
    # Upload files
    docker run --rm --network host -v "$(pwd)/$BACKUP_DIR:/backup" minio/mc \
        cp --recursive /backup/ $MINIO_ALIAS/event-banners/
else
    # Use local mc
    mc alias set $MINIO_ALIAS $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
    mc mb --ignore-existing $MINIO_ALIAS/event-banners
    mc anonymous set public $MINIO_ALIAS/event-banners
    mc cp --recursive "$BACKUP_DIR/" $MINIO_ALIAS/event-banners/
fi

echo -e "${GREEN}✓ Files uploaded to MinIO${NC}"

echo -e "${YELLOW}Step 3: Verifying upload...${NC}"

if command -v mc &> /dev/null; then
    mc ls $MINIO_ALIAS/event-banners/ | head -20
else
    docker run --rm --network host minio/mc ls $MINIO_ALIAS/event-banners/ | head -20
fi

echo -e "${GREEN}=== Storage Migration Complete ===${NC}"
