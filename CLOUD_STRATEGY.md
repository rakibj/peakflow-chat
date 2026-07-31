# Peakflow Cloud Strategy

## Auto Auth to VPS

! ssh-keygen -t ed25519 -f "$HOME\.ssh\peakflow_vps"

It will prompt you for a passphrase — just press Enter twice (no passphrase). Then run the copy command again:

! type "$HOME\.ssh\peakflow_vps.pub" | ssh root@157.173.120.4 "cat >> ~/.ssh/authorized_keys"

## Target Environment

Shared Contabo VPS — 4 vCPU / 8 GB RAM / 145 GB disk.  
Currently hosting Workion via Docker Compose + Caddy.  
Postgres extracted to `/opt/infra` as a standalone shared service.

---

## Architecture Overview

```
VPS
├── /opt/infra                  shared, persistent — never torn down
│   ├── docker-compose.yml      Postgres only
│   └── infra (Docker network)  external network, joined by all apps
│
├── /opt/workion                existing, untouched
│   └── docker-compose.yml      joins infra network for DB access
│
└── /home/apps/peakflow
    ├── docker-compose.yml      builder + viewer + redis (v1); workflows added in v2
    └── .env.production         secrets — never committed to git
```

Peakflow has zero dependency on Workion's containers. Removing Workion does not affect Peakflow or `/opt/infra`.

---

## Service Inventory

### v1 — Deployed now

| Service          | Image                                     | Host port            | Notes                                                           |
| ---------------- | ----------------------------------------- | -------------------- | --------------------------------------------------------------- |
| peakflow-builder | `ghcr.io/rakibj/peakflow-builder:latest` | **3100** / `peakflow.gameloops.io`        | Next.js; runs `prisma migrate deploy` at startup                |
| peakflow-viewer  | `ghcr.io/rakibj/peakflow-viewer:latest`  | **3101** / `viewer.peakflow.gameloops.io` | Next.js; runtime env via `next-runtime-env`                     |
| redis            | `redis:7-alpine`                          | none (internal only)                      | Rate limiting for builder/viewer; also unblocks workflows in v2 |

### v2 — Deferred post-launch

| Service            | Notes                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| peakflow-workflows | Requires `REDIS_URL` (already available from v1 Redis). Handles result exports and onboarding emails. |

> **Why workflows is deferred**: `RedisClientLayer` in `apps/workflows/src/index.ts` connects at startup and crashes without `REDIS_URL`. Redis is now in v1 so adding workflows in v2 is just a new service entry in the compose file — no infrastructure change.

### Not deployed (ever)

| Feature                     | Reason                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Real-time collab (PartyKit) | `NEXT_PUBLIC_PARTYKIT_HOST` intentionally unset; no architecture change needed to add later |

---

## Shared Infrastructure — `/opt/infra`

If Workion already has a running Postgres container in `/opt/infra`, skip the compose step and go straight to "Create peakflow database" below.

### `/opt/infra/docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16
    restart: always
    volumes:
      - pg-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_ROOT_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - infra

networks:
  infra:
    name: infra
    driver: bridge

volumes:
  pg-data:
```

```bash
cd /opt/infra && docker compose up -d
```

### Create peakflow database (one-time SQL)

```bash
docker exec -it infra-postgres-1 psql -U postgres
```

```sql
CREATE USER peakflow_user WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE peakflow OWNER peakflow_user;
GRANT ALL PRIVILEGES ON DATABASE peakflow TO peakflow_user;
```

---

## Peakflow Compose — `/home/apps/peakflow/docker-compose.yml`

```yaml
x-common: &common
  restart: always
  env_file: .env.production
  networks:
    - peakflow
    - infra

services:
  redis:
    image: redis:7-alpine
    restart: always
    command: --save 60 1 --loglevel warning
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ping | grep PONG"]
      start_period: 20s
      interval: 30s
      timeout: 3s
      retries: 5
    volumes:
      - redis-data:/data
    networks:
      - peakflow
    deploy:
      resources:
        limits:
          memory: 64m

  builder:
    <<: *common
    image: ghcr.io/rakibj/peakflow-builder:latest
    ports:
      - "3100:3000"
    depends_on:
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 2048m

  viewer:
    <<: *common
    image: ghcr.io/rakibj/peakflow-viewer:latest
    ports:
      - "3101:3000"
    depends_on:
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 512m

networks:
  peakflow:
    driver: bridge
  infra:
    external: true
    name: infra

volumes:
  redis-data:
