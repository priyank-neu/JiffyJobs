# Deployment Guide

This document outlines the CI/CD setup and deployment options for JiffyJobs.

## CI/CD Overview

### Continuous Integration (CI) ✅
- **Backend CI**: Runs on every PR and push to `development`/`main`
  - TypeScript compilation check
  - Prisma migrations
  - Linting
  - Tests (when configured)

- **Frontend CI**: Runs on every PR and push to `development`/`main`
  - TypeScript compilation check
  - Build verification
  - Linting
  - Tests (when configured)

### Continuous Deployment (CD) 🚀

CD workflows are configured to deploy automatically after successful CI runs.

## Deployment Platforms

### Frontend Deployment Options

#### Option 1: Vercel (Recommended) ⭐
**Best for**: React/Vite applications, automatic deployments, preview deployments

**Setup Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `cd frontend && vercel link`
4. Get credentials from Vercel dashboard:
   - `VERCEL_TOKEN`: Personal access token
   - `VERCEL_ORG_ID`: Organization ID
   - `VERCEL_PROJECT_ID`: Project ID

**Add to GitHub Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID` (production)
- `VERCEL_PROJECT_ID_STAGING` (staging)
- `VITE_API_URL_PROD` (production API URL)
- `VITE_API_URL_STAGING` (staging API URL)

#### Option 2: Netlify
**Best for**: Static sites, form handling, serverless functions

**Setup Steps:**
1. Create account at [netlify.com](https://netlify.com)
2. Create new site from Git
3. Get credentials from Netlify dashboard

**Add to GitHub Secrets:**
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`
- `VITE_API_URL_PROD`
- `VITE_API_URL_STAGING`

#### Option 3: GitHub Pages
**Best for**: Free hosting, simple deployments

**Setup Steps:**
1. Enable GitHub Pages in repository settings
2. Set source to `gh-pages` branch

**Add to GitHub Secrets:**
- `CUSTOM_DOMAIN` (optional)

### Backend Deployment Options

#### Option 1: Railway (Recommended) ⭐
**Best for**: Full-stack apps, PostgreSQL included, easy setup

**Setup Steps:**
1. Create account at [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL service
4. Add Node.js service
5. Get Railway token from account settings

**Add to GitHub Secrets:**
- `RAILWAY_TOKEN`
- `RAILWAY_PROJECT_ID` (production)
- `RAILWAY_TOKEN_STAGING` (staging)
- `RAILWAY_PROJECT_ID_STAGING` (staging)

**Environment Variables to set in Railway:**
```
DATABASE_URL=<from PostgreSQL service>
JWT_SECRET=<generate strong secret>
JWT_EXPIRE=7d
NODE_ENV=production
PORT=5001
FRONTEND_URL=<your frontend URL>
RESEND_API_KEY=<your Resend API key>
EMAIL_FROM=<your email>
EMAIL_FROM_NAME=JiffyJobs
COOKIE_SECRET=<generate strong secret>
STRIPE_SECRET_KEY=<your Stripe secret key>
STRIPE_PUBLISHABLE_KEY=<your Stripe publishable key>
STRIPE_WEBHOOK_SECRET=<your Stripe webhook secret>
PLATFORM_FEE_PERCENTAGE=5
AUTO_RELEASE_HOURS=72
```

#### Option 2: Render
**Best for**: Docker support, auto-scaling, managed PostgreSQL

**Setup Steps:**
1. Create account at [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Configure build and start commands

**Add to GitHub Secrets:**
- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`

#### Option 3: Heroku
**Best for**: Mature platform, add-ons ecosystem

**Setup Steps:**
1. Create account at [heroku.com](https://heroku.com)
2. Install Heroku CLI
3. Create app: `heroku create jiffyjobs-backend`
4. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`

**Add to GitHub Secrets:**
- `HEROKU_API_KEY`
- `HEROKU_APP_NAME`
- `HEROKU_EMAIL`

## Deployment Workflow

### Staging (Development Branch)
- Automatically deploys when code is pushed to `development`
- Only after CI passes
- Used for testing before production

### Production (Main Branch)
- Automatically deploys when code is merged to `main`
- Only after CI passes
- Requires manual merge (via PR)

## Manual Deployment

### Backend
```bash
cd backend
npm run build
# Then deploy using your platform's CLI or dashboard
```

### Frontend
```bash
cd frontend
npm run build
# Then deploy the dist/ folder to your hosting platform
```

## Database Migrations

### Automatic (Recommended)
Configure your deployment platform to run migrations automatically:
- **Railway**: Add `npm run prisma:migrate deploy` as a post-deploy script
- **Render**: Add as a build command
- **Heroku**: Use release phase: `heroku run npm run prisma:migrate deploy`

### Manual
```bash
# Production
DATABASE_URL=<production_db_url> npx prisma migrate deploy

# Staging
DATABASE_URL=<staging_db_url> npx prisma migrate deploy
```

## Environment Variables

### Backend Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_EXPIRE` - Token expiration (default: 7d)
- `NODE_ENV` - Environment (production/staging)
- `PORT` - Server port (default: 5001)
- `FRONTEND_URL` - Frontend URL for CORS
- `RESEND_API_KEY` - Email service API key
- `EMAIL_FROM` - Sender email address
- `EMAIL_FROM_NAME` - Sender name
- `COOKIE_SECRET` - Secret for cookie signing
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `PLATFORM_FEE_PERCENTAGE` - Platform fee (default: 5)
- `AUTO_RELEASE_HOURS` - Auto-release hours (default: 72)

### Frontend Required Variables
- `VITE_API_URL` - Backend API URL

## Monitoring & Logs

### Railway
- View logs in Railway dashboard
- Set up alerts in project settings

### Render
- View logs in service dashboard
- Configure health checks

### Heroku
```bash
heroku logs --tail
heroku logs --tail --app <app-name>
```

## Rollback

### Railway
- Use deployment history in dashboard
- Click "Redeploy" on previous deployment

### Render
- Use manual deploy from dashboard
- Select previous commit

### Heroku
```bash
heroku releases
heroku rollback v<version>
```

## Security Checklist

- [ ] All secrets stored in GitHub Secrets (not in code)
- [ ] Database credentials secured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] HTTPS enabled
- [ ] Environment variables validated
- [ ] Database migrations tested
- [ ] Backup strategy in place

## Troubleshooting

### Build Failures
1. Check CI logs for errors
2. Verify all dependencies are in package.json
3. Check TypeScript compilation errors
4. Verify environment variables are set

### Deployment Failures
1. Check deployment platform logs
2. Verify secrets are correctly set
3. Check database connectivity
4. Verify build output exists

### Database Issues
1. Verify DATABASE_URL is correct
2. Check migration status
3. Verify database is accessible
4. Check connection pool limits

## Next Steps

1. Choose deployment platforms (Vercel + Railway recommended)
2. Set up accounts and projects
3. Add GitHub Secrets
4. Test deployment to staging
5. Configure custom domains (optional)
6. Set up monitoring and alerts
7. Configure database backups

