# Sahaya Backend

Node.js (Express) backend for the **Sahaya** React Native app — auth (OTP), users, services, and bookings.

**Separate repository** — clone and run independently from the mobile app.

## Requirements

- Node.js >= 18
- MongoDB (local or Atlas)

## Setup

1. **Clone / open the repo**
   ```bash
   cd sahaya-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment**
   - Copy `.env.example` to `.env`
   - Set `MONGODB_URI` (e.g. `mongodb://localhost:27017/sahaya`)
   - Set `JWT_SECRET` for production

4. **Create MongoDB collections and indexes**
   ```bash
   npm run init-db
   ```
   (Creates `users`, `services`, `bookings`, `otpstores` and their indexes. Ensure MongoDB is running.)

5. **Seed services (optional)**
   ```bash
   npm run seed-services
   ```

6. **Run**
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:4000`. API base: `http://localhost:4000/api`.

7. **Insert data (development)**  
   With `NODE_ENV=development`, the **Dev DB API** is available under `/api/dev` — insert users, services, bookings, and transactions via HTTP (see **[docs/DEV_DB_API.md](docs/DEV_DB_API.md)**).  
   Quick check: `curl http://localhost:4000/api/dev/summary`

## Folder structure

```
sahaya-backend/
├── src/
│   ├── config/          # app config, database connection
│   ├── controllers/     # auth, users, services, bookings
│   ├── middleware/      # auth (JWT), error handler
│   ├── models/          # User, Service, Booking, OtpStore, Transaction
│   ├── routes/          # API routes (+ dev DB tools in development)
│   ├── services/        # OTP generation & verification
│   ├── scripts/         # initDb, seedServices
│   ├── utils/           # JWT helpers
│   └── index.js         # app entry
├── docs/                # e.g. DEV_DB_API.md, DATABASE_ARCHITECTURE.md
├── .env.example
├── package.json
└── README.md
```

## API overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/send-otp` | No | Send OTP to phone (body: `{ "phone": "9876543210" }`) |
| POST | `/api/auth/verify-otp` | No | Verify OTP, get JWT (body: `{ "phone", "otp" }`) |
| POST | `/api/auth/register` | Yes | Complete profile: name, gender, referralCode |
| GET | `/api/users/me` | Yes | Get current user profile |
| PATCH | `/api/users/me` | Yes | Update name, gender, address |
| GET | `/api/services` | No | List active services |
| POST | `/api/bookings` | Yes | Create booking (serviceId, type, scheduledAt?, address?) |
| GET | `/api/bookings` | Yes | List current user's bookings |

**Development — Dev DB insert API** (`NODE_ENV=development` or `ENABLE_DEV_DB_TOOLS=true`): see [docs/DEV_DB_API.md](docs/DEV_DB_API.md) for `GET/POST /api/dev/*` (summary, services, users, bookings, transactions). Optional header `X-Dev-Db-Key` if `DEV_DB_KEY` is set in `.env`.

**Auth header:** `Authorization: Bearer <token>`

In **development**, `POST /api/auth/send-otp` response includes `otp` so you can verify without SMS.

## Troubleshooting

### `connect ECONNREFUSED 127.0.0.1:27017`

MongoDB is not running or not listening on the default port. Do one of the following:

- **Local MongoDB (macOS with Homebrew):**  
  `brew tap mongodb/brew && brew install mongodb-community@8.0 && brew services start mongodb-community@8.0`  
  (or start **MongoDB Compass** / Docker container that exposes port `27017`.)
- **MongoDB Atlas:** Put your connection string in `.env` as `MONGODB_URI=...` (no local server needed).

Then run `npm run init-db` again.

### `npm seed-sample-data` → Unknown command

Use the **run** form for package scripts:

```bash
npm run seed-sample-data
```

## Connecting the React Native app (sahaya-mobile)

Use the API base URL in your app (e.g. `http://localhost:4000/api` for emulator; use your machine IP for a physical device). Call:


1. **Login flow:** `POST /api/auth/send-otp` → `POST /api/auth/verify-otp` → store `token` and `user`.
2. **Signup (complete profile):** `POST /api/auth/register` with `name`, `gender`, optional `referralCode` and `Authorization: Bearer <token>`.
3. **Landing:** `GET /api/users/me` for name/address, `GET /api/services` for service cards.
4. **Bookings:** `POST /api/bookings`, `GET /api/bookings` with the same Bearer token.

## Mongo DB final process
Option 1 — Update Command Line Tools (recommended if you want local MongoDB)
Try in this order:

System Settings → General → Software Update
Install any Command Line Tools or Xcode updates.

If nothing shows up, reinstall CLT:

sudo rm -rf /Library/Developer/CommandLineTools
sudo xcode-select --install
Complete the installer dialog, then retry:


