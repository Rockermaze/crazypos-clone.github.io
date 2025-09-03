# Testing Guide for YourPOS System

## Authentication Testing

### Method 1: Use Demo Account
The easiest way to test the system is using the pre-configured demo account:

**Demo Credentials:**
- Email: `demo@yourpos.com`
- Password: `demo123`

### Method 2: Create New Account
You can register a new account using the "Start Free Trial" option:

1. Go to `/auth/start` (or click "Start free trial" on the login page)
2. Fill in the registration form with your details
3. Click "Start Free Trial"
4. You'll automatically be logged in and redirected to the dashboard

### Method 3: Google OAuth (Requires Setup)
Google OAuth is configured but requires valid credentials:
1. Set up Google OAuth credentials in Google Cloud Console
2. Update `.env.local` with your client ID and secret
3. Use the "Continue with Google" button

## How the System Works

### For New User Registration:
1. User fills registration form at `/auth/start`
2. Form data is sent to `/api/auth/register` 
3. New user is created in the mock database
4. System automatically signs in the user
5. User is redirected to `/dashboard`

### For Existing User Login:
1. User enters credentials at `/auth/login`
2. NextAuth validates credentials against the user database
3. If valid, user is signed in and redirected to `/dashboard`

## Dashboard Features Available for Testing

Once logged in, you can test these features:

### 1. Product Management
- **Inventory Tab**: Add, edit, and delete products
- **Sales Tab**: Browse products with search and filtering
- Products persist in browser localStorage

### 2. Point of Sale
- **Sales Tab**: Add products to cart, adjust quantities
- **Payment Processing**: Complete sales with payment modal
- **Payment Methods**: Cash, Card, Digital payments

### 3. Repair Management
- **Repairs Tab**: Create and track device repair tickets
- **Ticket Management**: View repair status, priority, costs
- **Customer Information**: Track customer and device details

### 4. Sales History
- **History Tab**: View completed sales and receipts
- **Sales Tracking**: Monitor transaction history
- **Customer Records**: See customer purchase history

### 5. Reports
- **Basic Analytics**: View sales summaries and statistics
- **Inventory Tracking**: Monitor stock levels and low inventory alerts

## Data Persistence

- **User accounts**: Stored in memory (resets on server restart)
- **Products, Sales, Repairs**: Stored in browser localStorage
- **Sessions**: JWT-based, persist until logout

## Troubleshooting

### Can't Log In After Registration
- Check browser console for errors
- Try refreshing the page and logging in manually
- Ensure all form fields were filled correctly

### Dashboard Not Loading  
- Verify you're authenticated (check if redirected to login)
- Clear browser cache and localStorage
- Check browser console for JavaScript errors

### Features Not Working
- Ensure you're using a modern browser with JavaScript enabled
- Check if localStorage is enabled and not full
- Open browser dev tools to see network requests and errors

## System Architecture

### Authentication Flow
```
Registration -> /api/auth/register -> NextAuth sign-in -> Dashboard
Login -> NextAuth credentials -> Dashboard
```

### Data Management
```
Client State -> DataManager -> localStorage
```

### Protected Routes
- `/dashboard` - requires authentication
- All other routes are public

## Development Notes

This is a demo/development setup with:
- In-memory user storage (resets on restart)
- Mock payment processing
- localStorage for data persistence
- Simplified authentication without password hashing

For production use, you would need:
- Real database for user and data persistence
- Proper password hashing and security
- Real payment processing integration
- Production-grade session management
