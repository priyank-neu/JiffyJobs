# Render Deployment - Step by Step Fix

## Current Issue
Render says "No migration found in prisma/migrations" because migrations were in `.gitignore`.

## ✅ What I Fixed
1. Removed migrations from `.gitignore` (migrations should be committed)
2. Committed existing migrations to repository
3. Created new migration for all current schema changes
4. Added error handling for missing tables

## Next Steps for Render

### Step 1: Push Latest Code
```bash
git push origin feature/profile-skills-verification
# Or merge to main/development first
```

### Step 2: Update Render Build Command
In Render dashboard → Your Web Service → Settings:

**Current Build Command:**
```
npm install && npx prisma migrate deploy && npm run build
```

**Should work now** - but verify it's exactly this:
```
npm ci && npm run build && npx prisma migrate deploy
```

**Or if you prefer migrations first:**
```
npm ci && npx prisma migrate deploy && npm run build
```

### Step 3: Verify Environment Variables
Make sure these are set in Render → Environment:
- ✅ `DATABASE_URL` (from PostgreSQL service)
- ✅ `JWT_SECRET`
- ✅ `JWT_EXPIRE=7d`
- ✅ `NODE_ENV=production`
- ✅ `PORT=5001`
- ✅ `FRONTEND_URL`
- ✅ All other required variables

### Step 4: Redeploy
1. Go to "Deployments" tab
2. Click "Manual Deploy" → "Deploy latest commit"
3. Watch the logs

### Step 5: Verify Migrations Ran
In the build logs, you should see:
```
✅ Applied migration: 20251022193433_initial_auth_setup
✅ Applied migration: 20251023000841_add_task_posting_models
✅ Applied migration: [new migration name]
```

### Step 6: Check Service Starts
After deployment, logs should show:
```
🚀 Server running on port 5001
📝 Environment: production
🌐 API URL: https://your-url.onrender.com
🔌 Socket.IO enabled
Auto-release scheduler started
```

## If Migrations Still Don't Work

### Option A: Run Migrations Manually
1. Go to Render Shell
2. Run: `npx prisma migrate deploy`
3. Verify: Should see "All migrations have been successfully applied"

### Option B: Use Prisma DB Push (Temporary)
If migrations fail, you can use:
```bash
npx prisma db push
```
**Warning:** This doesn't create migration history, but will sync schema.

### Option C: Check Migration Files
Verify migrations are in repository:
```bash
git ls-files backend/prisma/migrations/
```
Should list all migration files.

## Troubleshooting

### "No migration found"
- ✅ Fixed: Migrations are now committed
- Verify: `git ls-files backend/prisma/migrations/` shows files

### "Table does not exist"
- Run migrations: `npx prisma migrate deploy`
- Or add to build command (already done)

### "Can't reach database"
- Check `DATABASE_URL` is set
- Use Internal Database URL (not External)
- Link database in Render dashboard

### Build succeeds but service crashes
- Check logs for specific errors
- Verify all environment variables
- Check database connectivity

## Success Indicators

✅ Build completes without errors
✅ Migrations show "Applied" in logs
✅ Service starts and shows "Server running"
✅ Health check works: `curl https://your-url.onrender.com/api/health`
✅ No "table does not exist" errors

## After Successful Deployment

1. **Test API:**
   ```bash
   curl https://your-url.onrender.com/api/health
   ```

2. **Update Frontend:**
   - Set `VITE_API_URL` to your Render backend URL
   - Redeploy frontend

3. **Configure Stripe Webhook:**
   - Add webhook URL: `https://your-url.onrender.com/api/payments/webhook`
   - Copy webhook secret to Render environment variables

4. **Run Seeds (Optional):**
   ```bash
   # In Render Shell
   npm run seed-skills
   ```

