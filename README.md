# 24 H Rider — Website + Android starter

This project is a **starter foundation**, not a live production service or finished APK. It includes a responsive Chrome web app/PWA, Node.js + Express API, and SQLite database foundation. Capacitor configuration is included as a starting point for an Android wrapper.

## Run the website locally
Requires Node.js 20+.

```bash
npm install
npm start
```

Open `http://localhost:3000` in Chrome.

## Android app build (requires a computer)
An Android APK is **not included** in this ZIP. To create one, you need Node.js, Android Studio, Android SDK, and a computer:

1. Install dependencies: `npm install`
2. Add Capacitor packages: `npm install @capacitor/core @capacitor/cli @capacitor/android`
3. Initialize/sync Capacitor if prompted: `npx cap add android` (only once), then `npx cap sync android`
4. Open Android project: `npx cap open android`
5. In Android Studio, build an APK for testing.

**Important:** this wrapper configuration alone does not make the backend public. A deployed HTTPS API URL and proper app configuration are needed for real users; the local Express server won't be accessible to customers on the internet automatically.

## Deployment
Deploy the Node.js project to a host that supports persistent storage. Configure install command `npm install` and start command `npm start`; use persistent disk or a managed database. Once deployed, use the HTTPS URL in Chrome. Supported devices may offer **Install app / Add to Home screen**.

## Before real-world launch
The following are not yet implemented/configured and must be added and tested before accepting real customers or payments:
- Real mobile OTP/SMS verification and secure sessions
- Customer booking screens and authenticated customer accounts
- Admin dashboard with protected access to create/dispatch orders
- Secure rider authentication and role-based authorization
- Order lifecycle (pickup, delivered, cancelled, proof of delivery)
- GPS/map tracking and notifications
- Payment gateway, COD reconciliation, 20% company commission / 80% rider ledger, payouts and refunds
- Production security, rate limits, backups, monitoring, privacy/terms and support workflows

The 20% / 80% split is a business rule requested for the planned product, but this starter does not yet calculate or pay real earnings. Do not expose it to real users until authentication, authorization, payments, and database security have been implemented and reviewed.

## Order sources
Admin-created and customer-booked orders can be supported as the product is completed. Loadshare's private orders cannot be accessed without an authorized API/business partnership; this project does not connect to Loadshare.
