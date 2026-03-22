# Sahaya – Database Architecture & Schema

## 1. Domain Summary

**Sahaya** is a home-services / helper booking app (cook, maid, driver, cleaning, etc.).

| Entity | Purpose |
|--------|---------|
| **User** | Phone-based auth (OTP), profile (name, gender, address), optional referral (code + referredBy) |
| **Service** | Catalog of bookable services (title, slug, category, imageUrl, active, sortOrder) |
| **Booking** | User books a service (instant or scheduled); has status, address, scheduledAt |
| **OTP store** | Ephemeral phone → OTP with TTL for login/signup |

**Relationships:**

- **User 1:N Booking** — one user has many bookings
- **Service 1:N Booking** — one service has many bookings
- **User N:1 User** — `referredBy` (self-reference for referral chain)
- **OtpStore** — standalone, keyed by phone; auto-expiry

**Access patterns (current & likely):**

- Lookup user by phone (auth), by id (JWT, getMe, updateMe)
- List active services (sorted)
- List bookings by user (sorted by createdAt)
- Create booking (user + service + type + optional scheduledAt)
- OTP: upsert/lookup/delete by phone; TTL expiry
- Future: payments, provider assignment, cancellations, reviews, reporting

---

## 2. Relational vs Non-Relational for Sahaya

### 2.1 Option A: Non-Relational (MongoDB – current)

**Pros:**

- **Already implemented** — no migration cost; schema and indexes exist
- **Flexible schema** — easy to add fields (e.g. `notes`, `metadata`) without migrations
- **TTL index** — OTP expiry is built-in (`expireAfterSeconds: 0` on `expiresAt`)
- **Document model** — can embed service snapshot in booking for “read with booking” if needed
- **Good fit for optional fields** — address, referralCode, imageUrl can be absent
- **Simple deployment** — MongoDB Atlas / single replica fits early stage

**Cons:**

- No DB-level referential integrity (orphan bookings if user/service deleted)
- Joins are app-level (e.g. `.populate()`) or denormalization
- Reporting / analytics often easier in SQL
- If you later need strict consistency (e.g. payments), you may add transactions and checks in app

**Verdict:** Strong choice for **MVP and rapid iteration**; keep if you prefer document model and current stack.

---

### 2.2 Option B: Relational (PostgreSQL recommended)

**Pros:**

- **Referential integrity** — FK constraints prevent invalid `user_id` / `service_id` in bookings
- **ACID transactions** — e.g. create booking + update counters or payment in one transaction
- **Natural joins** — “bookings with service title”, “user with referral chain” are simple SQL
- **Reporting & analytics** — SQL, aggregations, and BI tools integrate easily
- **Future-proof** — payments, refunds, provider assignment, reviews fit relational model well
- **Standard** — large talent pool, many hosting options (RDS, Supabase, etc.)

**Cons:**

- Migration from current MongoDB required (one-time)
- Schema changes need migrations (add column, index, etc.)
- OTP storage: use a table with TTL-like cleanup (cron or `DELETE WHERE expires_at < NOW()`)

**Verdict:** Best choice if you want **strong integrity, SQL, and a path to payments/reporting**.

---

## 3. Recommendation

| Scenario | Recommendation |
|----------|----------------|
| **Ship fast, iterate, small team** | **MongoDB** — keep current stack; add clear schema doc and indexes (below). |
| **Plan payments, reporting, strict integrity** | **PostgreSQL** — migrate once; use schema and indexes below. |
| **Hybrid** | MongoDB for app data; **Redis** (or similar) for OTP only — optional later. |

**Pragmatic default:**  
- **Short term:** Stay on **MongoDB**; formalize schema and indexes.  
- **When you add payments or heavy reporting:** Plan a move to **PostgreSQL** (or add a read replica / analytics DB).

---

## 4. Schema Definitions

### 4.1 Non-Relational (MongoDB) – Current + Refinements

#### Collection: `users`

| Field | Type | Required | Index | Notes |
|-------|------|----------|--------|-------|
| `_id` | ObjectId | ✓ | PK | |
| `phone` | string | ✓ | unique | Normalized 10 digits |
| `name` | string | | | |
| `gender` | enum | | | `'Male' \| 'Female' \| ''` |
| `address` | string | | | |
| `referralCode` | string | | | Code this user gives out |
| `referredBy` | ObjectId | | ref: users | User who referred this user |
| `isProfileComplete` | boolean | ✓ | | default false |
| `createdAt` | Date | ✓ | | |
| `updatedAt` | Date | ✓ | | |

**Indexes:** `{ phone: 1 }` unique.

---

#### Collection: `services`

| Field | Type | Required | Index | Notes |
|-------|------|----------|--------|-------|
| `_id` | ObjectId | ✓ | PK | |
| `title` | string | ✓ | | |
| `slug` | string | ✓ | unique | URL-safe, e.g. `kitchen-utensil-cleaning` |
| `description` | string | | | |
| `imageUrl` | string | | | |
| `category` | enum | | | `instant \| schedule \| cleaning \| cooking \| other` |
| `isActive` | boolean | ✓ | | default true |
| `sortOrder` | number | | | default 0; lower first |
| `createdAt` | Date | ✓ | | |
| `updatedAt` | Date | ✓ | | |

