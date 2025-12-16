# Stripe Payment Production Issues - Fix Guide

## Why Stripe Cards Work on Local Dev but NOT on Production

### Common Issues & Solutions

---

## **Issue 1: Using Test Keys in Production** ⚠️
**Problem:** You're using Stripe TEST keys in production environment

**Current .env.local (Test Keys):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SDUlf3pA9r0xU4J...
STRIPE_SECRET_KEY=sk_test_51SDUlf3pA9r0xU4J...
```

**Fix:**
1. Login to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to **Developers → API keys**
3. Toggle from **"Test mode"** to **"Live mode"**
4. Copy your **LIVE** keys:
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

**Production Environment Variables:**
```env
# Production .env (or deployment platform environment variables)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
```

---

## **Issue 2: Missing/Wrong NEXTAUTH_URL in Production** 🌐
**Problem:** `NEXTAUTH_URL` is set to localhost instead of production domain

**Current:**
```env
NEXTAUTH_URL=http://localhost:3000
```

**Fix:**
```env
# Production
NEXTAUTH_URL=https://yourdomain.com
# or
NEXTAUTH_URL=https://your-app.vercel.app
```

---

## **Issue 3: Stripe Webhook Configuration** 📡
**Problem:** Webhooks not configured for production domain

**Fix Steps:**
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Set Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `charge.failed`
   - `account.updated` (for Connect)
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to production environment:
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

---

## **Issue 4: CORS and Domain Restrictions** 🚫
**Problem:** Stripe API rejecting requests from production domain

**Fix:**
Check `next.config.js` for proper headers:
```js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ]
}
```

---

## **Issue 5: Stripe Account Activation Required** ✅
**Problem:** Your Stripe account needs to be activated for live mode

**Fix:**
1. Login to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Complete business verification:
   - Business information
   - Bank account details
   - Identity verification
3. Wait for approval (usually 1-2 business days)

---

## **Issue 6: Environment Variables Not Set on Deployment Platform** ⚙️

### For **Vercel**:
1. Go to your project → **Settings → Environment Variables**
2. Add all required variables:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
STRIPE_SECRET_KEY = sk_live_...
NEXTAUTH_URL = https://your-app.vercel.app
NEXTAUTH_SECRET = (your secret)
MONGODB_URI = (your MongoDB connection)
STRIPE_WEBHOOK_SECRET = whsec_...
PLATFORM_FEE_PERCENTAGE = 1.5
```
3. **Important:** Redeploy after adding env vars

### For **Netlify**:
1. Site Settings → **Build & Deploy → Environment**
2. Add same variables as above

### For **Railway/Render/Other**:
Check their respective documentation for setting environment variables

---

## **Complete Production Checklist** ✅

- [ ] Replace TEST keys with LIVE keys
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Configure Stripe webhooks for production URL
- [ ] Add webhook secret to environment variables
- [ ] Complete Stripe account activation/verification
- [ ] Set all environment variables on deployment platform
- [ ] Test with real card (use small amount first)
- [ ] Check production logs for errors
- [ ] Verify webhook events are received

---

## **Testing Production Payments Safely** 🧪

Use these test scenarios:
1. **Start small:** Test with $0.50 or $1.00 first
2. **Use your own card:** Test with your own credit card
3. **Verify webhooks:** Check Stripe Dashboard → Webhooks → Events
4. **Check logs:** Monitor your production logs during test
5. **Refund immediately:** Refund test transactions after verification

---

## **Quick Debug Commands** 🔍

Check if keys are loaded:
```bash
# In your production environment
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
echo $STRIPE_SECRET_KEY
```

Verify Stripe connection:
```bash
# Run this in your Next.js API route or check logs
stripe.customers.list({ limit: 1 })
```

---

## **Common Error Messages & Fixes**

### Error: "No such customer"
- **Fix:** Ensure you're using live mode keys on both client and server

### Error: "Invalid API key"
- **Fix:** Check if `STRIPE_SECRET_KEY` starts with `sk_live_` not `sk_test_`

### Error: "Webhook signature verification failed"
- **Fix:** Ensure `STRIPE_WEBHOOK_SECRET` is set correctly

### Error: "CORS policy blocked"
- **Fix:** Add proper CORS headers in `next.config.js`

---

## **Support Resources** 📚

- [Stripe Production Checklist](https://stripe.com/docs/development/production)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Connect Activation](https://stripe.com/docs/connect/onboarding)

---

## **Emergency Rollback** 🔄

If production payments fail, quickly switch back:
1. Revert to TEST keys temporarily
2. Add banner: "Payment system under maintenance"
3. Debug and fix issues
4. Test again before switching to live

---

**Remember:** Always test in Stripe TEST mode thoroughly before going live! 🎯
