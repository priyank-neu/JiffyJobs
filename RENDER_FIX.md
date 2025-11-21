# Fix Render Deployment Database Connection Issue

## Problem
The deployment is failing with: `Can't reach database server at 'localhost:5432'`

This happens because the backend is trying to connect to localhost, but on Render, the database is a separate service.

## Solution

### Step 1: Verify Database Service is Created
1. In Render dashboard, make sure you have a PostgreSQL database service
2. If not, create one:
   - Click "New +" → "PostgreSQL"
   - Name it: `jiffyjobs-db`
   - Copy the "Internal Database URL" (you'll need this)

### Step 2: Set Environment Variables in Render
1. Go to your **Web Service** (JiffyJobs backend)
2. Click on "Environment" in the left sidebar
3. Add/Verify these environment variables:

**CRITICAL - Database Connection:**
```
DATABASE_URL=<from PostgreSQL service>
```

**How to get DATABASE_URL:**
- Option 1: In PostgreSQL service → "Info" tab → Copy "Internal Database URL"
- Option 2: In PostgreSQL service → "Connections" tab → Copy "Internal Database URL"
- Option 3: In Web Service → Environment → Click "Link Database" → Select your PostgreSQL service

**Other Required Variables:**
```
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRE=7d
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://your-frontend-url.vercel.app
RESEND_API_KEY=<your Resend API key>
EMAIL_FROM=noreply@jiffyjobs.com
EMAIL_FROM_NAME=JiffyJobs
COOKIE_SECRET=<generate with: openssl rand -base64 32>
STRIPE_SECRET_KEY=<your Stripe secret key>
STRIPE_PUBLISHABLE_KEY=<your Stripe publishable key>
STRIPE_WEBHOOK_SECRET=<your Stripe webhook secret>
PLATFORM_FEE_PERCENTAGE=5
AUTO_RELEASE_HOURS=72
```

### Step 3: Link Database to Web Service (Recommended)
1. In your Web Service → Environment
2. Scroll to "Database" section
3. Click "Link Database"
4. Select your PostgreSQL service
5. This automatically adds `DATABASE_URL` as an environment variable

### Step 4: Verify Build Command
In Web Service → Settings → Build Command, make sure it's:
```
npm ci && npm run build
```

### Step 5: Verify Start Command
In Web Service → Settings → Start Command, make sure it's:
```
npm start
```

### Step 6: Run Migrations
After setting DATABASE_URL, you need to run migrations:

**Option A: Via Shell (Recommended)**
1. In Web Service → Click "Shell" in left sidebar
2. Run:
```bash
npx prisma migrate deploy
```

**Option B: Add to Build Command**
Update Build Command to:
```
npm ci && npm run build && npx prisma migrate deploy
```

**Option C: Use Render CLI**
```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Run migrations
render shell -s <your-service-id> -c "npx prisma migrate deploy"
```

### Step 7: Redeploy
1. Go to "Deployments" tab
2. Click "Manual Deploy" → "Deploy latest commit"
3. Or push a new commit to trigger automatic deployment

## Common Issues

### Issue 1: DATABASE_URL not set
**Symptom:** Still seeing localhost:5432 error
**Fix:** 
- Double-check Environment variables
- Make sure DATABASE_URL is set (not empty)
- Use "Link Database" feature for automatic setup

### Issue 2: Wrong DATABASE_URL format
**Symptom:** Connection refused or authentication failed
**Fix:**
- Use "Internal Database URL" (not External)
- Format should be: `postgresql://user:password@host:port/database`
- Don't modify the URL manually

### Issue 3: Database not accessible
**Symptom:** Can't reach database server
**Fix:**
- Make sure database service is running (not paused)
- Use Internal URL, not External
- Both services must be in same region

### Issue 4: Prisma can't find DATABASE_URL
**Symptom:** Prisma still using localhost
**Fix:**
- Check `prisma.config.ts` - it should use `process.env.DATABASE_URL`
- Verify environment variable is set in Render dashboard
- Restart the service after adding environment variables

## Verification Steps

1. **Check Environment Variables:**
   - Go to Web Service → Environment
   - Verify DATABASE_URL is set and not empty
   - Should start with `postgresql://`

2. **Check Database Service:**
   - Go to PostgreSQL service
   - Verify it's "Running" (not Paused)
   - Check "Info" tab for connection details

3. **Test Connection:**
   - Use Shell in Web Service
   - Run: `node -e "console.log(process.env.DATABASE_URL)"`
   - Should print the database URL (not undefined)

4. **Check Logs:**
   - After redeploy, check logs
   - Should see: "Server running on port 5001"
   - Should NOT see: "localhost:5432" errors

## Quick Fix Checklist

- [ ] PostgreSQL database service exists and is running
- [ ] DATABASE_URL environment variable is set in Web Service
- [ ] DATABASE_URL uses Internal Database URL (not External)
- [ ] All other required environment variables are set
- [ ] Build command includes: `npm ci && npm run build`
- [ ] Start command is: `npm start`
- [ ] Migrations have been run (via Shell or Build Command)
- [ ] Service has been redeployed after setting variables

## Still Having Issues?

1. **Check Render Status:** [status.render.com](https://status.render.com)
2. **View Detailed Logs:** Web Service → Logs tab
3. **Contact Support:** Use "Contact support" in Render dashboard
4. **Common Render Docs:** [render.com/docs/troubleshooting-deploys](https://render.com/docs/troubleshooting-deploys)

