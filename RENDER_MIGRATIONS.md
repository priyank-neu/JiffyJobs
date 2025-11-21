# Fix: Database Tables Don't Exist on Render

## Problem
The service starts but fails with: `The table 'public.contracts' does not exist`

This means database migrations haven't been run on your Render database.

## Solution: Run Migrations

### Option 1: Via Render Shell (Recommended)

1. In Render dashboard → Your Web Service (JiffyJobs)
2. Click "Shell" in the left sidebar
3. Run this command:
```bash
npx prisma migrate deploy
```

This will create all the necessary tables in your database.

### Option 2: Add to Build Command (Automatic)

1. In Render dashboard → Your Web Service → Settings
2. Find "Build Command"
3. Change it to:
```
npm ci && npm run build && npx prisma migrate deploy
```

4. Save and redeploy

### Option 3: Add to Start Script

Update your `package.json` start script to run migrations first:

```json
"start": "npx prisma migrate deploy && node dist/index.js"
```

**Note:** This is less ideal as it runs migrations on every restart.

## Verify Migrations Ran

After running migrations, verify tables exist:

1. In Render Shell, run:
```bash
npx prisma studio
```

Or check via SQL:
```bash
# Connect to your database
psql $DATABASE_URL

# List tables
\dt

# Should see: contracts, users, tasks, bids, etc.
```

## Quick Fix Steps

1. **Go to Render Shell:**
   - Web Service → Shell (left sidebar)

2. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Verify output:**
   Should see: "All migrations have been successfully applied"

4. **Restart service:**
   - Go to "Deployments" tab
   - Click "Manual Deploy" → "Deploy latest commit"

## Why This Happened

- Database was created but migrations weren't run
- Render doesn't automatically run Prisma migrations
- You need to run them manually or add to build/start commands

## Prevention

Add migrations to your build command so they run automatically on every deploy:

**Build Command:**
```
npm ci && npm run build && npx prisma migrate deploy
```

This ensures:
- Dependencies are installed
- Code is built
- Database migrations are applied
- Service starts with up-to-date schema

## After Migrations

Once migrations are run, your service should:
- Start successfully
- Have all tables created
- Auto-release scheduler should work
- All features should function

## Troubleshooting

### Error: "Migration engine failed to connect"
- Check DATABASE_URL is set correctly
- Verify database service is running
- Check network connectivity

### Error: "Migration already applied"
- This is fine, means migrations are up to date
- Service should work normally

### Tables still missing after migrations
- Check migration logs for errors
- Verify DATABASE_URL points to correct database
- Try running: `npx prisma migrate reset` (WARNING: deletes all data)

