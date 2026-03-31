# Money Crunch

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-20232A?logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Appwrite](https://img.shields.io/badge/Appwrite-BaaS-F02E65?logo=appwrite&logoColor=white)](https://appwrite.io/)
[![Plaid](https://img.shields.io/badge/Plaid-Sandbox-111111?logo=plaid&logoColor=white)](https://plaid.com/)
[![Mapbox](https://img.shields.io/badge/Mapbox-Maps-000000?logo=mapbox&logoColor=white)](https://www.mapbox.com/)

Money Crunch is a mobile budgeting app focused on intentional spending, habit awareness, and financial goal alignment.
The app combines guided onboarding, bank-linking, transaction sync, and visual activity views to help users understand where money goes and why.

## Overview

This repository contains:
- A React Native + Expo mobile app (`mobile`)
- An Appwrite cloud function for Plaid integration (`functions/plaid`)

Core user flow:
1. Create account or sign in
2. Complete onboarding (name, phone, income, motivation/goal)
3. Connect a bank account through Plaid Link
4. Sync and view transactions in timeline/activity screens

## Project Structure

```text
.
|-- mobile/                 # Expo React Native app
|   |-- app/                # Expo Router routes (auth, onboarding, tabs, banking)
|   |-- context/            # Auth and feature contexts/providers
|   |-- lib/                # API helpers, formatting helpers, storage helpers
|   `-- .env.example        # Mobile environment variable template
|
`-- functions/
    `-- plaid/
        |-- src/main.js     # Single Appwrite function entrypoint (action router)
        `-- src/handlers/   # Plaid/Appwrite action handlers
```

## Tech Stack

### Frontend (Mobile)
- Expo SDK 54
- React Native 0.81
- Expo Router
- TypeScript
- `react-native-appwrite` for auth/account integration
- `react-native-plaid-link-sdk` for bank connection
- `@rnmapbox/maps` + `expo-location` for map/location features

### Backend / BaaS
- Appwrite (Auth, Functions, Databases)
- Appwrite Cloud Function (Node.js, ES modules)
- `plaid` Node SDK
- `node-appwrite` for server-side database operations

### External APIs
- Plaid API (Sandbox environment currently configured)
- Mapbox APIs (token-based map rendering)

## Architecture Notes

The Plaid backend uses a single-function, action-based pattern.
`functions/plaid/src/main.js` accepts `POST` requests with an `action` field and dispatches to handler modules:
- `createLinkToken`
- `exchangePublicToken`
- `syncTransactions`
- `getLinkedItems`
- `getTransactions`
- `patchSandboxLocations`

This approach is intentional for Appwrite free-tier constraints and keeps backend routing centralized.

## Prerequisites

- Node.js 18+ (recommended)
- npm
- Android Studio (for Android emulator)
- Appwrite project configured (Auth, Database, Function)
- Plaid sandbox credentials
- Mapbox token (if map features are used)

## Setup

### 1) Clone and install dependencies

```bash
git clone <your-repo-url>
cd sp26-green-budgetapp
cd mobile
npm install
```

For function dependencies:

```bash
cd ../functions/plaid
npm install
```

### 2) Configure mobile environment

From `mobile/.env.example`, create `mobile/.env` and fill values:

- `EXPO_PUBLIC_MAPBOX_TOKEN`
- `EXPO_PUBLIC_APPWRITE_PROJECT_ID`
- `EXPO_PUBLIC_APPWRITE_ENDPOINT`
- `EXPO_PUBLIC_APPWRITE_DB_ID`
- `EXPO_PUBLIC_APPWRITE_FUNCTION_URL`
- `EXPO_PUBLIC_PLAID_FUNCTION_URL`

And any additional Appwrite/Plaid values used by your deployment.

### 3) Configure Appwrite Function environment

Set these environment variables for the Plaid function:

- `PLAID_CLIENT_ID`
- `PLAID_SANDBOX_SECRET_KEY`
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_PLAID_ITEMS_TABLE_ID`
- `APPWRITE_PLAID_TRANSACTIONS_TABLE_ID` (optional but recommended)

## Running the Mobile App

From `mobile`:

```bash
npm run android
```

or

```bash
npm start
```

Important:
- Plaid Link and some native SDKs require a development build.
- Expo Go may not support all native modules used by this project.

## Key Implemented Features

- Email/password authentication with Appwrite
- Session-aware route protection
- Multi-step onboarding flow
- Profile preferences persistence (name/income/goal/phone metadata)
- Plaid bank connection (link token + token exchange)
- Transaction sync and retrieval through Appwrite Function actions
- Tabs for goals, timeline, activity, home, and settings

## Known Limitations

- Plaid setup currently targets sandbox configuration
- iOS testing may be limited without a macOS toolchain
- Some advanced auth flows (OAuth providers, OTP recovery) are not fully integrated
- Feature polish and production hardening are ongoing

## Security Notes

- Do not commit real API keys or secrets to source control
- Keep Plaid secret and Appwrite API keys server-side only
- Use `.env` files locally and Appwrite environment variables in deployment

## Team

Money Crunch team:
- Bryan Juarez H.
- Bradley Walraven
- Bryan Lopez
