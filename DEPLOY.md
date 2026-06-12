# Deployment checklist

## Architecture
- **Frontend** → Vercel (static Vite build)
- **Backend** → Render (Docker, Web Service)
- **PostgreSQL** → Render Postgres (or any managed Postgres)
- **Neo4j** → Neo4j Aura (already set up)

---

## Step 1 — Buy a domain
Namecheap or Cloudflare Registrar (~$10–15/yr for a .com).
Plan on two subdomains:
- `yourdomain.com` → frontend (Vercel)
- `api.yourdomain.com` → backend (Render)

---

## Step 2 — Deploy the backend on Render

1. Push this repo to GitHub if you haven't already
2. Go to render.com → New → Web Service → connect your GitHub repo
3. Set **Root Directory** to `.` (the repo root, not `frontend/`)
4. Set **Environment** to `Docker` — Render will use the `Dockerfile`
5. Set these environment variables in the Render dashboard:

| Variable | Value |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `production` (faster startup via lazy init) |
| `DB_URL` | `jdbc:postgresql://<host>:<port>/<dbname>` (from Render Postgres) |
| `DB_USERNAME` | from Render Postgres |
| `DB_PASSWORD` | from Render Postgres |
| `NEO4J_URI` | your Neo4j Aura URI (e.g. `neo4j+s://xxxx.databases.neo4j.io`) |
| `NEO4J_USERNAME` | `neo4j` |
| `NEO4J_PASSWORD` | your Aura password |
| `JWT_SECRET` | a random 64-char string (PowerShell: `-join ((1..32 \| ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }))`) |
| `CORS_ALLOWED_ORIGINS` | `https://yourdomain.com,https://www.yourdomain.com` |
| `GRAPHIQL_ENABLED` | `false` |

**Do not set `PORT` manually** — Render assigns it automatically (often `10000`). The app reads `${PORT}` from `application.properties`.

6. In Render → your Web Service → **Settings → Health Checks**, set:
   - **Health Check Path:** `/health/live`
   - This endpoint returns immediately once Tomcat is up (no DB round-trips).

7. Optional: use the included `render.yaml` blueprint so health checks and `SPRING_PROFILES_ACTIVE=production` are applied automatically.

8. Add a custom domain `api.yourdomain.com` in Render → Settings → Custom Domains
9. Point a CNAME record at your domain registrar: `api` → `<your-service>.onrender.com`

---

## Step 3 — Deploy the frontend on Vercel

1. Go to vercel.com → New Project → import your GitHub repo
2. Set **Root Directory** to `frontend/`
3. Vercel auto-detects Vite — build command is `npm run build`, output dir is `dist`
4. Set this environment variable in Vercel project settings:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://api.yourdomain.com` |

5. Add your domain in Vercel → Settings → Domains
6. Point your domain's nameservers (or A/CNAME records) to Vercel per their instructions

---

## Step 4 — Verify

- `https://yourdomain.com` → loads the login page
- `https://yourdomain.com/signup` → can create an account
- `https://yourdomain.com/tree` → tree loads, can add people
- `https://api.yourdomain.com/health` → `{"status":"UP",...}`

---

## Notes
- **First deploy can take 2–3 minutes** while Spring Boot connects to Postgres and Neo4j. If deploy times out, confirm **Health Check Path** is `/health/live` and redeploy. The `$7/mo` plan also reduces cold-start pain.
- Render free tier spins down after 15 min of inactivity (cold start ~30s–2min). Upgrade to the $7/mo plan to avoid this.
- The Render Postgres free tier has a 90-day expiry — upgrade or migrate before then.
- `JWT_SECRET` must be at least 32 characters. Generate with `openssl rand -hex 32`.
- Never commit `.env.local` or `application-local.properties` — both are in `.gitignore`.
