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

4. **Seed services (optional)**
   ```bash
   node src/scripts/seedServices.js
   ```

5. **Run**
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:4000`. API base: `http://localhost:4000/api`.

## Folder structure

```
sahaya-backend/
├── src/
│   ├── config/          # app config, database connection
│   ├── controllers/     # auth, users, services, bookings
│   ├── middleware/      # auth (JWT), error handler
│   ├── models/          # User, Service, Booking, OtpStore
│   ├── routes/          # API route definitions
│   ├── services/        # OTP generation & verification
│   ├── scripts/         # seed scripts (e.g. services)
│   ├── utils/           # JWT helpers
│   └── index.js         # app entry
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

**Auth header:** `Authorization: Bearer <token>`

In **development**, `POST /api/auth/send-otp` response includes `otp` so you can verify without SMS.

## Connecting the React Native app (sahaya-mobile)

Use the API base URL in your app (e.g. `http://localhost:4000/api` for emulator; use your machine IP for a physical device). Call:

1. **Login flow:** `POST /api/auth/send-otp` → `POST /api/auth/verify-otp` → store `token` and `user`.
2. **Signup (complete profile):** `POST /api/auth/register` with `name`, `gender`, optional `referralCode` and `Authorization: Bearer <token>`.
3. **Landing:** `GET /api/users/me` for name/address, `GET /api/services` for service cards.
4. **Bookings:** `POST /api/bookings`, `GET /api/bookings` with the same Bearer token.
