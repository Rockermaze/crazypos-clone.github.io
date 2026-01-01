# Gmail OAuth Setup for Email Settings

## ✅ Yes, You Need to Add URIs in Google Console

For the Gmail OAuth in your Email Settings to work, you need to configure Google Cloud Console.

## 🔧 Step-by-Step Setup

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Select or Create Your Project
- You should already have a project for YourPOS authentication
- Select the same project you used for "Continue with Google" login

### 3. Enable Gmail API
1. Go to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on it and press "Enable"

### 4. Update OAuth Consent Screen (if needed)
1. Go to "APIs & Services" > "OAuth consent screen"
2. Add Gmail scope if not already present:
   - Click "Edit App"
   - Go to "Scopes" section
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `.../auth/gmail.send` (Send email on your behalf)
     - `.../auth/gmail.compose` (Manage drafts and send emails)
   - Save

### 5. Update OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Find your existing OAuth 2.0 Client ID (the one you created for login)
3. Click the edit icon (pencil)
4. **Authorized redirect URIs** should already have:
   - ✅ `http://localhost:3000/api/auth/callback/google` (existing for login)
   
5. **Add this NEW redirect URI for Gmail:**
   - `http://localhost:3000/api/auth/gmail/callback`
   
6. For production, also add:
   - `https://your-domain.com/api/auth/gmail/callback`

### 6. Your Redirect URIs Should Look Like This:
```
Authorized redirect URIs:
✅ http://localhost:3000/api/auth/callback/google         (for NextAuth login)
✅ http://localhost:3000/api/auth/gmail/callback          (for Gmail OAuth)
✅ https://your-domain.com/api/auth/callback/google       (production login)
✅ https://your-domain.com/api/auth/gmail/callback        (production Gmail)
```

## 📋 Summary

**You need TWO redirect URIs:**
1. `/api/auth/callback/google` - For user login (already exists)
2. `/api/auth/gmail/callback` - For Gmail email sending (add this one)

Both use the same OAuth Client ID and Secret from your `.env.local` file.

## 🔐 Security Note

The Gmail OAuth uses the same credentials as your login OAuth:
- `GOOGLE_CLIENT_ID` (already in your .env.local)
- `GOOGLE_CLIENT_SECRET` (already in your .env.local)

No additional environment variables needed!

## 🧪 Testing

After setup:
1. Restart your development server
2. Go to Email Settings in the setup
3. Click "Connect Gmail Account"
4. Authorize Gmail access
5. Your email settings will be saved with OAuth tokens

## ⚠️ Important Notes

- **App Password vs OAuth**: Don't use both! Choose one:
  - Use OAuth (recommended) - More secure, no app password needed
  - OR use App Password with SMTP - Simpler but less secure

- **Scopes Required**: 
  - `gmail.send` - Send emails
  - `gmail.compose` - Create and send emails

- **Token Storage**: OAuth tokens are stored in your UserSettings collection, encrypted and secure.

## 🚀 Current Configuration

Your `.env.local` already has the OAuth credentials configured.

Just add the Gmail callback URI to Google Console and you're done!
