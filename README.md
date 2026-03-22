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