brew install mongodb-community@8.0
brew services start mongodb-community@8.0

Next steps (from sahaya-backend)
Confirm DB is up (optional):

mongosh --eval "db.runCommand({ ping: 1 })"
Create collections + indexes

npm run init-db
Seed data (optional)

npm run seed-services
npm run seed-sample-data
Start the API

npm run dev
Your .env should have something like:

MONGODB_URI=mongodb://localhost:27017/sahaya

Quick checks
Health: open or run
curl http://localhost:4000/api/health
You should see JSON like { "success": true, "message": "Sahaya API is running" }.
If you haven’t already
npm run init-db
npm run seed-services
npm run seed-sample-data
(You can run these anytime; init-db is safe to run again.)

Mobile app
Point sahaya-mobile at:

iOS Simulator: http://localhost:4000/api
Android Emulator: http://10.0.2.2:4000/api (as in src/config/api.ts)
You’re in a good state to exercise login → OTP → signup → landing against this backend.

*********************************************
1. Dev DB insert API (/api/dev)
Mounted when NODE_ENV=development (your default) or ENABLE_DEV_DB_TOOLS=true.

Method	Path	What it does
GET	/api/dev/summary	Counts: users, services, bookings, transactions
POST	/api/dev/services	Upsert one service or { "services": [ ... ] } (by slug)
POST	/api/dev/users	Upsert user by phone
POST	/api/dev/bookings	Create booking (userId, serviceId, type, …)
POST	/api/dev/transactions	Upsert transaction (bookingId, userId, txnId, txnAmt)
If you set DEV_DB_KEY in .env, send header X-Dev-Db-Key: <same value> on every /api/dev/* call.

On startup you should see:

Dev DB insert API: http://localhost:4000/api/dev (see docs/DEV_DB_API.md)

2. Files touched
src/config/index.js — devDbToolsEnabled, devDbKey
src/middleware/devDbAuth.js — optional key check
src/controllers/devDbController.js — insert handlers
src/routes/dev.js — routes
src/routes/index.js — mounts /dev when enabled
src/index.js — startup log line
docs/DEV_DB_API.md — curl examples
.env.example, README.md — docs
3. What you run
cd ~/Desktop/sahaya-backend
brew services start mongodb-community@8.0   # if not already running
npm run dev
In another terminal:

curl -s http://localhost:4000/api/dev/summary
Insert a service:

curl -s -X POST http://localhost:4000/api/dev/services \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Service","slug":"test-service","category":"other","sortOrder":99}'
Insert a user:

curl -s -X POST http://localhost:4000/api/dev/users \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","name":"Demo","gender":"Male","isProfileComplete":true}'
Use GET /api/dev/summary and MongoDB Compass (or the response bodies) to copy _id values for userId / serviceId / bookingId when creating bookings and transactions. Full examples: docs/DEV_DB_API.md.

4. Mobile app (sahaya-mobile)
Backend does not start the React Native app. From the mobile repo:

cd ~/Desktop/sahaya-mobile
npm start
# then npm run ios   or   npm run android
Point the app at http://localhost:4000/api (iOS sim) or http://10.0.2.2:4000/api (Android emulator).

Restart npm run dev once so the new /api/dev routes load.----

--------> Once user and service s inserted:

Here’s a sensible order now that you have a user and a service:

1. Confirm data
curl -s http://localhost:4000/api/dev/summary
curl -s http://localhost:4000/api/services
You should see your user count go up and your service in the list.

2. Create a booking (needs IDs)
From the responses when you inserted the user/service, copy:

User id → userId
Service _id → serviceId
Then:

curl -s -X POST http://localhost:4000/api/dev/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "PASTE_USER_OBJECT_ID",
    "serviceId": "PASTE_SERVICE_OBJECT_ID",
    "type": "instant",
    "status": "pending",
    "address": "Customer address"
  }'
(For a scheduled job, use "type": "schedule" and "scheduledAt": "2026-03-25T10:00:00.000Z".)

3. Optional: add a payment row (transaction)
From the booking response, copy booking._id, same userId:

curl -s -X POST http://localhost:4000/api/dev/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "PASTE_BOOKING_OBJECT_ID",
    "userId": "SAME_USER_OBJECT_ID",
    "txnId": "TXN-001",
    "txnAmt": 499
  }'
4. Or test the real app flow (mobile / Postman)
POST /api/auth/send-otp with that user’s phone → use otp from the response in dev.
POST /api/auth/verify-otp → get JWT.
GET /api/users/me and GET /api/bookings with Authorization: Bearer <token> (bookings only show what that user created through the normal API, not necessarily the dev booking unless it’s the same user id).
Next step in one line: create a booking with your userId + serviceId; after that, optionally a transaction, or exercise OTP → JWT → bookings on the phone.


