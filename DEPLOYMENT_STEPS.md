# Complete Deployment Guide: Hospeon
## Render (Backend) + Vercel (Frontend) + Neon PostgreSQL

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- ✅ GitHub account with your repository: `https://github.com/Leo-000046/hospeon-temp-deployment`
- ✅ Render account (free at https://render.com)
- ✅ Vercel account (free at https://vercel.com)
- ✅ Neon PostgreSQL account (free at https://console.neon.tech)
- ✅ All code committed and pushed to `main` branch

---

# PART 1: DATABASE SETUP (Neon PostgreSQL)

## Step 1: Create Neon PostgreSQL Database

1. **Go to Neon Console:** https://console.neon.tech
2. **Click "Create a project"**
3. **Fill in project details:**
   - Project name: `hospeon-db` (or your choice)
   - Database name: `hospeon_main`
   - Region: Choose closest to your users
   - PostgreSQL version: 15 (or latest)
4. **Click "Create project"**

## Step 2: Get Database Connection String

1. After creation, you'll see a connection string
2. **Copy the "Direct connection string"** (looks like):
   ```
   postgresql://user:password@host.neon.tech/hospeon_main?sslmode=require
   ```
3. **Save this somewhere safe** - you'll need it for both Render and local development

## Step 3: Verify Connection Locally (Optional)

```bash
# In your local terminal
DATABASE_URL="your_neon_connection_string" npx prisma db push
```

This runs your Prisma migrations on the Neon database.

---

# PART 2: BACKEND DEPLOYMENT (Render)

## Step 1: Prepare Backend for Deployment

1. **Ensure .gitignore is correct:**
   - ✅ `dist` should be in .gitignore
   - ✅ `.env` should be in .gitignore
   - Already done in your project

2. **Verify build script works locally:**
   ```bash
   pnpm install --frozen-lockfile
   pnpm --filter backend run build
   ```

## Step 2: Create Render Web Service

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub:**
   - Click "Connect account" (if not already connected)
   - Select your GitHub account (Leo-000046)
   - Authorize Render to access your repositories
   - Select `hospeon-temp-deployment` repository

## Step 3: Configure Render Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `hospeon-backend` |
| **Environment** | `Node` |
| **Region** | Choose closest to your users (same as Neon if possible) |
| **Branch** | `main` |
| **Root Directory** | `apps/backend` |
| **Build Command** | `pnpm install --frozen-lockfile && pnpm run build` |
| **Start Command** | `pnpm start` |

**Note:** Setting Root Directory to `apps/backend` means:
- Only changes in the backend directory trigger auto-deploys
- Commands run from `apps/backend` directory by default
- Build/start commands are simplified

## Step 4: Set Environment Variables

1. In Render dashboard, go to **Environment** tab
2. **Add each variable:**

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host.neon.tech/hospeon_main?sslmode=require
JWT_SECRET=<generate_strong_secret>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-vercel-url.vercel.app
```

### How to generate JWT_SECRET:

Open terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste as JWT_SECRET. 

**Don't use the example below - generate your own!**
Example format: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9`

## Step 5: Deploy Backend

1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 3-5 minutes)
3. **Check logs** for any errors in the Logs tab
4. **Copy the backend URL** (looks like): `https://hospeon-backend-xxxxx.onrender.com`

## Step 6: Run Database Migrations on Render

After deployment, run migrations:

```bash
# In your local terminal
DATABASE_URL="postgresql://user:password@host.neon.tech/hospeon_main?sslmode=require" npx prisma migrate deploy
```

Or use Render's Shell tab:
1. Click "Shell" tab in Render dashboard
2. Run:
   ```bash
   cd apps/backend && npx prisma migrate deploy
   ```

## Step 7: Test Backend

```bash
curl https://hospeon-backend-xxxxx.onrender.com/api/v1/health
```

Expected response: `{"status":"ok"}` or similar

---

# PART 3: FRONTEND DEPLOYMENT (Vercel)

## Step 1: Prepare Frontend for Deployment

Your frontend is already configured for deployment. No changes needed!

## Step 2: Deploy on Vercel

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard
2. **Click "Add New"** → **"Project"**
3. **Import Git Repository:**
   - Click "Continue with GitHub"
   - Select your GitHub account
   - Find and select `hospeon-temp-deployment`
   - Click "Import"

## Step 3: Configure Vercel Settings

Vercel should auto-detect these settings, but verify:

| Setting | Value |
|---------|-------|
| **Framework** | `Vite` |
| **Root Directory** | `./apps/frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

## Step 4: Add Environment Variables

1. In Vercel project, go to **Settings** → **Environment Variables**
2. **Add these variables:**

```
VITE_API_BASE_URL=https://hospeon-backend-xxxxx.onrender.com/api/v1
VITE_SOCKET_URL=https://hospeon-backend-xxxxx.onrender.com
```

Replace `hospeon-backend-xxxxx.onrender.com` with your actual Render backend URL from Step 5.2 above.

3. **Select environment:** Production, Preview, Development (select all if you want them in all)
4. **Save variables**

## Step 5: Deploy Frontend

1. **Vercel auto-deploys** after you import
2. **Wait for deployment** to complete (usually 2-3 minutes)
3. **Copy frontend URL** (looks like): `https://hospeon-xxx.vercel.app`

## Step 6: Update Backend CORS

Now that you have both URLs, update the backend CORS:

1. **Go to Render dashboard** → Your backend service
2. **Click "Environment"**
3. **Edit `CORS_ORIGIN`:**
   ```
   CORS_ORIGIN=https://hospeon-xxx.vercel.app
   ```
4. **Click "Save"**
5. **Redeploy backend** (click "Manual Deploy")

---

# PART 4: FINAL VERIFICATION & TESTING

## Test 1: Backend Health Check

```bash
curl https://hospeon-backend-xxxxx.onrender.com/api/v1/health
```

Expected: Status 200 with health response

## Test 2: Frontend Loads

Visit: `https://hospeon-xxx.vercel.app`

Expected: Frontend loads without errors

## Test 3: Test Authentication

1. Go to your frontend URL
2. Register a new account
3. Check browser console for errors (F12 → Console)
4. Login and verify JWT token is generated
5. Check browser Network tab to ensure API calls succeed

## Test 4: Check CORS

1. In browser DevTools (F12)
2. Go to **Network** tab
3. Make an API call (e.g., register)
4. Verify response status is 200-201 (not CORS error)

## Test 5: Database Operations

1. Create a user/patient/appointment
2. Verify it appears in subsequent API calls
3. Check Neon console to see the data in database

---

# DEPLOYMENT SUMMARY

Your deployed application:

- **Frontend:** https://hospeon-xxx.vercel.app
  - Auto-redeploys on push to `main`
  - Environment variables in Vercel dashboard

- **Backend:** https://hospeon-backend-xxxxx.onrender.com
  - Auto-redeploys on push to `main`
  - Environment variables in Render dashboard
  - API available at `/api/v1/*`

- **Database:** Neon PostgreSQL
  - Automatic backups
  - Free tier includes 1 project

---

# TROUBLESHOOTING

## Backend won't start

**Error:** `Failed to start server`

**Solution:**
1. Check Render logs for detailed error
2. Verify all environment variables are set correctly
3. Ensure `DATABASE_URL` is correct
4. Run `npx prisma migrate deploy` manually

## CORS errors in frontend

**Error:** `Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy`

**Solution:**
1. Verify `CORS_ORIGIN` in Render matches your Vercel URL exactly
2. Check that URL includes `https://` and matches exactly (no trailing slash)
3. Restart Render service (Manual Deploy)

## Frontend shows API error

**Error:** API calls fail, network tab shows 500+ status

**Solution:**
1. Check Render backend logs
2. Verify backend is running: `curl https://hospeon-backend-xxxxx.onrender.com/health`
3. Verify `VITE_API_BASE_URL` in Vercel matches your backend URL

## Database connection error

**Error:** `connect ECONNREFUSED` or `database not connected`

**Solution:**
1. Verify Neon database is running (check Neon console)
2. Verify `DATABASE_URL` format is correct
3. Test connection: `psql <your_database_url>`
4. Ensure database exists in Neon

## Vercel shows blank page

**Error:** 404 or blank white page

**Solution:**
1. Check Vercel build logs (Deployments tab)
2. Verify Root Directory is `./apps/frontend`
3. Check that `npm run build` completes without errors
4. Try redeploying from Vercel dashboard

---

# MONITORING & MAINTENANCE

## Set Up Monitoring

**Render:**
- Go to your service → **Alerts**
- Set up CPU/Memory/Disk alerts

**Vercel:**
- Web Analytics (built-in)
- Error tracking (see in dashboard)

## View Logs

**Render:** Dashboard → Logs tab (real-time logs)

**Vercel:** Deployments → click deployment → Logs

## Database Backups

**Neon:** Automatic daily backups included in free tier

---

# NEXT STEPS AFTER DEPLOYMENT

1. ✅ Set up CI/CD pipeline (GitHub Actions)
2. ✅ Configure custom domain
3. ✅ Set up email notifications
4. ✅ Implement monitoring/alerting
5. ✅ Set up environment-specific configurations
6. ✅ Plan for scaling strategy

---

# QUICK REFERENCE: IMPORTANT URLS

| Service | URL |
|---------|-----|
| Frontend | https://hospeon-xxx.vercel.app |
| Backend API | https://hospeon-backend-xxxxx.onrender.com/api/v1 |
| Render Dashboard | https://dashboard.render.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| Neon Console | https://console.neon.tech |
| GitHub Repo | https://github.com/Leo-000046/hospeon-temp-deployment |

---

**Good luck with your deployment! 🚀**

If you encounter any issues, check the Troubleshooting section or review the logs in each platform's dashboard.
