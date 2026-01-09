# Self-Hosted Deployment Guide

Deploy Common Events on your own server with Docker Compose.

## Prerequisites

- A server with Docker and Docker Compose installed (e.g., Hetzner CX31 - €8/month)
- A domain name pointing to your server's IP
- SMTP credentials for sending emails (e.g., Resend, Sendgrid)

## Quick Start

### 1. Clone and Configure

```bash
# On your server
git clone <your-repo> common-events
cd common-events/docker

# Create environment file
cp .env.example .env
nano .env  # Edit with your values
```

### 2. Generate Secrets

```bash
# JWT Secret (for GoTrue auth)
openssl rand -base64 32

# CSRF Secret
openssl rand -hex 32

# VAPID Keys (for push notifications)
npx web-push generate-vapid-keys
```

### 3. Generate Supabase-Compatible Keys

The `@supabase/supabase-js` client expects specific JWT keys. Generate them:

```bash
# You can use any JWT generation tool, or use this Node.js script:
node -e "
const crypto = require('crypto');
const jwtSecret = 'YOUR_JWT_SECRET_HERE'; // Use the same value from .env

// Anon key payload
const anonPayload = {
  role: 'anon',
  iss: 'self-hosted',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
};

// Service role payload
const servicePayload = {
  role: 'service_role',
  iss: 'self-hosted',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
};

console.log('Generate keys at: https://supabase.com/docs/guides/self-hosting#api-keys');
console.log('Or use jwt.io with your JWT_SECRET');
"
```

### 4. Start Services

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 5. Initialize MinIO Bucket

After services start, create the storage bucket:

```bash
# Install MinIO client
docker run --rm -it --network common-events_internal minio/mc \
  alias set local http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD

# Create bucket and set public policy
docker run --rm -it --network common-events_internal minio/mc \
  mb local/event-banners
docker run --rm -it --network common-events_internal minio/mc \
  anonymous set public local/event-banners
```

### 6. Run Database Migrations

```bash
# Access the app container
docker exec -it common-events-app sh

# Run Drizzle migrations
npm run db:migrate
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Your Server (Hetzner)              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Internet → Caddy (80/443)                      │
│               ↓                                 │
│         ┌─────┴─────┐                           │
│         ↓           ↓                           │
│     Next.js    GoTrue (Auth)                    │
│     (3000)       (9999)                         │
│         ↓           ↓                           │
│         └─────┬─────┘                           │
│               ↓                                 │
│        PostgreSQL 16                            │
│        + PostGIS                                │
│          (5432)                                 │
│                                                 │
│        MinIO Storage                            │
│         (9000/9001)                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| `caddy` | 80, 443 | Reverse proxy with auto-HTTPS |
| `app` | 3000 | Next.js application |
| `gotrue` | 9999 | Authentication (Supabase-compatible) |
| `db` | 5432 | PostgreSQL 16 with PostGIS |
| `minio` | 9000, 9001 | S3-compatible object storage |

## Common Operations

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f gotrue
```

### Restart Services

```bash
docker compose restart app
```

### Update Application

```bash
git pull
docker compose build app
docker compose up -d app
```

### Database Backup

```bash
# Create backup
docker exec common-events-db pg_dump -U postgres common_events > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i common-events-db psql -U postgres common_events < backup_20260109.sql
```

### Access PostgreSQL

```bash
docker exec -it common-events-db psql -U postgres common_events
```

### Access MinIO Console

The MinIO admin console is available at `https://your-domain.com/minio-console/` (if configured in Caddyfile).

## Scaling

For most applications, vertical scaling is sufficient:

1. Go to Hetzner Cloud Console
2. Power off server
3. Resize to larger plan (e.g., CX31 → CX41)
4. Power on

Your Docker volumes persist across resizes.

## Troubleshooting

### GoTrue not starting
Check database connection:
```bash
docker compose logs gotrue
docker exec common-events-db psql -U postgres -c "SELECT 1"
```

### Images not loading
Verify MinIO bucket exists and is public:
```bash
docker exec -it common-events-storage mc ls local/
```

### SSL certificate issues
Caddy auto-generates certificates. Ensure:
- Port 80 and 443 are open in your firewall
- Domain DNS is pointing to server IP
- Check Caddy logs: `docker compose logs caddy`
