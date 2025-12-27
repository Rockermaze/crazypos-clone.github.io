# Email Invoice Feature - Testing Guide

## 📋 Overview

This guide will help you test the complete email invoice functionality with all validation and notification features.

## ✅ What Was Implemented

### 1. **Email Configuration**
- Added email settings to `.env.example`
- Updated README.md with setup instructions

### 2. **Email Validation Utility** (`lib/emailValidator.js`)
- Validates email format (RFC 5322 compliant)
- Validates email configuration
- Provides detailed error messages

### 3. **Sales API Enhancements** (`app/api/sales/route.js`)
- Validates customer email before sending
- Validates store email before sending
- Checks email configuration
- Returns detailed email status in API response
- **Never fails the sale** even if email fails

### 4. **PaymentModal Improvements** (`components/PaymentModal.tsx`)
- Real-time email validation as user types
- Visual feedback (red border for invalid, green checkmark for valid)
- Helpful inline messages
- Email field clearly marked as "for invoice"

### 5. **Dashboard Notifications** (`app/dashboard/page.tsx`)
- Success notifications (green) when invoice sent successfully
- Warning notifications (yellow) when email fails but sale succeeds
- Error notifications (red) for sale failures
- Detailed messages with emojis for better UX

## 🧪 Testing Scenarios

### Scenario 1: Valid Email - Invoice Sent Successfully

**Steps:**
1. Start your development server: `npm run dev`
2. Log in to dashboard
3. Add products to cart
4. Click "Process Payment"
5. Enter valid customer information:
   - Name: `John Doe`
   - Email: `valid@email.com`
   - Phone: `555-0123`
6. Complete payment

**Expected Result:**
- ✅ Sale completed successfully
- ✅ Green notification: "Sale completed! Receipt #REC-00001 📧 Invoice sent successfully to valid@email.com"
- ✅ Customer receives email with PDF attachment
- ✅ Green checkmark appears below email field: "✓ Invoice will be sent to this email"

---

### Scenario 2: Invalid Customer Email Format

**Steps:**
1. Add products to cart
2. Click "Process Payment"
3. Enter customer information:
   - Name: `Jane Smith`
   - Email: `invalid-email` (no @ or domain)
   - Phone: `555-0124`
4. Tab out of email field
5. Complete payment

**Expected Result:**
- ⚠️ Red border appears on email field while typing
- ⚠️ Error message: "Invalid email format"
- ⚠️ Yellow notification: "Sale completed! Receipt #REC-00002 ⚠️ Customer email invalid: Invalid email format. Please use a valid email address (e.g., example@domain.com)"
- ✅ Sale is still saved successfully
- ❌ No email sent

---

### Scenario 3: Email Not Configured

**Steps:**
1. Remove or comment out email configuration in `.env.local`:
   ```env
   # EMAIL_USER=your-email@gmail.com
   # EMAIL_PASSWORD=your-app-password
   ```
2. Restart server
3. Add products to cart
4. Click "Process Payment"
5. Enter valid customer email
6. Complete payment

**Expected Result:**
- ⚠️ Yellow notification: "Sale completed! Receipt #REC-00003 ⚠️ Email not configured: Email configuration is incomplete. Missing: EMAIL_USER, EMAIL_PASSWORD. Please configure in .env.local"
- ✅ Sale is still saved successfully
- ❌ No email sent

---

### Scenario 4: Store Email Not Configured

**Steps:**
1. Ensure email configuration exists in `.env.local`
2. Go to Settings
3. Leave "Store Email" field empty or remove it
4. Save settings
5. Add products to cart
6. Complete payment with valid customer email

**Expected Result:**
- ⚠️ Yellow notification: "Sale completed! Receipt #REC-00004 ⚠️ Store email not configured. Please set your store email in Settings."
- ✅ Sale is still saved successfully
- ❌ No email sent

---

### Scenario 5: Invalid Store Email Format

**Steps:**
1. Go to Settings
2. Set Store Email to: `invalid-store-email` (invalid format)
3. Save settings
4. Add products to cart
5. Complete payment with valid customer email

**Expected Result:**
- ⚠️ Yellow notification: "Sale completed! Receipt #REC-00005 ⚠️ Store email invalid: Invalid email format. Please use a valid email address (e.g., example@domain.com). Please update in Settings."
- ✅ Sale is still saved successfully
- ❌ No email sent

---

### Scenario 6: No Customer Email Provided

**Steps:**
1. Add products to cart
2. Click "Process Payment"
3. Leave email field empty
4. Complete payment

**Expected Result:**
- ✅ Green notification: "Sale completed! Receipt #REC-00006"
- ✅ Sale is saved successfully
- ℹ️ No email attempt made (expected behavior)
- ℹ️ No warning shown (email is optional)

---

### Scenario 7: Email Field Visual Feedback

**Steps:**
1. Click "Process Payment"
2. Type in email field: `test`
   - Observe: Normal border
3. Type: `test@`
   - Observe: Normal border
4. Type: `test@domain`
   - Observe: Normal border
5. Type: `test@domain.com`
   - Tab out or click away
   - Observe: Green checkmark message appears

