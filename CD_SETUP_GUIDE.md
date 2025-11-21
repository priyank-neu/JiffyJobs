# CD Pipeline Setup Guide

## Overview
This guide helps you set up the Continuous Deployment (CD) pipeline so that code automatically deploys to Vercel (frontend) and Render (backend) when you push to `development` or `main` branches.

## Prerequisites
- ✅ Vercel account and project created
- ✅ Render account and services created
- ✅ Manual deployments working

## Step 1: Get Required Credentials

### Frontend - Vercel Credentials

1. **Get Vercel Token:**
   - Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Click "Create Token"
   - Name: `GitHub Actions Deploy`
   - Copy the token

2. **Get Organization ID:**
   - Go to [vercel.com/account](https://vercel.com/account)
   - Copy "Team ID" (this is your Organization ID)

3. **Get Project IDs:**
   - Go to your Vercel project → Settings → General
   - Copy "Project ID"
   - Create a separate project for staging (or use the same one)
   - Copy staging "Project ID" (if different)

### Backend - Render Credentials

1. **Get Render API Key:**
   - Go to [dashboard.render.com/account/api-keys](https://dashboard.render.com/account/api-keys)
   - Click "Create API Key"
   - Name: `GitHub Actions Deploy`
   - Copy the key

2. **Get Service ID:**
   - Go to your Render Web Service
   - Settings → Copy "Service ID"

## Step 2: Add GitHub Secrets

1. Go to your GitHub repository: `https://github.com/priyank-neu/JiffyJobs`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Add These Secrets:

#### Vercel (Frontend)
```
VERCEL_TOKEN=<your vercel token>
VERCEL_ORG_ID=<your organization/team ID>
VERCEL_PROJECT_ID=<production project ID>
VERCEL_PROJECT_ID_STAGING=<staging project ID (or same as production)>
VITE_API_URL_PROD=https://your-backend-url.onrender.com/api
VITE_API_URL_STAGING=https://your-staging-backend-url.onrender.com/api
```

#### Render (Backend)
```
RENDER_API_KEY=<your render API key>
RENDER_SERVICE_ID=<your render service ID>
```

## Step 3: Configure CD Workflows

The CD workflows are already created in:
- `.github/workflows/frontend-cd.yml`
- `.github/workflows/backend-cd.yml`

They will automatically:
- Deploy to **staging** when code is pushed to `development` branch
- Deploy to **production** when code is merged to `main` branch
- Only deploy after CI passes successfully

## Step 4: Test the Pipeline

### Test Staging Deployment:
1. Push to `development` branch:
   ```bash
   git checkout development
   git merge feature/profile-skills-verification
   git push origin development
   ```

2. Check GitHub Actions:
   - Go to repository → "Actions" tab
   - You should see "Frontend CD" and "Backend CD" workflows running
   - They should deploy to staging

### Test Production Deployment:
1. Merge to `main`:
   ```bash
   git checkout main
   git merge development
   git push origin main
   ```

2. Check GitHub Actions:
   - Workflows should deploy to production

## Step 5: Verify Deployment

### Frontend (Vercel)
- Check Vercel dashboard for new deployment
- Verify URL is accessible
- Test the application

### Backend (Render)
- Check Render dashboard for new deployment
- Verify service is running
- Check logs for "Server running on port 5001"
- Test API: `curl https://your-url.onrender.com/api/health`

## Workflow Behavior

### Automatic Triggers:
- **Push to `development`** → Deploys to staging
- **Push to `main`** → Deploys to production
- **After CI passes** → CD runs automatically

### Manual Triggers:
- You can also manually trigger workflows from GitHub Actions tab

## Troubleshooting

### Workflow Not Running
- Check if secrets are set correctly
- Verify branch names match (`development`, `main`)
- Check workflow file syntax

### Deployment Fails
- Check GitHub Actions logs
- Verify credentials are correct
- Check platform-specific logs (Vercel/Render)

### Secrets Not Working
- Verify secret names match exactly (case-sensitive)
- Re-check credentials from platforms
- Try regenerating tokens/keys

## Current Status

✅ CD workflow files created
⏳ GitHub Secrets need to be added
⏳ Test deployment needed

## Next Steps

1. Add all GitHub Secrets (Step 2)
2. Test with a small change to `development` branch
3. Verify deployments work
4. Then merge feature branch

