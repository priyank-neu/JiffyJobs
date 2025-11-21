# Vercel Deployment Troubleshooting

## Common Errors and Solutions

### Error 1: "The specified Root Directory 'frontend' does not exist"

**Solution:**
1. Go to Vercel Dashboard → Your Project → **Settings** → **General**
2. Find **"Root Directory"**
3. **Option A:** Set it to `frontend` (if your repo has a frontend folder)
4. **Option B:** Leave it **empty** (if using root vercel.json)
5. Click **Save**
6. **Redeploy**

### Error 2: Build Command Fails

**Check:**
1. Go to **Deployments** → Click on failed deployment → **Build Logs**
2. Look for specific error messages
3. Common issues:
   - Missing dependencies
   - TypeScript errors
   - Missing environment variables

**Solution:**
- Fix the errors shown in build logs
- Ensure `VITE_API_URL` is set in Vercel environment variables

### Error 3: "Cannot find module" or Missing Dependencies

**Solution:**
1. Verify `package.json` has all dependencies
2. Check if `node_modules` is in `.gitignore` (should be)
3. Vercel will run `npm ci` automatically

### Error 4: Environment Variables Not Working

**Solution:**
1. Go to **Settings** → **Environment Variables**
2. Verify `VITE_API_URL` is set for:
   - **Production** (for main branch)
   - **Preview** (for development branch)
3. Make sure to add `/api` at the end:
   - ✅ `https://your-backend.onrender.com/api`
   - ❌ `https://your-backend.onrender.com` (missing /api)

### Error 5: Build Output Not Found

**Solution:**
1. Check **Settings** → **General** → **Output Directory**
2. Should be: `dist` (for Vite)
3. Or leave empty to auto-detect

## Step-by-Step Fix

### Step 1: Check Build Logs
1. Go to **Deployments** tab
2. Click on the failed deployment
3. Scroll to **"Build Logs"** section
4. Look for red error messages
5. Copy the exact error message

### Step 2: Verify Project Settings
1. **Settings** → **General**
2. Verify:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend` OR empty
   - **Build Command:** Leave empty (auto-detect)
   - **Output Directory:** Leave empty (auto-detect)

### Step 3: Verify Environment Variables
1. **Settings** → **Environment Variables**
2. Check `VITE_API_URL` exists
3. Verify it's set for the correct environment (Preview/Production)

### Step 4: Test Locally
```bash
cd frontend
npm ci
VITE_API_URL=https://your-backend.onrender.com/api npm run build
```

If this fails locally, fix the errors before deploying.

### Step 5: Redeploy
1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Or push a new commit

## Quick Checklist

- [ ] Root Directory is set correctly (or empty)
- [ ] Framework Preset is "Vite"
- [ ] `VITE_API_URL` environment variable is set
- [ ] `VITE_API_URL` includes `/api` at the end
- [ ] Build works locally (`npm run build`)
- [ ] No TypeScript errors
- [ ] All dependencies in `package.json`

## Still Having Issues?

1. **Share the exact error message** from Build Logs
2. **Check if build works locally:**
   ```bash
   cd frontend
   npm ci
   npm run build
   ```
3. **Verify Vercel project settings** match the guide above