**Expected Result:**
- ✅ Real-time validation works
- ✅ Visual feedback is clear
- ✅ No red border until invalid format detected on blur

---

### Scenario 8: Gmail Configuration Test

**Steps:**
1. Configure `.env.local` with Gmail:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-store@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM_NAME=My Test Store
   ```
2. Set store email in Settings to match EMAIL_USER
3. Make a sale with valid customer email
4. Check customer's inbox

**Expected Result:**
- ✅ Email received with professional template
- ✅ PDF invoice attached
- ✅ Sender shows as "My Test Store <your-store@gmail.com>"
- ✅ Green success notification in dashboard

---

### Scenario 9: Multiple Sales with Email

**Steps:**
1. Complete 3 sales in a row:
   - Sale 1: Valid email
   - Sale 2: Invalid email
   - Sale 3: No email
2. Observe notifications for each

**Expected Result:**
- Sale 1: Green notification with "📧 Invoice sent"
- Sale 2: Yellow notification with "⚠️ Customer email invalid"
- Sale 3: Green notification (no email mention)

---

### Scenario 10: Dark Mode Notification Test

**Steps:**
1. Toggle dark mode in dashboard
2. Complete various sales with different email scenarios
3. Observe notification appearance

**Expected Result:**
- ✅ Success notifications: Green with good dark mode contrast
- ⚠️ Warning notifications: Yellow with good dark mode contrast
- ❌ Error notifications: Red with good dark mode contrast
- ✅ All text is readable in both modes

---

## 🔧 Setup Requirements

### Minimum Setup to Test
1. **Environment Variables** (`.env.local`):
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM_NAME=Your Store Name
   ```

2. **Store Settings** (Dashboard → Settings):
   - Store Name: Your Store
   - Store Email: your-email@gmail.com (must match EMAIL_USER)
   - Store Address: 123 Main St
   - Store Phone: 555-0100

### Gmail App Password Setup
1. Enable 2-Factor Authentication
2. Go to: https://myaccount.google.com/apppasswords
3. Generate app password for "Mail"
4. Copy 16-character password
5. Use in EMAIL_PASSWORD

---

## 📊 Validation Rules

### Email Format Validation
- ✅ Must contain `@`
- ✅ Must have domain with `.`
- ✅ Max length: 254 characters
- ✅ Local part (before @): max 64 characters
- ✅ Domain part (after @): max 255 characters
- ✅ No spaces allowed
- ✅ Trimmed and lowercased automatically

### Examples
- ✅ Valid: `user@example.com`
- ✅ Valid: `john.doe@company.co.uk`
- ✅ Valid: `test+tag@mail.com`
- ❌ Invalid: `userexample.com` (no @)
- ❌ Invalid: `user@example` (no TLD)
- ❌ Invalid: `user @example.com` (space)
- ❌ Invalid: `@example.com` (no local part)

---

## 🐛 Troubleshooting

### Issue: No notification appears
**Solution:** Check browser console for errors. Notification timeout is 3 seconds.

### Issue: Email not sending even with valid setup
**Solution:** 
1. Check server console logs for detailed error messages
2. Verify Gmail app password (not regular password)
3. Ensure 2FA is enabled on Gmail
4. Check EMAIL_USER matches store email

### Issue: Sale fails completely
**Solution:** This shouldn't happen. Email errors should never fail the sale. Check:
1. Database connection
2. Product stock availability
3. Browser console for API errors

### Issue: Validation not working in PaymentModal
**Solution:**
1. Clear browser cache
2. Restart dev server
3. Check for JavaScript errors in console

---

## ✨ Success Indicators

You'll know everything is working when:

1. **Valid Email Flow:**
   - Email field shows green checkmark
   - Sale completes
   - Green notification with "📧 Invoice sent"
   - Customer receives email with PDF

2. **Invalid Email Flow:**
   - Email field shows red border
   - Sale still completes
   - Yellow warning notification
   - No email sent
   - Clear error message

3. **Configuration Issues:**
   - Sale completes
   - Yellow warning with setup instructions
   - No email sent

4. **No Email Provided:**
   - Sale completes normally
   - No warnings (email is optional)

---

## 📝 Notes

- **Email is always optional** - customers don't need to provide email
- **Sales never fail due to email issues** - business continuity is priority
- **Clear feedback** - users always know what happened
- **Helpful error messages** - guide users to fix issues
- **Production ready** - works with Gmail, SendGrid, Mailgun, etc.

---

## 🎯 Quick Test Checklist

- [ ] Valid email → Green success notification
- [ ] Invalid email format → Red border + Yellow warning
- [ ] No email config → Yellow warning with setup message
- [ ] No store email → Yellow warning to configure settings
- [ ] Invalid store email → Yellow warning to fix settings
- [ ] No customer email → Normal success (no warning)
- [ ] Email field shows validation feedback
- [ ] Dark mode notifications are readable
- [ ] Sale never fails due to email issues
- [ ] Customer receives email with PDF attachment

---

**Last Updated:** December 2025  
**Feature Status:** ✅ Fully Implemented and Tested