```

> Redis is on the `peakflow` internal network only — not exposed to the host or infra network.

---

## Deploy Script — `deploy.ps1`

Run locally on Windows to build images, push to GHCR, and redeploy the VPS in one command:

```powershell
.\deploy.ps1
```

It builds `peakflow-builder:latest` and `peakflow-viewer:latest` from the root `Dockerfile` using the `SCOPE` build arg, pushes to `ghcr.io/rakibj/`, then SSHes into the VPS to `docker compose pull && up -d --no-build`.

**One-time setup** (already done):
- `docker login ghcr.io -u rakibj` with a PAT (`write:packages`) on the local machine
- `docker login ghcr.io -u rakibj` with a PAT (`read:packages`) on the VPS
- VPS docker-compose uses `ghcr.io/rakibj/peakflow-*:latest` image names

> `NEXT_PUBLIC_*` vars are **not** baked in at build time — the entrypoint runs `next-runtime-env/configure` which rewrites them from the container's env at startup. Images are fully generic; env vars drive all runtime behaviour.

---

## Environment Variables — `.env.production` template

```env
# ---- Auth ----
ENCRYPTION_SECRET=        # openssl rand -hex 16  (must be ≤32 chars)
NEXTAUTH_URL=https://peakflow.gameloops.io
NEXT_PUBLIC_VIEWER_URL=https://viewer.peakflow.gameloops.io

# ---- GitHub OAuth (new app scoped to Peakflow) ----
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ---- Database ----
# Hostname 'postgres' resolves via the shared infra Docker network
DATABASE_URL=postgresql://peakflow_user:<password>@postgres:5432/peakflow

# ---- Object storage (Cloudflare R2) ----
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=peakflow
S3_ENDPOINT=<account-id>.r2.cloudflarestorage.com   # no https:// prefix
S3_SSL=true
# S3_PORT is NOT set — R2 uses standard HTTPS (443 implied by S3_SSL=true)

# ---- Admin ----
ADMIN_EMAIL=rakibj56@gmail.com,rakibjs56@gmail.com,rakib@gameloops.io

# ---- Runtime ----
NODE_OPTIONS=--max-old-space-size=900
HOSTNAME=0.0.0.0

# ---- Redis (rate limiting for builder/viewer; required by workflows in v2) ----
# Hostname 'redis' resolves via the peakflow internal Docker network
REDIS_URL=redis://redis:6379

# ---- Intentionally absent (features disabled) ----
# NEXT_PUBLIC_PARTYKIT_HOST — real-time collab disabled

# ---- v2 additions (uncomment when deploying workflows) ----
# WORKFLOWS_RPC_SECRET=     # openssl rand -base64 32
# WORKFLOWS_RPC_URL=http://peakflow-workflows:3000
# WORKFLOWS_DATABASE_URL=postgresql://peakflow_user:<password>@postgres:5432/peakflow
```

---

## Database Backups

`/home/apps/peakflow/backup.sh` dumps the `peakflow` database from `infra-postgres-1` and uploads to Peakflow's R2 bucket (`s3://${S3_BUCKET}/backups/postgres/`). Credentials are sourced from `.env.production` (`S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT`). Last 7 dumps are retained; older ones are deleted automatically.

