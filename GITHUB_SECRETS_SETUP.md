# GitHub Secrets Setup - Quick Reference

## Required Secrets for CD Pipeline

Add these in: **GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

### Frontend (Vercel)

| Secret Name | How to Get | Example |
|------------|------------|---------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token | `vercel_xxxxx...` |
| `VERCEL_ORG_ID` | [vercel.com/account](https://vercel.com/account) → Copy Team ID | `team_xxxxx` |
| `VERCEL_PROJECT_ID` | Vercel Project → Settings → General → Project ID | `prj_xxxxx` |
| `VERCEL_PROJECT_ID_STAGING` | Same as above (or create separate staging project) | `prj_xxxxx` |
| `VITE_API_URL_PROD` | Your production backend URL | `https://jiffyjobs.onrender.com/api` |
| `VITE_API_URL_STAGING` | Your staging backend URL | `https://jiffyjobs-staging.onrender.com/api` |

### Backend (Render)

| Secret Name | How to Get | Example |
|------------|------------|---------|
| `RENDER_API_KEY` | [dashboard.render.com/account/api-keys](https://dashboard.render.com/account/api-keys) → Create API Key | `rnd_xxxxx...` |
| `RENDER_SERVICE_ID` | Render Web Service → Settings → Service ID | `srv-xxxxx...` |
| `RENDER_SERVICE_ID_STAGING` | (Optional) Separate staging service ID | `srv-xxxxx...` |

## Quick Setup Steps

1. **Get Vercel Credentials:**
   ```bash
   # Or use Vercel dashboard
   # Token: vercel.com/account/tokens
   # Org ID: vercel.com/account (Team ID)
   # Project ID: Project Settings → General
   ```

2. **Get Render Credentials:**
   ```bash
   # API Key: dashboard.render.com/account/api-keys
   # Service ID: Service → Settings → Service ID
   ```

3. **Add to GitHub:**
   - Repository → Settings → Secrets → Actions
   - Click "New repository secret"
   - Add each secret one by one

4. **Test:**
   - Push to `development` branch
   - Check GitHub Actions tab
   - Should see CD workflows running

## Verification

After adding secrets, test by:
1. Making a small change
2. Pushing to `development`
3. Check GitHub Actions → Should see "Frontend CD" and "Backend CD" workflows
4. Check Vercel/Render dashboards → Should see new deployments

## Notes

- Secrets are case-sensitive
- Use exact names as shown above
- You can update secrets anytime
- Secrets are encrypted and only visible to GitHub Actions

