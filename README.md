# YourPOS

Modern POS web application built with Next.js App Router. Includes authentication, product and sales management, repairs, payments via Stripe, reporting, and a dashboard UI.

## Tech Stack
- `Next.js 15` (App Router, server actions, API routes)
- `React 18` and `TypeScript` for UI and types
- `Tailwind CSS` for styling
- `NextAuth` for authentication
- `MongoDB + Mongoose` for data persistence
- `Stripe` for payments and webhooks

## Quick Start
- `npm install`
- `npm run dev` then open `http://localhost:3000`
- Create `.env.local` based on `.env.example` and set required secrets

## Scripts
- `npm run dev` start the dev server
- `npm run build` create a production build
- `npm start` run the production server
- `npm run lint` run ESLint
- `npm run seed` seed demo data into MongoDB
- `npm run cleanup-db` cleanup MongoDB collections/indexes

## Environment Variables
Copy `.env.example` to `.env.local` and set:
- `NEXTAUTH_URL` app base URL (dev/prod)
- `NEXTAUTH_SECRET` auth secret
- `MONGODB_URI` MongoDB connection string
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` Stripe publishable key
- `STRIPE_SECRET_KEY` Stripe secret key
- `STRIPE_WEBHOOK_SECRET` Stripe webhook signing secret
- `EMAIL_HOST` SMTP host (e.g., smtp.gmail.com)
- `EMAIL_PORT` SMTP port (e.g., 587)
- `EMAIL_SECURE` true for 465, false for other ports
- `EMAIL_USER` your email address
- `EMAIL_PASSWORD` your email password or app password
- `EMAIL_FROM_NAME` sender name (optional)
- Optional: `NEXT_PUBLIC_APP_NAME`, `PLATFORM_FEE_PERCENTAGE`, Google OAuth keys

## Directory Structure
- `app/` Next.js App Router pages and API routes
  - `layout.tsx`, `page.tsx`, `globals.css` app shell and global styles
  - `auth/` login/start/error pages
  - `dashboard/` main dashboard and feature sections
    - `components/` modular sections: Sales, Inventory, Repairs, Reports, Settings
    - `payments/` Stripe onboarding UI and success screen
  - `pay/[shopkeeperId]/` customer payment page
  - `api/` server routes (REST-like endpoints)
    - `auth/` NextAuth routes and registration
    - `products/`, `sales/`, `repairs/`, `repair-categories/`, `settings/`
    - `transactions/` CRUD and statistics
    - `payment/qr-code/` generate QR codes for payment links
    - `stripe/` Connect account, onboarding, payment intents, POS payments, webhook
- `components/` shared UI: buttons, cards, modals, navbar, footer, providers
- `content/` static data for features, pricing, KB
- `lib/` utilities: `auth`, `mongodb` connection, `stripe` helpers, `apiDataManager`, `pdfReportService`, `userStorage`
- `models/` Mongoose models: `User`, `Product`, `Sale`, `RepairTicket`, `RepairCategory`, `Transaction`, `StoreSettings`, `Counter`
- `types/` shared types (TS and JSDoc)
- `scripts/` seeding and maintenance scripts for MongoDB
- `public/` static assets and logos
- `summary/` project documentation and guides
- `next.config.js` Next.js configuration (`output: 'standalone'`, alias `@`)
- `tailwind.config.js`, `postcss.config.mjs` Tailwind configuration
- `eslint.config.mjs` ESLint config
- `vercel.json` Vercel deployment configuration

## Data Models (high level)
- `User` auth, business details, Stripe account status
- `Product` catalog items and stock
- `Sale` sale records and items
- `RepairTicket` repair intake and statuses
- `RepairCategory` repair categories
- `Transaction` payment transactions and summaries
- `StoreSettings` store-level configuration

## Key API Routes
- `POST /api/auth/register` register user
- `GET/POST /api/products` and `/api/products/[id]`
- `GET/POST /api/sales` and `/api/sales/with-profit`
- `GET/POST /api/repairs` and `/api/repair-categories`
- `GET/POST /api/settings`
- `GET/POST /api/transactions` and `/api/transactions/[id]`, `/statistics`
- `POST /api/payment/qr-code` generate QR code
- `POST /api/stripe/connect` create Connect account
- `POST /api/stripe/onboard` create onboarding link
- `POST /api/stripe/payment-intent`, `/pos-payment`
- `POST /api/stripe/webhook` Stripe webhook handler

## Authentication
- `NextAuth` with credentials provider
- Custom `types/next-auth.d.ts` augments session and JWT with `businessName`

## Payments (Stripe)
- Connect onboarding and account status checks
- Payment intents and POS payment endpoints
- Webhook processing for events
- QR-code payment links for customers

## Reporting
- `lib/pdfReportService.js` generate PDF reports
- Dashboard sections for sales history and payments report

## Email Invoice Feature
- Automatic PDF invoice generation for every sale
- Sends invoice via email to customers when email is provided
- **Setup Required:**
  1. Configure email settings in `.env.local` (see Environment Variables)
  2. Set store email in Dashboard → Settings
  3. For Gmail: Enable 2FA and create App Password at https://myaccount.google.com/apppasswords
- **Files:**
  - `lib/email.js` email sending functions
  - `lib/pdf/generateSalesInvoice.js` PDF generation
  - Automatically triggered in `app/api/sales/route.js` after sale completion
- **Validation:** System validates both customer and store emails before sending
- **Notifications:** Shows success/error popup to user after sale completion

## File Structure
d:\CrazyPos\YourPOS
├─ app
│  ├─ about
│  │  └─ page.tsx
│  ├─ api
│  │  ├─ auth
│  │  │  ├─ [...nextauth]
│  │  │  │  └─ route.js
│  │  │  ├─ register
│  │  │  │  └─ route.js
│  │  │  └─ route.js
│  │  ├─ contact
│  │  │  └─ route.js
│  │  ├─ onboarding
│  │  │  └─ route.js
│  │  ├─ payment
│  │  │  └─ qr-code
│  │  │     └─ route.js
│  │  ├─ products
│  │  │  ├─ [id]
│  │  │  │  └─ route.js
│  │  │  └─ route.js
│  │  ├─ repair-categories
│  │  │  ├─ [id]
│  │  │  │  └─ route.js
│  │  │  └─ route.js
│  │  ├─ repairs
│  │  │  ├─ [id]
│  │  │  │  └─ route.js
│  │  │  └─ route.js
│  │  ├─ sales
│  │  │  ├─ with-profit
│  │  │  │  └─ route.js
│  │  │  └─ route.js
│  │  ├─ settings
│  │  │  └─ route.js
│  │  ├─ stripe
│  │  │  ├─ connect
│  │  │  │  └─ route.js
│  │  │  ├─ onboard
│  │  │  │  └─ route.js
│  │  │  ├─ payment-intent
│  │  │  │  └─ route.js
│  │  │  ├─ pos-payment
│  │  │  │  └─ route.js
│  │  │  └─ webhook
│  │  │     └─ route.js
│  │  ├─ transactions
│  │  │  ├─ [id]
│  │  │  │  └─ route.js
│  │  │  ├─ statistics
│  │  │  │  └─ route.js
│  │  │  └─ route.js
│  │  └─ users
│  │     └─ [id]
│  │        └─ route.js
│  ├─ auth
│  │  ├─ error
│  │  │  └─ page.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  └─ start
│  │     └─ page.tsx
│  ├─ contact
│  │  └─ page.tsx
│  ├─ dashboard
│  │  ├─ components
│  │  │  ├─ Inventory
│  │  │  │  └─ InventorySection.tsx
│  │  │  ├─ Repairs
│  │  │  │  ├─ RepairCategoriesSection.tsx
│  │  │  │  ├─ RepairTicketsSection.tsx
│  │  │  │  └─ RepairsSection.tsx
│  │  │  ├─ Reports
│  │  │  │  ├─ PaymentsReport.tsx
│  │  │  │  └─ ReportsSection.tsx
│  │  │  ├─ Sales
│  │  │  │  ├─ AccessoriesSection.tsx
│  │  │  │  ├─ ProductsSection.tsx
│  │  │  │  └─ SalesSection.tsx
│  │  │  ├─ SalesHistory
│  │  │  │  ├─ SalesHistorySection.tsx
│  │  │  │  └─ salesReport.ts
│  │  │  └─ Settings
│  │  │     └─ SettingsSection.tsx
│  │  ├─ payments
│  │  │  ├─ success
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  └─ page.tsx
│  ├─ pay
│  │  └─ [shopkeeperId]
│  │     └─ page.tsx
│  ├─ pricing
│  │  └─ page.tsx
│  ├─ privacy
│  │  └─ page.tsx
│  ├─ products
│  │  └─ page.tsx
│  ├─ support
│  │  └─ page.tsx
│  ├─ terms
│  │  └─ page.tsx
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components
│  ├─ onboarding
│  │  ├─ CompanyInformationModal.tsx
│  │  └─ PaymentSettingsModal.tsx
│  ├─ ui
│  │  ├─ alert.tsx
│  │  ├─ badge.tsx
│  │  ├─ button.tsx
│  │  ├─ card.tsx
│  │  ├─ input.tsx
│  │  └─ label.tsx
│  ├─ AppChrome.tsx
│  ├─ BadgeRow.tsx
│  ├─ ConfirmDialog.tsx
│  ├─ Container.tsx
│  ├─ DashboardHeader.tsx
│  ├─ DashboardOnboarding.tsx
│  ├─ FeatureCard.tsx
│  ├─ Footer.tsx
│  ├─ KBCard.tsx
│  ├─ Modal.tsx
│  ├─ Navbar.tsx
│  ├─ OnboardingDashboard.tsx
│  ├─ PaymentDashboard.tsx
│  ├─ PaymentModal.tsx
│  ├─ PlanToggle.tsx
│  ├─ PricingCard.tsx
│  ├─ ProductModal.tsx
│  ├─ Providers.tsx
│  ├─ RepairModal.tsx
│  ├─ Section.tsx
│  ├─ ThemeProvider.tsx
│  └─ ThemeToggle.tsx
├─ content
│  ├─ features.js
│  ├─ kb.js
│  └─ pricing.js
├─ lib
│  ├─ apiDataManager.js
│  ├─ auth.js
│  ├─ mongodb.js
│  ├─ pdfReportService.js
│  ├─ stripe.js
│  └─ userStorage.js
├─ models
│  ├─ Counter.js
│  ├─ Product.js
│  ├─ RepairCategory.js
│  ├─ RepairTicket.js
│  ├─ Sale.js
│  ├─ StoreSettings.js
│  ├─ Transaction.js
│  └─ User.js
├─ public
│  ├─ app-store-badge.svg
│  ├─ google-play-badge.svg
│  └─ yourpos-logo.svg
├─ scripts
│  ├─ cleanup-db.js
│  ├─ seed-db.js
│  ├─ seed-mongodb.js
│  ├─ seed-repair-categories.js
│  └─ verify-db.js
├─ summary
│  ├─ CONVERSION_COMPLETE.md
│  ├─ CONVERSION_SUMMARY.md
│  ├─ DEMO_INSTRUCTIONS.md
│  ├─ FINANCIAL_REPORT_FEATURE.md
│  ├─ IMPROVEMENTS_IMPLEMENTED.md
│  ├─ PROJECT_ANALYSIS.md
│  ├─ TESTING_GUIDE.md
│  ├─ TSX_FIX_SOLUTION.md
│  ├─ UI-MOCKUP-Sales-History.md
│  └─ final_summary_v1.md
├─ types
│  ├─ index.js
│  ├─ next-auth.d.ts
│  └─ repair.ts
├─ .env.example
├─ .env.local
├─ .env.production
├─ .gitignore
├─ .vercelignore
├─ README.md
├─ WARP.md
├─ docker-compose.yml
├─ eslint.config.mjs
├─ next-env.d.ts
├─ next.config.js
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ tailwind.config.js
├─ tsconfig.json
└─ vercel.json
## Deployment (Vercel)
- `vercel.json`:
  - `version: 2`, `framework: nextjs`
  - `installCommand: npm install --legacy-peer-deps`
  - `buildCommand: npm run build`
  - `functions: app/api/**/*.{js,ts}` with `maxDuration: 30`
  - `regions: ["iad1"]`
- Steps:
  - `npm i -g vercel`
  - `vercel login`
  - `vercel` (link project; review detected settings)
  - `vercel --prod`
  - Set `.env` in Vercel dashboard (`NEXTAUTH_URL`, `MONGODB_URI`, Stripe keys)

## Docker (optional)
- `docker-compose.yml` available for containerized setups (customize as needed)

## Notes
- Node.js `>=18`
- Ensure MongoDB is accessible from the deployed environment
- Do not commit real secrets; use environment variables only
