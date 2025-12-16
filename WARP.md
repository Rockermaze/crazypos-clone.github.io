# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Stack: Next.js (App Router) with React 18, TypeScript on the client, JavaScript in API routes.
- Backend: Next.js Route Handlers under app/api, connecting to MongoDB via Mongoose.
- Auth: NextAuth (credentials + optional Google OAuth) configured in lib/auth.js and wired via app/api/auth/[...nextauth]/route.js.
- Payments: Stripe and Stripe Connect helpers in lib/stripe.js, with endpoints under app/api/stripe; webhook handler at app/api/stripe/webhook/route.js.
- Data model: Mongoose models in models/ (Sale, Product, RepairCategory, RepairTicket, Transaction, User, etc.).
- UI: App layout in app/layout.tsx, pages/components in app/ and components/.
- Path alias: @ resolves to the repo root (see next.config.js and tsconfig.json).

Common commands
- Requirements
  - Node >= 18 (see package.json engines).
  - Env config in .env.local (see .env.example keys below).

- Dev server
  ```bash path=null start=null
  npm run dev
  ```
  - Windows fallback (increases memory for SWC):
    ```bash path=null start=null
    npm run dev:win
    ```

- Build and run
  ```bash path=null start=null
  npm run build
  npm start
  ```
  - Clean build artifacts and rebuild:
    ```bash path=null start=null
    npm run build:clean
    ```

- Lint
  ```bash path=null start=null
  npm run lint
  ```

- Cache cleanup (useful if Next/SWC gets stuck)
  ```bash path=null start=null
  npm run clean
  # If SWC binary issues on Windows persist
  npm run reinstall-swc
  ```

- Database utilities (MongoDB)
  ```bash path=null start=null
  # Seed demo data (uses scripts/seed-mongodb.js)
  npm run seed

  # Seed only repair categories
  npm run seed:repair-categories

  # Verify connection and list users (masks password)
  npm run verify-db

  # Drop all collections in the configured database
  npm run cleanup-db
  ```

- Tests
  - No test runner is configured in package.json. If tests are added later (e.g., Jest/Vitest/Playwright), add the scripts and update this section with single-test invocation examples.

Environment configuration
- Copy .env.example to .env.local and fill in values as appropriate for your environment.
  ```bash path=null start=null
  # PowerShell
  Copy-Item .env.example .env.local
  ```
- Important keys (see .env.example for full list and guidance):
  - NEXTAUTH_URL, NEXTAUTH_SECRET
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (optional)
  - MONGODB_URI
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET (required when using webhooks)
  - PLATFORM_FEE_PERCENTAGE (optional)

Architecture and data flow
- App Router and API
  - API route handlers live under app/api/.../route.js. Responses use NextResponse from next/server.
  - Example: app/api/sales/route.js
    - Authenticates via getServerSession(authOptions).
    - Connects to MongoDB using lib/mongodb.js (cached connection across hot reloads).
    - Validates and updates Product stock, creates a Sale, and ensures a corresponding Transaction record exists.

- Database layer (MongoDB/Mongoose)
  - Connection
    - lib/mongodb.js provides connectDB with a hot-reload-safe global cache. API routes import and await connectDB before DB ops.
  - Models
    - models/Sale.js defines sale item/customer schemas, payment fields (method/status/gateway), indexing for common queries, and helpers like toAPIResponse.
    - Additional models include Product, RepairCategory, RepairTicket, Transaction, User, StoreSettings, Counter.
  - Seeding/maintenance scripts
    - scripts/seed-mongodb.js: creates a demo user, demo products, store settings, and counters; prints demo account details on completion.
    - scripts/verify-db.js: masks credentials in logs and prints collection/user summaries.
    - scripts/cleanup-db.js: drops all collections in the configured database.

- Authentication (NextAuth)
  - lib/auth.js constructs providers dynamically:
    - CredentialsProvider using lib/userStorage.js which queries MongoDB and validates passwords against the User model (comparePassword schema method).
    - Optional GoogleProvider if GOOGLE_CLIENT_ID/SECRET are set.
  - Session is JWT-based; callbacks enrich the session with user id and businessName. Routes are exposed at app/api/auth/[...nextauth]/route.js.

- Payments (Stripe and Stripe Connect)
  - lib/stripe.js initializes Stripe with STRIPE_SECRET_KEY and exports helpers:
    - createPaymentIntent supports platform fees and transfers for Connect.
    - calculatePlatformFee and utility accessors for account details.
  - Endpoints
    - app/api/stripe/payment-intent/route.js: creates a PaymentIntent on a connected account, persists a Transaction with status=PENDING, and returns client_secret plus metadata.
    - app/api/stripe/pos-payment/route.js: creates a platform (non-Connect) PaymentIntent for POS flows and returns client_secret.
    - app/api/stripe/webhook/route.js: verifies signatures (STRIPE_WEBHOOK_SECRET), updates Transaction status/metadata for events like payment_intent.succeeded/failed/canceled and account.updated, and runs with runtime='nodejs'.
  - Frontend integration
    - components/PaymentModal.tsx uses @stripe/react-stripe-js to confirm card payments via client_secret from /api/stripe/pos-payment, then completes a sale by posting to /api/sales with stripeData.

- Frontend structure
  - app/layout.tsx sets up Providers and AppChrome, with light/dark theme bootstrapping.
  - app/page.tsx and app/** contain page/UI composition. UI components live under components/ with subdirs for onboarding/ui, etc.

- Path and config
  - next.config.js sets reactStrictMode, ignores type/lint errors during build, and aliases @ to the repo root.
  - tsconfig.json mirrors the @/* path mapping, allows JS in the codebase, and preserves JSX for Next.

Deploy
- From README.md: Push to GitHub, then import the project on Vercel. Ensure env vars on Vercel match .env.example requirements (use Vercel project settings for secrets).
