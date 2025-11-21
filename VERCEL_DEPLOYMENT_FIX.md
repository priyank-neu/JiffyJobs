# Vercel Deployment Fix Guide

## Common Vercel Deployment Issues

### Issue 1: Missing Environment Variables

**Problem:** Vercel needs environment variables configured in their dashboard, not just in GitHub Actions.

**Solution:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### For Production (main branch):
- `VITE_API_URL` = Your production backend URL (e.g., `https://your-backend.onrender.com/api`)

#### For Preview/Staging (development branch):
- `VITE_API_URL` = Your staging backend URL (e.g., `https://your-staging-backend.onrender.com/api`)

### Issue 2: Build Command Issues

**Problem:** Vercel might not be detecting the correct build settings.

**Solution:**
1. Go to **Settings** → **General** in your Vercel project
2. Verify:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend` (if your project is in a monorepo)
   - **Build Command:** `npm run build` (or leave empty to auto-detect)
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci` (or leave empty)

### Issue 3: Monorepo Configuration

**Problem:** If your project is a monorepo, Vercel needs to know the root directory.

**Solution:**
1. In Vercel project settings, set **Root Directory** to `frontend`
2. Or create a `vercel.json` in the root with:
   ```json
   {
     "buildCommand": "cd frontend && npm run build",
     "outputDirectory": "frontend/dist"
   }
   ```

### Issue 4: GitHub Actions vs Vercel Auto-Deploy

**Problem:** You might have both GitHub Actions CD and Vercel's auto-deploy enabled, causing conflicts.

**Solution:**
- **Option A:** Use GitHub Actions CD (recommended for CI/CD pipeline)
  - Disable Vercel's GitHub integration auto-deploy
  - Let GitHub Actions handle deployments
  
- **Option B:** Use Vercel's native auto-deploy
  - Remove GitHub Actions CD workflow
  - Enable Vercel's GitHub integration

### Issue 5: Missing Build Dependencies

**Problem:** Build fails due to missing dependencies or TypeScript errors.

**Solution:**
1. Check Vercel build logs for specific errors
2. Ensure all dependencies are in `package.json`
3. Run `npm run build` locally to verify it works

## Quick Fix Steps

1. **Check Vercel Dashboard:**
   - Go to your project → **Deployments**
   - Click on the failed deployment
   - Check the build logs for specific errors

2. **Verify Environment Variables:**
   - Settings → Environment Variables
   - Ensure `VITE_API_URL` is set for both Production and Preview

3. **Check Build Settings:**
   - Settings → General
   - Verify Framework Preset is "Vite"
   - Verify Root Directory (if monorepo)

4. **Test Locally:**
   ```bash
   cd frontend
   npm ci
   VITE_API_URL=https://your-backend-url.onrender.com/api npm run build
   ```

## Current Configuration

- **Build Command:** `npm run build` (runs `tsc -b && vite build`)
- **Output Directory:** `dist`
- **Framework:** Vite
- **Required Env Var:** `VITE_API_URL`

## Next Steps

1. Check the specific error in Vercel dashboard
2. Add missing environment variables
3. Verify build settings
4. Re-deploy