**Indexes:** `{ slug: 1 }` unique; query active list: `{ isActive: 1, sortOrder: 1, title: 1 }`.

---

#### Collection: `bookings`

| Field | Type | Required | Index | Notes |
|-------|------|----------|--------|-------|
| `_id` | ObjectId | ✓ | PK | |
| `user` | ObjectId | ✓ | ref: users | |
| `service` | ObjectId | ✓ | ref: services | |
| `type` | enum | ✓ | | `instant \| schedule` |
| `scheduledAt` | Date | | | null for instant |
| `status` | enum | ✓ | | `pending \| confirmed \| in_progress \| completed \| cancelled` |
| `address` | string | | | Service address |
| `createdAt` | Date | ✓ | | |
| `updatedAt` | Date | ✓ | | |

**Indexes:** `{ user: 1, createdAt: -1 }` (list user’s bookings). Optional: `{ service: 1, createdAt: -1 }`, `{ status: 1 }`.

---

#### Collection: `otp_stores` (or `otpstores`)

| Field | Type | Required | Index | Notes |
|-------|------|----------|--------|-------|
| `_id` | ObjectId | ✓ | PK | |
| `phone` | string | ✓ | | |
| `otp` | string | ✓ | | |
| `expiresAt` | Date | ✓ | TTL | `expireAfterSeconds: 0` |
| `createdAt` | Date | ✓ | | |

**Indexes:** `{ phone: 1 }`; `{ expiresAt: 1 }` with TTL.

---

### 4.2 Relational (PostgreSQL) – Tables & Schema

#### Table: `users`

```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        VARCHAR(20) NOT NULL UNIQUE,
  name         VARCHAR(255),
  gender       VARCHAR(20) CHECK (gender IN ('Male', 'Female', '')),
  address      TEXT,
  referral_code VARCHAR(50),
  referred_by  UUID REFERENCES users(id),
  is_profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_referred_by ON users(referred_by);
```

---

#### Table: `services`

```sql
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image_url   VARCHAR(500),
  category    VARCHAR(50) NOT NULL DEFAULT 'other'
    CHECK (category IN ('instant', 'schedule', 'cleaning', 'cooking', 'other')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_active_sort ON services(is_active, sort_order, title);
```

---

#### Table: `bookings`

```sql
CREATE TABLE bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service_id   UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  type         VARCHAR(20) NOT NULL CHECK (type IN ('instant', 'schedule')),
  scheduled_at TIMESTAMPTZ,
  status       VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  address      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at DESC);
CREATE INDEX idx_bookings_service ON bookings(service_id, created_at DESC);
CREATE INDEX idx_bookings_status ON bookings(status);
```

---

#### Table: `otp_stores`

```sql
CREATE TABLE otp_stores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(20) NOT NULL,
  otp        VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_stores_phone ON otp_stores(phone);
CREATE INDEX idx_otp_stores_expires_at ON otp_stores(expires_at);
-- Run periodic: DELETE FROM otp_stores WHERE expires_at < NOW();
```

---

## 5. Entity Relationship (Conceptual)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │  bookings   │       │  services   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │───┐   │ id          │   ┌───│ id          │
│ phone (UK)  │   │   │ user_id     │───┘   │ title       │
│ name        │   └──│ service_id   │───────│ slug (UK)   │
│ gender      │       │ type        │       │ category    │
│ address     │       │ status      │       │ is_active   │
│ referred_by │──┐   │ scheduled_at │       │ sort_order  │
│ ...         │  │   │ address      │       └─────────────┘
└─────────────┘  │   └─────────────┘
                 │
                 └──► self-reference (referral chain)

┌─────────────┐
│ otp_stores  │  (standalone; TTL / cron cleanup)
├─────────────┤
│ phone       │
│ otp         │
│ expires_at  │
└─────────────┘
```

---

## 6. Index Summary

| Store | Purpose | Index |
|-------|---------|--------|
| MongoDB | User by phone | `users: { phone: 1 }` unique |
| MongoDB | User’s bookings | `bookings: { user: 1, createdAt: -1 }` |
| MongoDB | Active services | `services: { isActive: 1, sortOrder: 1, title: 1 }` |
| MongoDB | OTP by phone + TTL | `otp_stores: { phone: 1 }, { expiresAt: 1 }` TTL |
| PostgreSQL | Same semantics | As in SQL above |

---

## 7. Referral Link (Future)

Backend has `referredBy` (User ref) but register only sets `referralCode` (string). To link referrer:

1. On register, resolve `referralCode` to a user id.
2. Set `user.referredBy = referrerId` (and keep or drop `referralCode` as needed).
3. Both MongoDB and PostgreSQL schemas above support this.

---

## 8. Summary

- **Domain:** Users (phone auth, profile, referral), Services (catalog), Bookings (user × service, instant/schedule), OTP (ephemeral).
- **Recommendation:** **MongoDB** for current phase; **PostgreSQL** when you need strong integrity, payments, or reporting.
- **Schema:** Use the MongoDB collections and indexes as the “single source of truth” for non-relational; use the PostgreSQL DDL for a future relational implementation or migration.
