# Meta Lead Ads → Real-Time React Native Dashboard (PoC)

> **This is a learning/prototyping project.**
> It uses Meta's **real** Lead Testing Tool and **real** webhook/API flow — no simulated data.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Starting the Backend](#starting-the-backend)
5. [Starting the React Native App](#starting-the-react-native-app)
6. [Configuring the Meta Webhook](#configuring-the-meta-webhook)
7. [Using the Lead Testing Tool](#using-the-lead-testing-tool)
8. [How the Real-Time Flow Works](#how-the-real-time-flow-works)
9. [Troubleshooting](#troubleshooting)

---

## Architecture

```
Meta Lead Testing Tool
        │
        ▼  (webhook POST)
Meta Servers
        │
        ▼  (HTTPS to your ngrok/tunnel URL)
Node.js + Express  (backend/)
        │
        ├─── GET /webhook  ──► Webhook verification (once, during setup)
        ├─── POST /webhook ──► Receive lead event → fetch details via Graph API
        │                       └── Save to MongoDB
        │                       └── Emit  "new_lead"  via Socket.IO
        │
        ├─── GET /leads    ──► Returns all stored leads (JSON)
        └─── GET /health   ──► Health check
               │
               │  (Socket.IO + REST)
               ▼
    React Native App (mobile/)
               │
               └── Leads Dashboard (auto-updates on "new_lead" event)
```

---

## Prerequisites

| Requirement | Purpose |
|---|---|
| **Node.js ≥ 18** | Backend server |
| **MongoDB** (local or Atlas) | Lead storage |
| **ngrok** (or similar tunnel) | Expose local backend to Meta |
| **Meta Developer Account** | Webhook & Graph API access |
| **Java 17** / **Android SDK** | Android build (or Xcode for iOS) |
| **Expo Go** (optional) | Quick mobile preview |

---

## Environment Variables

### Backend

Copy `.env.example` → `.env` in the `backend/` folder:

```env
PORT=3000
META_ACCESS_TOKEN=<long-lived Page Access Token>
META_VERIFY_TOKEN=<any random secret you choose>
META_PAGE_ID=<your Facebook Page ID>
META_APP_SECRET=<App Secret from App Dashboard>
MONGODB_URI=mongodb://127.0.0.1:27017/meta_leads
```

**How to get these values:**

| Variable | Where to find it |
|---|---|
| `META_ACCESS_TOKEN` | Meta for Developers → your App → Tools → Graph API Explorer → generate a **Page token** with `leads_retrieval` and `pages_read_engagement` permissions |
| `META_VERIFY_TOKEN` | Make up any random string (e.g. `mysecrettoken123`) — you'll enter the same value in the Meta webhook dashboard |
| `META_PAGE_ID` | Facebook Page → About → Page ID (numeric) |
| `META_APP_SECRET` | App Dashboard → Settings → Basic → App Secret |
| `MONGODB_URI` | For Atlas: connection string from Atlas → Connect → Drivers |

### React Native App

Open `mobile/constants/config.ts` and set `BACKEND_URL`:

```typescript
// Android emulator  👇
export const BACKEND_URL = 'http://10.0.2.2:3000';

// iOS simulator     👇
// export const BACKEND_URL = 'http://localhost:3000';

// Physical device   👇  (find your machine's local IP with ipconfig)
// export const BACKEND_URL = 'http://192.168.x.x:3000';
```

> ⚠️ The app **never** communicates with Meta directly. All Meta credentials stay on the backend.

---

## Starting the Backend

```bash
cd backend

# First time only – copy the env file
copy .env.example .env
# ... edit .env with your values ...

# Install dependencies
npm install

# Development (auto-reload on changes)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3000`.  
Verify it's healthy: `curl http://localhost:3000/health`

---

## Starting the React Native App

```bash
cd mobile

# Install dependencies
npm install

# Android  (ensure emulator is running or device is connected)
npm run android

# iOS  (macOS only)
npm run ios

# Quick preview with Expo Go
npx expo start
```

> If running on a **physical device**: set `BACKEND_URL` in `mobile/constants/config.ts`
> to your machine's local network IP (e.g. `http://192.168.1.25:3000`).

---

## Configuring the Meta Webhook

### Step 1 – Expose the backend

Meta must reach your backend over **HTTPS**. Use ngrok:

```bash
ngrok http 3000
```

Copy the `https://xxxx.ngrok-free.app` URL.

### Step 2 – Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com/) → **My Apps** → **Create App**
2. Choose **Business** type → fill in the details.

### Step 3 – Add the Facebook Login product

Under **Add a Product**, add **Facebook Login** — this gives you access to pages and leads.

### Step 4 – Configure the Webhook

1. App Dashboard → **Webhooks** (left sidebar) → **Subscribe to a topic**
2. Select **Page**
3. Set:
   - **Callback URL**: `https://xxxx.ngrok-free.app/webhook`
   - **Verify Token**: same value as `META_VERIFY_TOKEN` in your `.env`
4. Click **Verify and Save** — Meta will call `GET /webhook` to confirm.
5. Under **Subscribed Fields**, check ✅ **leadgen**

### Step 5 – Subscribe your Page

1. Still on the Webhooks page → **API Version** dropdown → select latest
2. Under the Page object → **Add Subscriptions** → choose your Page → check **leadgen** → Save.

---

## Using the Lead Testing Tool

1. Go to App Dashboard → **Lead Ads Testing Tool**
   (URL: `https://developers.facebook.com/tools/lead-ads-testing`)
2. Select your **Page** and a **Lead Form** (create one in Ads Manager if needed).
3. Click **Preview Form** → **Submit** with test data.
4. Meta fires a webhook → your backend fetches the lead → stores it → emits Socket.IO event.
5. **Watch the React Native app** — the lead appears automatically. ✅

---

## How the Real-Time Flow Works

```
1. npx expo start / npm run android
2. App mounts → connects to Socket.IO (ws://backend)
3. App fetches GET /leads → renders existing leads
4. Developer opens Lead Testing Tool → submits form
5. Meta sends POST /webhook to ngrok URL
6. Backend validates X-Hub-Signature-256
7. Backend parses leadgen_id from payload
8. Backend calls Meta Graph API: GET /<leadgen_id>?fields=id,created_time,field_data
9. Backend saves lead to MongoDB (unique on metaLeadId)
10. Backend emits io.emit('new_lead', leadData)
11. React Native receives 'new_lead' event
12. Lead prepended to list with "NEW" badge — no interaction needed
```

---

## Troubleshooting

### Webhook verification fails

- Confirm `META_VERIFY_TOKEN` in `.env` matches exactly what you typed in the Meta dashboard.
- Check ngrok is still running and forwarding to port 3000.
- Check backend logs for the verification request.

### `new_lead` event not firing

- Check backend logs for `POST /webhook` — is it receiving the request?
- If signature validation rejects it: confirm `META_APP_SECRET` is correct. During initial testing you can temporarily remove the secret check by leaving `META_APP_SECRET` blank (webhook validator will skip the check with a warning).
- Confirm your Page is subscribed to the **leadgen** webhook field.

### Graph API call fails (401)

- `META_ACCESS_TOKEN` may be expired. Regenerate a fresh Page token in Graph API Explorer.
- Ensure the token has `leads_retrieval` permission.

### App can't connect to backend (Android emulator)

- Use `http://10.0.2.2:3000` (not `localhost`) — Android emulator routes `10.0.2.2` to the host machine.
- For iOS simulator use `http://localhost:3000`.
- For physical devices use your LAN IP (`ipconfig` on Windows).

### MongoDB connection refused

- Ensure `mongod` is running: `mongod --dbpath C:\data\db`
- Or point `MONGODB_URI` to your MongoDB Atlas cluster.

### Duplicate leads appearing

- The system uses `metaLeadId` as a unique key — duplicates are silently ignored server-side.
- On the client, the FlatList key extractor also prevents duplicate renders.

---

## Project Structure

```
meta lead app/
├── backend/
│   ├── src/
│   │   ├── index.js                 # Entry point
│   │   ├── config/
│   │   │   └── database.js          # MongoDB connection
│   │   ├── models/
│   │   │   └── Lead.js              # Mongoose schema
│   │   ├── routes/
│   │   │   ├── health.js            # GET /health
│   │   │   ├── leads.js             # GET /leads
│   │   │   └── webhook.js           # GET+POST /webhook
│   │   ├── socket/
│   │   │   └── socketHandler.js     # Socket.IO lifecycle
│   │   └── utils/
│   │       ├── logger.js            # Console logger
│   │       ├── metaApi.js           # Graph API helper
│   │       └── webhookValidator.js  # HMAC-SHA256 validator
│   ├── .env.example
│   └── package.json
│
└── mobile/
    ├── app/
    │   ├── _layout.tsx              # Root layout
    │   └── index.tsx                # Leads Dashboard (main screen)
    ├── components/
    │   ├── ConnectionBadge.tsx      # Live/Offline indicator
    │   ├── EmptyState.tsx           # No leads yet
    │   ├── LeadCard.tsx             # Individual lead card
    │   └── StatsRow.tsx             # Total / New counters
    ├── constants/
    │   ├── config.ts                # Backend URL
    │   └── types.ts                 # TypeScript interfaces
    ├── services/
    │   └── socketService.ts         # Singleton Socket.IO client
    └── package.json
```
