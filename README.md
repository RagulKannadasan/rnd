{
  // ... existing package.json content ...
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "analyze": "npm run build && webpack-bundle-analyzer build/bundle-stats.json" // Add this line
  },
  // ... existing package.json content ...
  "devDependencies": {
    // ... existing devDependencies ...
    "webpack-bundle-analyzer": "^4.5.0" // Add this line if you don't have it
  }
}
# 🏃‍♂️ Run Development - Firebase Fitness App

A modern React fitness/running community app powered by **Firebase Firestore** for real-time data synchronization and seamless user experience.

## 🔥 **Firebase-Only Architecture**

This app uses a **pure Firebase architecture** with no backend server required:

- **Frontend**: React 18.3.1 with Firebase SDK
- **Database**: Firebase Firestore (NoSQL, real-time)
- **Authentication**: Firebase Authentication
- **Hosting**: Firebase Hosting (recommended)
- **Storage**: Firebase Storage (for future features)

## ✨ **Features**

### 🏠 **Public Features**
- Hero section with fitness programs showcase
- Program & plan information
- User testimonials
- Secure contact form (powered by a Netlify Function)

### 🔐 **Authenticated User Features**
- **User Dashboard**: Personalized fitness metrics
- **Profile Management**: Complete user profile with running preferences
- **Achievement System**: Track fitness milestones and badges
- **Event Management**: Community run events and RSVPs
- **Real-time Statistics**: Running stats with live updates
- **Firebase Test Console**: Debug and monitor Firebase connectivity

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project (free tier available)

### 1. Clone & Install
```bash
git clone https://github.com/TechVaseegrahHub/Run-Development.git
cd Run-Development
npm install
```

### 2. Firebase Setup
1. Create Firebase project at https://console.firebase.google.com/
2. Enable **Authentication** (Phone & Email providers)
3. Enable **Firestore Database** (start in test mode)
4. Copy your Firebase config to `src/firebase.js`

### 3. Configure Firestore Rules
Copy rules from `firestore.rules` to your Firebase Console → Firestore → Rules

### 4. Start Development
```bash
npm start
```

Your app will be available at `http://localhost:3000`

## 📱 **App Navigation**

### Public Routes
- `/` - Homepage with hero section
- `/events` - Public events listing
- `/SignIn` - Authentication page

### Protected Routes (Requires SignIn)
- `/dashboard` - User dashboard with stats
- `/profile` - Complete user profile management
- `/user-events` - Personal event management
- `/firebase-test` - Firebase connectivity testing

## 🔐 **Security Features**

- **Firebase Auth**: Phone number & email verification
- **Firestore Rules**: User-specific data access control
- **Protected Routes**: Authentication-required pages
- **Real-time Validation**: Client-side form validation
- **Secure Configuration**: Environment-based config management

## 🛠️ **Development Scripts**

```bash
# Start development server
npm start

# Build for production  
npm run build

# Run tests
npm test

# Run Cypress E2E tests
npx cypress open

# Netlify deployment commands
npm run netlify:SignIn    # SignIn to Netlify
npm run netlify:deploy   # Deploy to Netlify (staging)
npm run netlify:deploy:prod  # Deploy to Netlify (production)
```

## 📦 **Key Dependencies**

### Core React
- `react` ^18.3.1 - Main React library
- `react-router-dom` ^6.25.1 - Client-side routing
- `react-icons` ^5.5.0 - Icon components

### Firebase
- `firebase` ^11.10.0 - Firebase SDK for web

### UI & Animation
- `framer-motion` ^10.0.1 - Animation library
- `react-scroll` ^1.8.7 - Smooth scrolling

### Deployment
- `netlify` ^13.1.2 - Netlify CLI for deployment

## 🌐 **Deployment Options**

### Option 1: Firebase Hosting (Recommended)
```bash
npm run build
firebase deploy
```

### Option 2: Netlify
```bash
# Using Netlify CLI (recommended)
npm run netlify:deploy:prod

# Or manually:
npm run build
# Deploy build/ folder to Netlify
```

Netlify features included:
- Serverless functions for contact form handling
- Edge functions for performance optimization
- Automatic SSL certificates
- Continuous deployment from Git
- Form handling and spam protection
- Image optimization
- Split testing capabilities

### Option 3: Vercel
```bash
npm run build  
# Connect GitHub repo to Vercel
```

## 📊 **Firebase Advantages**

| Feature | Firebase | Traditional Backend |
|---------|----------|-------------------|
| Setup Time | ⚡ Minutes | 🐌 Hours/Days |
| Scaling | 🔄 Automatic | 🔧 Manual |
| Real-time | ✅ Built-in | ❌ Custom coding |
| Offline Support | ✅ Automatic | ❌ Complex setup |
| Maintenance | 🆓 Zero | 💰 Ongoing costs |
| Security | 🔒 Built-in rules | 🛠️ Custom implementation |

## 🚨 **Troubleshooting**

### Common Issues

**Firebase Connection Failed**
```bash
# Check your firebase.js configuration
# Ensure Firestore is enabled in Firebase Console
# Verify API keys are correct
```

**Authentication Not Working**
```bash
# Enable Phone/Email providers in Firebase Console
# Check Firebase Auth settings
# Verify domain is authorized
```

**Build Errors**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 🔐 Firebase Authentication on Netlify

If you're experiencing authentication issues specifically on Netlify (but working on localhost), please refer to our detailed troubleshooting guide:

📄 [Firebase Authentication Troubleshooting Guide](FIREBASE_AUTH_TROUBLESHOOTING.md)

This guide covers:
- Fixing "auth/internal-error" when sending OTP
- Resolving reCAPTCHA configuration issues
- Updating Content Security Policy for Firebase
- Adding your Netlify domain to authorized domains
- Setting up environment variables correctly

## 📞 **Support**

- **Documentation**: See `FIREBASE_SETUP.md` for detailed setup
- **Firebase Console**: https://console.firebase.google.com/
- **Issues**: Create GitHub issues for bug reports
- **Firebase Support**: https://firebase.google.com/support

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see LICENSE file for details.

---

**Built with ❤️ using React + Firebase**

🔗 **Live Demo**: [Coming Soon]  
🐙 **Repository**: https://github.com/TechVaseegrahHub/Run-Development

<!-- Trigger Netlify Build -->