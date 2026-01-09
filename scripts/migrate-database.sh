#!/bin/bash
# Database Migration Script
# Exports data from Supabase and imports to self-hosted PostgreSQL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Common Events Database Migration ===${NC}"

# Check for required environment variables
if [ -z "$SUPABASE_DB_HOST" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${YELLOW}Usage: Set these environment variables before running:${NC}"
    echo "  export SUPABASE_DB_HOST=db.xxxx.supabase.co"
    echo "  export SUPABASE_DB_PASSWORD=your_supabase_db_password"
    echo ""
    echo "Then run: ./migrate-database.sh"
    exit 1
fi

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Step 1: Exporting from Supabase...${NC}"

# Export application tables
pg_dump -h "$SUPABASE_DB_HOST" -U postgres -d postgres \
    --no-owner --no-acl \
    -t users \
    -t events \
    -t event_recurrence \
    -t event_tickets \
    -t categories \
    -t event_categories \
    -t venues \
    -t venue_event_visibility \
    -t event_likes \
    -t push_subscriptions \
    -t notifications \
    -t organizer_follows \
    -t event_gallery_images \
    -t user_locations \
    -t user_filter_preferences \
    > "$BACKUP_DIR/app_data.sql"

echo -e "${GREEN}✓ Application data exported to $BACKUP_DIR/app_data.sql${NC}"

# Export auth schema (users and sessions)
pg_dump -h "$SUPABASE_DB_HOST" -U postgres -d postgres \
    --no-owner --no-acl \
    -n auth \
    > "$BACKUP_DIR/auth_data.sql"

echo -e "${GREEN}✓ Auth data exported to $BACKUP_DIR/auth_data.sql${NC}"

echo -e "${YELLOW}Step 2: Importing to self-hosted PostgreSQL...${NC}"

# Import to local Docker PostgreSQL
docker exec -i common-events-db psql -U postgres -d common_events < "$BACKUP_DIR/app_data.sql"
echo -e "${GREEN}✓ Application data imported${NC}"

docker exec -i common-events-db psql -U postgres -d common_events < "$BACKUP_DIR/auth_data.sql"
echo -e "${GREEN}✓ Auth data imported${NC}"

echo -e "${YELLOW}Step 3: Verifying migration...${NC}"

# Verify counts
docker exec common-events-db psql -U postgres -d common_events -c "
SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM events) as events,
    (SELECT COUNT(*) FROM venues) as venues,
    (SELECT COUNT(*) FROM auth.users) as auth_users;
"

echo -e "${GREEN}=== Migration Complete ===${NC}"
echo "Backups saved to: $BACKUP_DIR"
