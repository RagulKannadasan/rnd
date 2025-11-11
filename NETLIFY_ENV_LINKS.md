# Direct Links to Netlify Environment Variables

## Quick Access Links

### Option 1: General Dashboard (Login Required)
1. **Netlify Dashboard**: https://app.netlify.com
2. Click on your site
3. Go to **Site settings** → **Environment variables**

### Option 2: Direct URL Pattern
Replace `[your-site-name]` with your actual Netlify site name:

```
https://app.netlify.com/sites/[your-site-name]/configuration/env
```

**Example:**
If your site is `runanddevelop`, the link would be:
```
https://app.netlify.com/sites/runanddevelop/configuration/env
```

### Option 3: Step-by-Step Navigation
1. Go to: https://app.netlify.com
2. Click on your site from the list
3. In the left sidebar, click **Site settings**
4. Scroll down and click **Environment variables** (under Build & deploy)

## How to Find Your Site Name

1. Go to https://app.netlify.com
2. Your site name is shown in the site list
3. Or check your site URL: `https://[site-name].netlify.app`

## Environment Variable to Add/Update

**Key**: `REACT_APP_API_BASE_URL`

**Value**: `https://your-render-backend-url.onrender.com`

(Replace with your actual Render backend URL)

## After Updating

1. Click **Save**
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Deploy site**
4. Wait for deployment to complete

## Alternative: Use Netlify CLI

If you have Netlify CLI installed:

```bash
# Login to Netlify
netlify login

# Open environment variables in browser
netlify open:admin

# Or set environment variable via CLI
netlify env:set REACT_APP_API_BASE_URL "https://your-backend-url.onrender.com"
```

