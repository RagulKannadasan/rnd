# Backend Integration Steps

## ✅ Backend is Running Successfully!

Now you need to connect your Netlify frontend to your Render backend.

## Step 1: Get Your Backend URL

Your Render backend URL should look like:
```
https://razorpay-backend-xxxx.onrender.com
```

Copy this URL - you'll need it in the next step.

## Step 2: Update Netlify Environment Variable

1. Go to your **Netlify Dashboard**: https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add or update the following variable:
   ```
   REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com
   ```
   (Replace with your actual Render backend URL)

5. Click **Save**

## Step 3: Redeploy Netlify Site

After updating the environment variable:

1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**
3. Wait for the deployment to complete

OR

Simply push a new commit to trigger auto-deployment:
```bash
git commit --allow-empty -m "Trigger Netlify rebuild with new backend URL"
git push
```

## Step 4: Test the Integration

### Test 1: Health Check
Visit your backend health endpoint:
```
https://your-backend-url.onrender.com/api/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "...",
  "mode": "TEST",
  "keyIdSet": true,
  "razorpayInitialized": true
}
```

### Test 2: Test Keys
Visit:
```
https://your-backend-url.onrender.com/api/test-keys
```

Should return:
```json
{
  "mode": "test",
  "keyIdSet": true,
  "keySecretSet": true,
  "keyId": "rzp_test_...",
  "razorpayInitialized": true
}
```

### Test 3: Frontend Integration
1. Open your Netlify site
2. Open browser DevTools (F12) → Console tab
3. Try to make a payment or create an order
4. Check console for any CORS errors
5. Check Network tab to see if API calls are going to your Render backend

## Step 5: Verify CORS Configuration

If you see CORS errors, verify your Netlify URL is in the allowed origins.

Your backend CORS is configured to allow:
- `https://*.netlify.app` (all Netlify sites)
- `https://runanddevelop.netlify.app` (specific site)

If your Netlify URL is different, you may need to update `scripts/server.js`.

## Step 6: Test Payment Flow

1. Go to your Netlify site
2. Navigate to a plan or event booking page
3. Try to make a test payment
4. Check:
   - Browser console for errors
   - Network tab for API requests
   - Render logs for backend activity

## Troubleshooting

### CORS Errors
**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution**: 
- Verify `REACT_APP_API_BASE_URL` is set correctly in Netlify
- Check that your Netlify URL matches the CORS configuration
- Check Render logs for CORS rejection messages

### 404 Errors
**Error**: `GET https://your-backend.onrender.com/api/... 404`

**Solution**:
- Verify the endpoint exists in `scripts/server.js`
- Check that the URL path is correct
- Ensure backend is running (check Render dashboard)

### Payment Creation Fails
**Error**: Payment order creation fails

**Solution**:
- Check Render logs for detailed error messages
- Verify Razorpay keys are set correctly in Render environment variables
- Test the `/api/test-keys` endpoint to verify configuration
- Ensure keys are for the correct mode (test vs live)

### Backend Not Responding
**Error**: Connection timeout or 502 error

**Solution**:
- Check Render service status in dashboard
- Verify service is not sleeping (free tier sleeps after 15 min inactivity)
- Check Render logs for startup errors
- Verify `PORT` environment variable is being used correctly

## Monitoring

### Render Dashboard
- View logs: Render Dashboard → Your Service → Logs
- View metrics: CPU, Memory, Response times
- Set up alerts: Email notifications for service failures

### Netlify Dashboard
- View build logs: Deploys → Select deploy → Build log
- View function logs: Functions tab
- Monitor site performance: Analytics tab

## Next Steps

1. ✅ Backend deployed and running
2. ⬜ Update Netlify `REACT_APP_API_BASE_URL`
3. ⬜ Redeploy Netlify site
4. ⬜ Test health endpoint
5. ⬜ Test payment flow
6. ⬜ Configure Razorpay webhooks (optional)
7. ⬜ Monitor logs and performance

## Webhook Configuration (Optional)

If you want to use Razorpay webhooks:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-backend-url.onrender.com/api/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
4. Copy the webhook secret
5. Add to Render environment variables as `RAZORPAY_WEBHOOK_SECRET`

## Success Indicators

✅ Backend health check returns OK
✅ Frontend can make API calls to backend
✅ No CORS errors in browser console
✅ Payment orders can be created
✅ Payment flow completes successfully

---

**Your backend is ready!** Now connect your frontend and test the complete flow.

