# How to Find Your Staging Backend URL

## Where to Find Your Render Backend URL (Staging)

### Step 1: Go to Render Dashboard
1. Visit: [dashboard.render.com](https://dashboard.render.com)
2. Log in to your account

### Step 2: Find Your Backend Service
1. In the dashboard, you'll see your services listed
2. Look for your backend service (e.g., "jiffyjobs-backend" or similar)
3. Click on the service name

### Step 3: Get the URL
1. Once in the service page, you'll see the service details
2. Look for the **"URL"** or **"Service URL"** section at the top
3. It will look like: `https://jiffyjobs-xxxxx.onrender.com`
4. **Your staging backend URL will be:** `https://jiffyjobs-xxxxx.onrender.com/api`

### Alternative: Check Service Settings
1. Go to your service → **Settings** tab
2. Scroll to **"Service Details"**
3. Find **"URL"** - this is your service URL
4. Add `/api` at the end for the API URL

## Example
If your Render service URL is:
```
https://jiffyjobs-backend.onrender.com
```

Then your staging API URL for Vercel should be:
```
https://jiffyjobs-backend.onrender.com/api
```

## If You Have Separate Staging and Production Services

### Staging Service (for development branch):
- Service name might be: `jiffyjobs-backend-staging` or `jiffyjobs-backend-dev`
- URL: `https://jiffyjobs-backend-staging.onrender.com/api`

### Production Service (for main branch):
- Service name might be: `jiffyjobs-backend` or `jiffyjobs-backend-prod`
- URL: `https://jiffyjobs-backend.onrender.com/api`

## Quick Check
You can also test if your backend is running:
```bash
curl https://your-backend-url.onrender.com/api/health
```

Should return: `{"status":"OK","message":"Server is running"}`

