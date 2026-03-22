# Dev DB insert API (`/api/dev`)

These routes are **only mounted** when:

- `NODE_ENV=development` (default), **or**
- `ENABLE_DEV_DB_TOOLS=true` in `.env`

If `DEV_DB_KEY` is set in `.env`, every request must include header:

```http
X-Dev-Db-Key: <your DEV_DB_KEY>
```

**Do not enable in production** without a strong `DEV_DB_KEY` and network restrictions.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/dev/summary` | Counts: users, services, bookings, transactions |
| POST | `/api/dev/services` | Upsert one or many services |
| POST | `/api/dev/users` | Upsert user by phone |
| POST | `/api/dev/bookings` | Create a booking |
| POST | `/api/dev/transactions` | Upsert a transaction |

Base URL examples use `http://localhost:4000`.

---

### GET summary

```bash
curl -s http://localhost:4000/api/dev/summary
```

With key:

```bash
curl -s -H "X-Dev-Db-Key: your-key" http://localhost:4000/api/dev/summary
```

---

### POST services (upsert by `slug`)

Single object:

```bash
curl -s -X POST http://localhost:4000/api/dev/services \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deep Cleaning",
    "slug": "deep-cleaning",
    "category": "cleaning",
    "sortOrder": 10,
    "description": "Full home deep clean",
    "isActive": true
  }'
```

Bulk:

```bash
curl -s -X POST http://localhost:4000/api/dev/services \
  -H "Content-Type: application/json" \
  -d '{
    "services": [
      { "title": "Kitchen & Utensil Cleaning", "slug": "kitchen-utensil-cleaning", "category": "cleaning", "sortOrder": 1 },
      { "title": "Food Prep & Serving", "slug": "food-prep-serving", "category": "cooking", "sortOrder": 2 }
    ]
  }'
```

---

### POST users (upsert by `phone`)

```bash
curl -s -X POST http://localhost:4000/api/dev/users \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "name": "Test User",
    "gender": "Male",
    "address": "Bengaluru",
    "isProfileComplete": true,
    "referralCode": "TEST01"
  }'
```

---

### POST bookings

Use MongoDB ObjectIds from your DB (e.g. from Compass or `/api/dev/summary` + list users/services).

```bash
curl -s -X POST http://localhost:4000/api/dev/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "REPLACE_USER_OBJECT_ID",
    "serviceId": "REPLACE_SERVICE_OBJECT_ID",
    "type": "instant",
    "status": "pending",
    "address": "Service address"
  }'
```

Scheduled:

```bash
curl -s -X POST http://localhost:4000/api/dev/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "REPLACE_USER_OBJECT_ID",
    "serviceId": "REPLACE_SERVICE_OBJECT_ID",
    "type": "schedule",
    "scheduledAt": "2026-03-25T10:00:00.000Z",
    "status": "confirmed",
    "address": "Customer address"
  }'
```

---

### POST transactions (upsert by `txnId`)

```bash
curl -s -X POST http://localhost:4000/api/dev/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "REPLACE_BOOKING_OBJECT_ID",
    "userId": "REPLACE_USER_OBJECT_ID",
    "txnId": "TXN-TEST-001",
    "txnAmt": 499
  }'
```

---

## Workflow

1. Start MongoDB and the API: `npm run dev`
2. Run once: `npm run init-db`
3. Insert catalog: `POST /api/dev/services` or `npm run seed-services`
4. Insert users: `POST /api/dev/users` or `npm run seed-sample-data`
5. Check: `GET /api/dev/summary`
