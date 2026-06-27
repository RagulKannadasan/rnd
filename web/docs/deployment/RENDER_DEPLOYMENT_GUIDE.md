# Render Backend Deployment Guide

This guide will help you deploy the Razorpay backend server to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your Razorpay test/live API keys
3. Your Netlify frontend URL (for CORS configuration)

## Step 1: Prepare Your Repository

1. Make sure your code is pushed to GitHub/GitLab/Bitbucket
2. Ensure `render.yaml` is in the root of your repository
3. Verify `scripts/server.js` exists and is configured correctly

## Step 2: Create a New Web Service on Render

1. Go to your Render Dashboard: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your repository (GitHub/GitLab/Bitbucket)
4. Select your repository

## Step 3: Configure the Service

### Basic Settings:
- **Name**: `razorpay-backend` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Singapore, US East)
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (root of repo)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm run server`

### Environment Variables:

Add these in the **Environment** tab:

#### Required Variables:
```
NODE_ENV=production
RAZORPAY_MODE=test
RAZORPAY_KEY_ID_TEST=your_test_key_id_here
RAZORPAY_KEY_SECRET_TEST=your_test_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

#### Optional Variables:
```
RAZORPAY_KEY_ID_LIVE=your_live_key_id (if using live mode)
RAZORPAY_KEY_SECRET_LIVE=your_live_key_secret (if using live mode)
```

**Note**: Render will automatically set the `PORT` environment variable. Your server.js already handles this.

### Advanced Settings:
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: `Yes` (deploys on every push to main branch)

## Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying your service
3. Wait for the deployment to complete (usually 2-5 minutes)
4. Once deployed, you'll get a URL like: `https://razorpay-backend-xxxx.onrender.com`

## Step 5: Update Frontend Configuration

After deployment, update your Netlify environment variables:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add/Update:
   ```
   REACT_APP_API_BASE_URL=https://razorpay-backend-xxxx.onrender.com
   ```
   (Replace `xxxx` with your actual Render service ID)

4. Redeploy your Netlify site to pick up the new environment variable

## Step 6: Test the Deployment

1. **Health Check**: Visit `https://your-backend-url.onrender.com/api/health`
   - Should return: `{"status":"OK","timestamp":"...","mode":"TEST",...}`

2. **Test Keys**: Visit `https://your-backend-url.onrender.com/api/test-keys`
   - Should show your keys are configured (without exposing full keys)

3. **Test from Frontend**: Try making a payment from your Netlify frontend
   - Check browser console for any CORS errors
   - Check Render logs for backend requests

## Step 7: Configure Webhooks (Optional)

If you want to use Razorpay webhooks:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-backend-url.onrender.com/api/webhook`
3. Select events: `payment.captured`, `payment.failed`, `order.paid`
4. Copy the webhook secret and add it to Render environment variables as `RAZORPAY_WEBHOOK_SECRET`

## Troubleshooting

### Build Fails
- Check Render build logs for errors
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility (should be 18+)

### Server Won't Start
- Check Render service logs
- Verify `npm run server` command works locally
- Ensure PORT environment variable is being used correctly

### CORS Errors
- Verify your Netlify URL is in the CORS origins list in `server.js`
- Check that `REACT_APP_API_BASE_URL` is set correctly in Netlify
- Ensure backend URL doesn't have trailing slash

### Payment Creation Fails
- Check Razorpay keys are set correctly in Render environment variables
- Verify keys are for the correct mode (test vs live)
- Check Render logs for detailed error messages

### Health Check Fails
- Visit `/api/health` endpoint directly
- Check server logs for startup errors
- Verify all required environment variables are set

## Monitoring

- **Logs**: View real-time logs in Render dashboard
- **Metrics**: Monitor CPU, memory, and response times
- **Alerts**: Set up email alerts for service failures

## Free Tier Limitations

Render's free tier has some limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds (cold start)
- 750 hours/month of runtime

**For production**, consider upgrading to a paid plan for:
- Always-on services
- Better performance
- More resources

## Security Best Practices

1. **Never commit API keys** to your repository
2. **Use environment variables** for all sensitive data
3. **Enable webhook signature verification** in production
4. **Use HTTPS** (Render provides this automatically)
5. **Regularly rotate** your API keys

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Razorpay Docs: https://razorpay.com/docs