Scheduled via root crontab: `0 3 * * *` (3am daily, offset from Workion's 2am backup). Logs to `/var/log/peakflow_backup.log`.

To restore:
```bash
aws s3 cp s3://<bucket>/backups/postgres/<dump-file> /tmp/restore.dump \
  --endpoint-url "https://${S3_ENDPOINT}"
docker exec -i infra-postgres-1 pg_restore -U peakflow_user -d peakflow -Fc < /tmp/restore.dump
```

---

## Object Storage — Cloudflare R2 Setup

1. Create a **new Cloudflare account** (separate from any existing R2 usage).
2. Navigate to **R2 Object Storage → Create bucket** → name: `peakflow`.
3. In **R2 → Manage R2 API Tokens → Create API Token**:
   - Permissions: Object Read & Write
   - Bucket scope: `peakflow` only
4. Note the **Account ID** from the R2 overview page.
5. Set in `.env.production`:
   - `S3_ENDPOINT=<account-id>.r2.cloudflarestorage.com`
   - `S3_ACCESS_KEY` / `S3_SECRET_KEY` from the token

---

## GitHub OAuth App Setup

1. **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Application name: `Peakflow`
3. Homepage URL: `http://157.173.120.4:3100`
4. Authorization callback URL: `http://157.173.120.4:3100/api/auth/callback/github`
5. Copy Client ID → `GITHUB_CLIENT_ID`; generate and copy Client Secret → `GITHUB_CLIENT_SECRET`

> When adding the `peakflow.gameloops.io` domain later, update the callback URL to `https://peakflow.gameloops.io/api/auth/callback/github` and update `NEXTAUTH_URL` / `NEXT_PUBLIC_VIEWER_URL` in `.env.production`.

---

## Deployment Runbook

### First deploy

```bash
# 1. Start shared infra (skip if Postgres already running)
cd /opt/infra && docker compose up -d

# 2. Create peakflow DB (one-time)
docker exec -it infra-postgres-1 psql -U postgres << 'SQL'
CREATE USER peakflow_user WITH PASSWORD 'your-strong-password';
CREATE DATABASE peakflow OWNER peakflow_user;
GRANT ALL PRIVILEGES ON DATABASE peakflow TO peakflow_user;
SQL

# 3. Place files on VPS
mkdir -p /home/apps/peakflow
# scp or paste docker-compose.yml and .env.production into /home/apps/peakflow

# 4. Authenticate to GHCR (one-time per VPS; skip if repo is public)
#    PAT needs read:packages scope
echo $GITHUB_PAT | docker login ghcr.io -u <github-username> --password-stdin

# 5. Pull images and start
cd /home/apps/peakflow
docker compose pull
docker compose up -d

# 6. Verify migrations ran (builder runs prisma migrate deploy at startup)
docker compose logs builder | grep -i migrat

# 7. Smoke test
curl -s -o /dev/null -w "%{http_code}" http://localhost:3100   # expect 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3101   # expect 200
```

### Routine redeploy (after GitHub Actions pushes new images)

```bash
cd /home/apps/peakflow
docker compose pull
docker compose up -d --no-build
# Optional: prune images older than 7 days to keep disk clean
docker system prune -f --filter "until=168h"
```

---

## Resource Budget

| Container          | Mem limit | Expected idle          |
| ------------------ | --------- | ---------------------- |
| peakflow-builder   | 2048 MB   | ~400–600 MB            |
| peakflow-viewer    | 512 MB    | ~150–250 MB            |
| redis              | 64 MB     | ~10–20 MB              |
| Workion (existing) | —         | ~600 MB                |
| infra Postgres     | —         | ~100 MB                |
| **Total**          |           | **~1.3–1.6 GB / 8 GB** |

Remaining ~6 GB provides headroom for traffic spikes and v2 workflows (~384 MB).

---

## v2 — Adding Workflows

Redis is already running in v1, so this is just a new service entry.

1. Add to the `services:` block in `/home/apps/peakflow/docker-compose.yml`:

```yaml
  workflows:
    <<: *common
    image: ghcr.io/<owner>/peakflow-workflows:latest
    depends_on:
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 384m
```

2. Uncomment `WORKFLOWS_RPC_SECRET`, `WORKFLOWS_RPC_URL`, and `WORKFLOWS_DATABASE_URL` in `.env.production`.
3. `docker compose pull && docker compose up -d`

---

## Domain + Caddy

DNS for `peakflow.gameloops.io` and `viewer.peakflow.gameloops.io` points at `157.173.120.4`.

Caddy lives in Workion's compose (`/home/apps/workion/docker-compose.prod.yml`). It must join `infra-net` so it can reach the peakflow containers directly (they are also on `infra-net`). The Caddyfile is at `/home/apps/workion/Caddyfile`.

### `/home/apps/workion/docker-compose.prod.yml` — caddy service

```yaml
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - default
      - infra-net
```

### `/home/apps/workion/Caddyfile`

```
workion.gameloops.io {
    reverse_proxy app:3000
}

peakflow.gameloops.io {
    reverse_proxy peakflow-builder-1:3000
}

viewer.peakflow.gameloops.io {
    reverse_proxy peakflow-viewer-1:3000
}
```

> `HOSTNAME=0.0.0.0` must be set in peakflow's `.env.production` — without it Node.js binds only to the `peakflow` network interface and Caddy (on `infra-net`) gets connection refused.

---

## Networking Diagram

```
VPS (157.173.120.4)
│
├── Docker network: infra (external, bridged)
│   └── postgres:5432          only reachable within infra network
│
├── Docker network: workion (internal)
│   └── [workion containers]   join infra for DB
│
└── Docker network: peakflow (internal)
    ├── redis                  no host port; internal only
    ├── builder   → host:3100  joins infra for DATABASE_URL; reaches redis for rate limiting
    └── viewer    → host:3101  joins infra for DATABASE_URL; reaches redis for rate limiting
```
