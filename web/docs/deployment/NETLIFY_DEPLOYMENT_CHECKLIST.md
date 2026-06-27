# ✅ Netlify Deployment Checklist

Follow this checklist to successfully deploy your Run Development app to Netlify with proper Firebase authentication.

## 🔧 Pre-deployment Checklist

### 1. Firebase Configuration
- [ ] Enable **Authentication** in Firebase Console
- [ ] Enable **Phone** and **Email** sign-in providers
- [ ] Enable **Firestore Database**
- [ ] Add your Netlify domain to **Authorized Domains** in Firebase Authentication settings:
  - `your-site-name.netlify.app`
  - Your custom domain (if applicable)

### 2. Environment Variables
Add these variables in **Netlify Dashboard** → Site settings → Build & deploy → Environment → Environment variables:

```bash
# Required Environment Variables
NODE_VERSION=18
NODE_ENV=production
GENERATE_SOURCEMAP=false

# Firebase Configuration (optional but recommended)
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=sender_id_here
REACT_APP_FIREBASE_APP_ID=app_id_here
REACT_APP_FIREBASE_MEASUREMENT_ID=measurement_id_here

# EmailJS Configuration for Contact Form
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
```

### 3. Code Changes Verification
Ensure these files have been updated with the fixes:

- [ ] `src/Components/SignIn/SignIn.jsx` - Updated reCAPTCHA configuration with invisible mode
- [ ] `src/Components/Contact/Contact.jsx` - Updated Netlify function endpoint
- [ ] `netlify.toml` - Updated Content Security Policy headers with frame-src directive and API redirects
- [ ] `package.json` - Added Netlify-specific build script
- [ ] `src/firebase.js` - Added debugging information
- [ ] `FIREBASE_AUTH_TROUBLESHOOTING.md` - Created troubleshooting guide
- [ ] `NETLIFY_DEPLOYMENT_CHECKLIST.md` - This checklist
- [ ] `NETLIFY_OPTIMIZATION_GUIDE.md` - Created optimization guide

## 🚀 Deployment Steps

### Option 1: Netlify CLI (Recommended)
1. Install Node.js (if not already installed):
   ```bash
   # Install Node.js via Homebrew (macOS)
   brew install node
   
   # Or download from https://nodejs.org/
   ```

2. Install Netlify CLI globally:
   ```bash
   npm install -g netlify-cli
   ```

3. SignIn to Netlify:
   ```bash
   netlify SignIn
   ```

4. Deploy to Netlify:
   ```bash
   # For production deployment
   npm run netlify:deploy:prod
   
   # For staging deployment
   npm run netlify:deploy
   ```

### Option 2: Manual Deployment
1. Build the project:
   ```bash
   # If npm is not available, try:
   npx react-scripts build
   
   # Or if you have Node.js installed:
   npm run build
   ```

2. Deploy the `build/` folder to Netlify through the dashboard:
   - Go to https://app.netlify.com/
   - Click "New site from Git" or "Sites" → "Add new site" → "Deploy manually"
   - Upload the `build/` folder

## 🔍 Post-deployment Verification

### 1. Test Authentication
- [ ] Visit your deployed site
- [ ] Navigate to the SignIn page
- [ ] Enter a valid phone number
- [ ] Click "Get OTP"
- [ ] Verify that invisible reCAPTCHA works (no "I'm not a robot" badge should appear)
- [ ] Check that OTP is sent successfully

### 2. Test Contact Form
- [ ] Navigate to the Contact page
- [ ] Fill out the registration form
- [ ] Submit the form
- [ ] Verify that the form data is processed by the Netlify function
- [ ] Check that you receive the email notification

### 3. Check Browser Console
Open Developer Tools → Console:
- [ ] No CSP violations
- [ ] No Firebase initialization errors
- [ ] No reCAPTCHA errors
- [ ] Firebase config logs appear correctly

### 4. Verify Network Requests
In Developer Tools → Network tab:
- [ ] Firebase API calls succeed
- [ ] reCAPTCHA requests succeed
- [ ] Netlify function calls succeed
- [ ] No blocked requests

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### 1. "auth/internal-error" when sending OTP
**Solution**: 
- Verify CSP headers in `netlify.toml` include frame-src directive
- Check that reCAPTCHA size is set to 'invisible' in `SignIn.jsx`
- Ensure your domain is added to Firebase authorized domains

#### 2. Visible "I'm not a robot" badge appears
**Solution**:
- Verify the reCAPTCHA container has `display: none` style
- Check that reCAPTCHA size is set to 'invisible'
- Confirm Content Security Policy includes proper frame-src directive

#### 3. Contact form not working
**Solution**:
- Verify the endpoint is set to `/.netlify/functions/contact`
- Check that EmailJS environment variables are set in Netlify
- Review function logs in Netlify dashboard

#### 4. reCAPTCHA not loading
**Solution**:
- Check browser console for CSP violations
- Verify Content Security Policy includes Google domains
- Try disabling ad blockers

#### 5. Environment variables not loaded
**Solution**:
- Verify variables are added in Netlify Dashboard
- Check that variable names match exactly (REACT_APP_ prefix)
- Re-deploy after adding variables

#### 6. Firebase config not found
**Solution**:
- Check that `src/firebase.js` contains correct fallback values
- Verify Firebase project settings in Firebase Console

## 📞 Support

If you continue to experience issues:

1. Check the detailed troubleshooting guide: [FIREBASE_AUTH_TROUBLESHOOTING.md](FIREBASE_AUTH_TROUBLESHOOTING.md)
2. Review the optimization guide: [NETLIFY_OPTIMIZATION_GUIDE.md](NETLIFY_OPTIMIZATION_GUIDE.md)
3. Review Firebase Status Dashboard: https://status.firebase.google.com/
4. Check Netlify Status Dashboard: https://www.netlifystatus.com/
5. Contact Firebase Support with detailed error information

## 🔄 Keeping Your Site Updated

To update your deployed site after making changes:

1. Commit and push your changes to GitHub
2. Netlify will automatically deploy (if connected to Git)
3. Or manually redeploy using:
   ```bash
   npm run netlify:deploy:prod
   ```

---

✅ **Your Run Development app should now work correctly on Netlify with invisible Firebase authentication and optimized performance!**