# Google OAuth Setup Guide for YourPOS

This guide will help you set up Google OAuth authentication for your YourPOS application.

## ✅ What's Already Done

Your application now has:
- ✅ Google OAuth provider configured in NextAuth
- ✅ UI components for "Continue with Google" buttons on login and signup pages
- ✅ User model updated to support OAuth users (no password required)
- ✅ Automatic user creation/linking when signing in with Google
- ✅ Session management with user profile data from Google

## 🔧 Setup Steps

### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click on the project dropdown at the top
   - Create a new project or select an existing one
   - Name it something like "YourPOS"

3. **Enable Google+ API** (Required for OAuth)
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click on it and press "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select "External" user type (unless you have a Google Workspace)
   - Click "Create"
   - Fill in required fields:
     - **App name**: YourPOS
     - **User support email**: Your email
     - **Developer contact email**: Your email
   - Click "Save and Continue"
   - On Scopes page, click "Save and Continue" (default scopes are sufficient)
   - On Test users page (if external), add your email for testing
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "+ CREATE CREDENTIALS" > "OAuth client ID"
   - Select "Web application"
   - Configure:
     - **Name**: YourPOS Web Client
     - **Authorized JavaScript origins**:
       - `http://localhost:3000` (for development)
       - `https://your-production-domain.com` (add when deploying)
     - **Authorized redirect URIs**:
       - `http://localhost:3000/api/auth/callback/google` (for development)
       - `https://your-production-domain.com/api/auth/callback/google` (for production)
   - Click "Create"
   - **IMPORTANT**: Copy the Client ID and Client Secret

### Step 2: Update Environment Variables

1. Open your `.env.local` file
2. Update the Google OAuth credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-client-id-from-step-1
GOOGLE_CLIENT_SECRET=your-actual-client-secret-from-step-1
```

3. Make sure your `NEXTAUTH_URL` is set correctly:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

### Step 3: Test the Integration

1. **Restart your development server**
   ```bash
   npm run dev
   ```

2. **Test Login Flow**
   - Go to http://localhost:3000/auth/login
   - Click "Continue with Google"
   - Sign in with your Google account
   - You should be redirected to the dashboard

3. **Test Signup Flow**
   - Go to http://localhost:3000/auth/start
   - Click "Continue with Google"
   - Sign in with a new Google account
   - A new user will be created automatically

## 🎯 How It Works

### For New Users (Sign Up with Google)
1. User clicks "Continue with Google"
2. Google authentication happens
3. System checks if user exists in MongoDB:
   - If **new user**: Creates user with:
     - Email from Google
     - Name from Google profile
     - Google ID for linking
     - Auto-generated business name: `{Name}'s Store`
     - No password required
   - If **existing email**: Links Google account to existing user
4. User is logged in and redirected to dashboard

### For Existing Users (Login with Google)
1. User clicks "Continue with Google"
2. Google authentication happens
3. System finds user by Google ID
4. User is logged in with their existing data

### Account Linking
If a user signed up with email/password and later uses Google OAuth with the same email:
- The Google account is automatically linked to the existing account
- User can now login with either method

## 📝 Important Notes

### Security
- Never commit your `.env.local` file to version control
- Keep your Client Secret safe
- Use different credentials for development and production

### Testing
- During development, Google may show a warning screen
- Add test users in the OAuth consent screen if needed
- For production, you'll need to verify your app with Google

### Database
- Users created via Google OAuth won't have a password field
- They can only login via Google (unless they set a password later)
- The `googleId` field links the user to their Google account

### Session Management
- Sessions last 30 days (configured in `lib/auth.js`)
- User data includes: id, email, name, businessName, and profile image

## 🚀 Production Deployment

When deploying to production (e.g., Vercel):

1. **Update Google Cloud Console**
   - Add your production domain to Authorized JavaScript origins
   - Add your production callback URL to Authorized redirect URIs

2. **Set Environment Variables in Vercel**
   - Go to your Vercel project settings
   - Add the same environment variables:
     - `NEXTAUTH_URL` = your production URL
     - `NEXTAUTH_SECRET` = your secret
     - `GOOGLE_CLIENT_ID` = your client ID
     - `GOOGLE_CLIENT_SECRET` = your client secret

3. **Publish OAuth App** (if you want public access)
   - In Google Cloud Console > OAuth consent screen
   - Click "Publish App"
   - Complete verification process (if required)

## 🐛 Troubleshooting

### "Google sign-in failed"
- Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set correctly
- Verify redirect URIs match exactly in Google Cloud Console
- Make sure Google+ API is enabled

### "Redirect URI mismatch"
- The callback URL must be: `{NEXTAUTH_URL}/api/auth/callback/google`
- Check that it's added in Google Cloud Console
- Verify NEXTAUTH_URL in .env.local matches your actual URL

### User not redirected to dashboard
- Check browser console for errors
- Verify MongoDB connection is working
- Check server logs for authentication errors

### Can't find credentials in Google Cloud
- Make sure you're in the correct project
- Go to "APIs & Services" > "Credentials"
- Look for your OAuth 2.0 Client ID

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Setup](https://support.google.com/cloud/answer/6158849)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## ✨ Features

Your Google OAuth integration includes:
- ✅ One-click login/signup
- ✅ Automatic user creation
- ✅ Account linking for existing users
- ✅ Profile picture support
- ✅ Secure session management
- ✅ No password required for OAuth users
- ✅ Works alongside traditional email/password authentication
