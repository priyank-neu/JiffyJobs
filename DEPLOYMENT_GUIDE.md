# Complete Deployment Guide for JiffyJobs

This guide provides step-by-step instructions for deploying JiffyJobs to production.

## Table of Contents
1. [Frontend Deployment - Vercel](#frontend-deployment---vercel)
2. [Backend Deployment - Railway](#backend-deployment---railway)
3. [Alternative: Frontend on Netlify](#alternative-frontend-on-netlify)
4. [Alternative: Backend on Render](#alternative-backend-on-render)
5. [Alternative: Backend on Heroku](#alternative-backend-on-heroku)
6. [Post-Deployment Setup](#post-deployment-setup)

---

## Frontend Deployment - Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" and sign up with GitHub
3. Authorize Vercel to access your GitHub repositories

### Step 2: Create New Project
1. In Vercel dashboard, click "Add New..." → "Project"
2. Import your GitHub repository: `priyank-neu/JiffyJobs`
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

### Step 3: Configure Environment Variables
In Vercel project settings → Environment Variables, add:

**Production:**
```
VITE_API_URL=https://your-backend-url.railway.app/api
```

**Preview (Staging):**
```
VITE_API_URL=https://your-staging-backend-url.railway.app/api
```

### Step 4: Get Vercel Credentials for GitHub Actions
1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it: `GitHub Actions Deploy`
4. Copy the token (you'll need this for GitHub Secrets)

5. Get Project IDs:
   - Go to your project settings → General
   - Copy "Project ID"
   - You'll need separate project IDs for production and staging

6. Get Organization ID:
   - Go to [vercel.com/account](https://vercel.com/account)
   - Copy "Team ID" (this is your Organization ID)

### Step 5: Add GitHub Secrets
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add these secrets:

```
VERCEL_TOKEN=<token from step 4>
VERCEL_ORG_ID=<organization ID from step 4>
VERCEL_PROJECT_ID=<production project ID>
VERCEL_PROJECT_ID_STAGING=<staging project ID (create a second Vercel project)>
VITE_API_URL_PROD=https://your-backend-url.railway.app/api
VITE_API_URL_STAGING=https://your-staging-backend-url.railway.app/api
```

### Step 6: Deploy
1. Vercel will automatically deploy on first import
2. For automatic deployments via GitHub Actions:
   - Push to `development` branch → deploys to staging
   - Merge to `main` branch → deploys to production

### Step 7: Custom Domain (Optional)
1. In Vercel project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Backend Deployment - Railway

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub
4. Authorize Railway to access your repositories

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `priyank-neu/JiffyJobs`
4. Railway will detect it's a monorepo

### Step 3: Add PostgreSQL Database
1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will create a PostgreSQL instance
4. Click on the PostgreSQL service
5. Go to "Variables" tab
6. Copy the `DATABASE_URL` (you'll need this)

### Step 4: Add Node.js Service (Backend)
1. In your Railway project, click "+ New"
2. Select "GitHub Repo" → choose your repo again
3. Railway will ask which service to deploy
4. Select "backend" directory
5. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Watch Paths**: `backend/**`

### Step 5: Configure Environment Variables
In the backend service → Variables tab, add:

```
DATABASE_URL=<from PostgreSQL service, click "Add Reference" and select DATABASE_URL>
JWT_SECRET=<generate a strong random string, e.g., use: openssl rand -base64 32>
JWT_EXPIRE=7d
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://your-frontend-url.vercel.app
RESEND_API_KEY=<your Resend API key>
EMAIL_FROM=noreply@jiffyjobs.com
EMAIL_FROM_NAME=JiffyJobs
COOKIE_SECRET=<generate a strong random string>
STRIPE_SECRET_KEY=<your Stripe secret key>
STRIPE_PUBLISHABLE_KEY=<your Stripe publishable key>
STRIPE_WEBHOOK_SECRET=<your Stripe webhook secret>
PLATFORM_FEE_PERCENTAGE=5
AUTO_RELEASE_HOURS=72
```

**To generate secrets:**
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate COOKIE_SECRET
openssl rand -base64 32
```

### Step 6: Run Database Migrations
1. In Railway backend service, go to "Deployments"
2. Click on the latest deployment
3. Click "View Logs"
4. Or use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run prisma:migrate deploy
```

**Or configure auto-migrations:**
1. In backend service → Settings → Deploy
2. Add "Deploy Command": `npm run prisma:migrate deploy && npm start`

### Step 7: Get Railway Credentials for GitHub Actions
1. Go to Railway dashboard → Account Settings
2. Click "New Token"
3. Name it: `GitHub Actions Deploy`
4. Copy the token
5. Get Project ID:
   - In your Railway project → Settings
   - Copy "Project ID"

### Step 8: Add GitHub Secrets
Add to GitHub repository secrets:

```
RAILWAY_TOKEN=<token from step 7>
RAILWAY_PROJECT_ID=<project ID from step 7>
RAILWAY_TOKEN_STAGING=<create a separate Railway project for staging and get its token>
RAILWAY_PROJECT_ID_STAGING=<staging project ID>
```

### Step 9: Configure Webhook URL (for Stripe)
1. Get your Railway backend URL (e.g., `https://jiffyjobs-backend.railway.app`)
2. In Stripe Dashboard → Developers → Webhooks
3. Add endpoint: `https://your-backend-url.railway.app/api/payments/webhook`
4. Copy the webhook signing secret
5. Add it to Railway environment variables as `STRIPE_WEBHOOK_SECRET`

### Step 10: Deploy
1. Railway will automatically deploy on first setup
2. For automatic deployments via GitHub Actions:
   - Push to `development` → deploys to staging
   - Merge to `main` → deploys to production

### Step 11: Custom Domain (Optional)
1. In Railway backend service → Settings → Networking
2. Click "Generate Domain" or "Add Custom Domain"
3. Follow DNS configuration instructions

---

## Alternative: Frontend on Netlify

### Step 1: Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub

### Step 2: Create New Site
1. Click "Add new site" → "Import an existing project"
2. Choose "GitHub"
3. Select your repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

### Step 3: Environment Variables
In Site settings → Environment variables:

**Production:**
```
VITE_API_URL=https://your-backend-url.railway.app/api
```

**Deploy previews:**
```
VITE_API_URL=https://your-staging-backend-url.railway.app/api
```

### Step 4: Get Netlify Credentials
1. Go to [app.netlify.com/user/applications](https://app.netlify.com/user/applications)
2. Click "New access token"
3. Name it: `GitHub Actions`
4. Copy the token
5. Get Site ID:
   - In your site → Site settings → General
   - Copy "Site ID"

### Step 5: Add GitHub Secrets
```
NETLIFY_AUTH_TOKEN=<token from step 4>
NETLIFY_SITE_ID=<site ID from step 4>
```

---

## Alternative: Backend on Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `jiffyjobs-db`
   - **Database**: `jiffyjobs_prod`
   - **User**: `jiffyjobs_user`
   - **Region**: Choose closest to you
   - **Plan**: Free (or paid for production)
3. Copy the "Internal Database URL"

### Step 3: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `jiffyjobs-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

### Step 4: Environment Variables
In Web Service → Environment:

```
DATABASE_URL=<from PostgreSQL service>
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRE=7d
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://your-frontend-url.vercel.app
RESEND_API_KEY=<your key>
EMAIL_FROM=noreply@jiffyjobs.com
EMAIL_FROM_NAME=JiffyJobs
COOKIE_SECRET=<generate with: openssl rand -base64 32>
STRIPE_SECRET_KEY=<your key>
STRIPE_PUBLISHABLE_KEY=<your key>
STRIPE_WEBHOOK_SECRET=<your key>
PLATFORM_FEE_PERCENTAGE=5
AUTO_RELEASE_HOURS=72
```

### Step 5: Run Migrations
1. In Web Service → Shell
2. Run: `npx prisma migrate deploy`

Or add to build command:
```
npm ci && npm run build && npx prisma migrate deploy
```

### Step 6: Get Render Credentials
1. Go to [dashboard.render.com/account/api-keys](https://dashboard.render.com/account/api-keys)
2. Click "Create API Key"
3. Copy the key
4. Get Service ID:
   - In Web Service → Settings
   - Copy "Service ID"

### Step 7: Add GitHub Secrets
```
RENDER_API_KEY=<API key from step 6>
RENDER_SERVICE_ID=<service ID from step 6>
```

---

## Alternative: Backend on Heroku

### Step 1: Create Heroku Account
1. Go to [heroku.com](https://heroku.com)
2. Sign up for free account

### Step 2: Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Or download from heroku.com/cli
```

### Step 3: Login to Heroku
```bash
heroku login
```

### Step 4: Create Heroku App
```bash
cd backend
heroku create jiffyjobs-backend
```

### Step 5: Add PostgreSQL
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### Step 6: Configure Environment Variables
```bash
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_EXPIRE=7d
heroku config:set NODE_ENV=production
heroku config:set PORT=5001
heroku config:set FRONTEND_URL=https://your-frontend-url.vercel.app
heroku config:set RESEND_API_KEY=<your key>
heroku config:set EMAIL_FROM=noreply@jiffyjobs.com
heroku config:set EMAIL_FROM_NAME=JiffyJobs
heroku config:set COOKIE_SECRET=$(openssl rand -base64 32)
heroku config:set STRIPE_SECRET_KEY=<your key>
heroku config:set STRIPE_PUBLISHABLE_KEY=<your key>
heroku config:set STRIPE_WEBHOOK_SECRET=<your key>
heroku config:set PLATFORM_FEE_PERCENTAGE=5
heroku config:set AUTO_RELEASE_HOURS=72
```

### Step 7: Run Migrations
```bash
heroku run npm run prisma:migrate deploy
```

### Step 8: Deploy
```bash
git push heroku main
```

### Step 9: Get Heroku Credentials
1. Go to [dashboard.heroku.com/account](https://dashboard.heroku.com/account)
2. Scroll to "API Key"
3. Click "Reveal" and copy
4. Your app name is: `jiffyjobs-backend`

### Step 10: Add GitHub Secrets
```
HEROKU_API_KEY=<API key from step 9>
HEROKU_APP_NAME=jiffyjobs-backend
HEROKU_EMAIL=<your Heroku account email>
```

---

## Post-Deployment Setup

### 1. Update Frontend API URL
After backend is deployed, update frontend environment variable:
```
VITE_API_URL=https://your-actual-backend-url/api
```

### 2. Configure CORS
Ensure backend `FRONTEND_URL` matches your actual frontend URL:
```
FRONTEND_URL=https://your-actual-frontend-url.vercel.app
```

### 3. Test Endpoints
```bash
# Health check
curl https://your-backend-url/api/health

# Should return: {"status":"OK","message":"Server is running"}
```

### 4. Run Database Seeds (Optional)
```bash
# On Railway
railway run npm run seed-skills

# On Render
# Use Shell in dashboard

# On Heroku
heroku run npm run seed-skills
```

### 5. Set Up Stripe Webhooks
1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend-url/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `payout.paid`
4. Copy webhook signing secret
5. Add to backend environment variables as `STRIPE_WEBHOOK_SECRET`

### 6. Verify Email Service
1. Test email sending with Resend
2. Verify sender email domain (if using custom domain)

### 7. Monitor Logs
```bash
# Railway
railway logs

# Render
# View in dashboard

# Heroku
heroku logs --tail
```

### 8. Set Up Alerts
- Configure uptime monitoring (UptimeRobot, Pingdom)
- Set up error tracking (Sentry, Rollbar)
- Configure log aggregation (Logtail, Papertrail)

---

## Quick Start Checklist

### Frontend (Vercel)
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Get Vercel credentials
- [ ] Add GitHub secrets
- [ ] Deploy and test

### Backend (Railway)
- [ ] Create Railway account
- [ ] Create PostgreSQL database
- [ ] Create Node.js service
- [ ] Add environment variables
- [ ] Run database migrations
- [ ] Get Railway credentials
- [ ] Add GitHub secrets
- [ ] Configure Stripe webhook
- [ ] Deploy and test

### Post-Deployment
- [ ] Update frontend API URL
- [ ] Configure CORS
- [ ] Test all endpoints
- [ ] Run database seeds
- [ ] Set up monitoring
- [ ] Configure custom domains (optional)

---

## Troubleshooting

### Frontend Build Fails
- Check `VITE_API_URL` is set correctly
- Verify build command: `npm run build`
- Check for TypeScript errors

### Backend Won't Start
- Verify all environment variables are set
- Check `DATABASE_URL` is correct
- Verify migrations ran successfully
- Check logs for specific errors

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check database is running
- Verify network access (some platforms require whitelisting)
- Check connection pool limits

### CORS Errors
- Verify `FRONTEND_URL` matches actual frontend URL
- Check CORS configuration in backend
- Ensure no trailing slashes in URLs

---

## Cost Estimates

### Free Tier Options
- **Vercel**: Free for personal projects (100GB bandwidth/month)
- **Railway**: $5/month free credit
- **Render**: Free tier available (with limitations)
- **Netlify**: Free tier (100GB bandwidth/month)
- **Heroku**: No longer has free tier (paid only)

### Recommended for Production
- **Frontend**: Vercel Pro ($20/month) or Netlify Pro ($19/month)
- **Backend**: Railway ($5-20/month) or Render ($7-25/month)
- **Database**: Included with Railway/Render, or separate PostgreSQL ($5-15/month)

---

## Support

For issues:
1. Check platform documentation
2. Review deployment logs
3. Check GitHub Actions logs
4. Verify environment variables
5. Test locally first

