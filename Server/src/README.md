# EVE Healthcare Diagnostic Booking Service (Phase 1)

## Overview
This repository implements a minimal backend for a diagnostic test booking service. It provides user authentication, centre and test management, booking creation, payment simulation, and an idempotent webhook for payment outcomes.

> **Note:** The original assignment prefers PostgreSQL, but this implementation uses **MongoDB + Mongoose** as locked by the specification.

## Table of Contents
- [Running the Service Locally](#running-the-service-locally)
- [Environment Variables](#environment-variables)
- [Why MongoDB + Mongoose?](#why-mongodb--mongoose)
- [API Endpoints (cURL Examples)](#api-endpoints-curl-examples)
- [Schema Notes](#schema-notes)
- [Booking State Machine](#booking-state-machine)
- [Assumptions & Decisions](#assumptions--decisions)
- [Later (Deferred) Items](#later-deferred-items)

---

## Running the Service Locally
```bash
# 1. Clone the repo (already done in your workspace)
# 2. Install dependencies
npm install

# 3. Create a .env file (see below for required vars)
cp .env.example .env
# Edit .env with your values

# 4. Seed the database (idempotent – safe to run multiple times)
npm run seed

# 5. Start the development server (nodemon) 
npm run dev
```
The service will be available at `http://localhost:{PORT}` (default `PORT=3000`).

---

## Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port the HTTP server listens on | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/eve_healthcare` |
| `JWT_SECRET` | Secret used to sign JWTs | `supersecretkey` |
| `JWT_EXPIRES_IN` | JWT validity duration (e.g., `1h`, `30d`) | `1h` |
| `WEBHOOK_SECRET` | Secret header value for webhook verification | `mywebhooksecret` |

---

## Why MongoDB + Mongoose?
The assignment specification explicitly states that **PostgreSQL is preferred**, but the stack is locked to **MongoDB + Mongoose** for this phase. This choice:
- Keeps the implementation simple with a single DB technology.
- Allows us to use flexible document schemas and built‑in partial indexes for idempotency constraints.
- Meets the requirement of using only the allowed dependencies (no Prisma, no TypeScript, no extra ORMs).

---

## API Endpoints (cURL Examples)
All URLs are relative to `http://localhost:{PORT}/api` unless otherwise noted.

### Auth
```bash

curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"UserPass123","role":"USER"}'


curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"UserPass123"}'
```
The response contains `{ token: "<jwt>" }`. Store this token for subsequent calls as `Authorization: Bearer <jwt>`.

### Centres & Tests (public)
```bash

curl http://localhost:3000/api/centres


curl http://localhost:3000/api/centres/<centreId>
```
Admin‑only (require JWT with role ADMIN):
```bash
# Create centre
curl -X POST http://localhost:3000/api/centres \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_jwt>" \
  -d '{"name":"City Lab","location":"Bangalore"}'

# Patch centre (e.g., deactivate)
curl -X PATCH http://localhost:3000/api/centres/<centreId> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_jwt>" \
  -d '{"active":false}'


curl -X POST http://localhost:3000/api/centres/<centreId>/tests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_jwt>" \
  -d '{"testId":"<testId>","pricePaise":49900,"available":true}'


curl -X PATCH http://localhost:3000/api/centres/<centreId>/tests/<testId> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_jwt>" \
  -d '{"pricePaise":59900,"available":false}'
```
---
### Bookings (authenticated users)
```bash

curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_jwt>" \
  -d '{"centreId":"<centreId>","testId":"<testId>","appointmentAt":"2023-12-01T10:00:00Z"}'


curl -H "Authorization: Bearer <user_jwt>" http://localhost:3000/api/bookings


curl -H "Authorization: Bearer <user_jwt>" http://localhost:3000/api/bookings/<bookingId>


curl -X POST http://localhost:3000/api/bookings/<bookingId>/cancel \
  -H "Authorization: Bearer <user_jwt>"
```
---
### Payments & Webhook (authenticated except webhook)
```bash

curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_jwt>" \
  -d '{"bookingId":"<bookingId>","outcome":"SUCCESS"}'


curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_jwt>" \
  -d '{"bookingId":"<bookingId>","outcome":"FAILED"}'
 secret.
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
  -d '{"eventId":"evt_12345","bookingId":"<bookingId>","providerRef":"prov_abc","outcome":"SUCCESS","amountPaise":49900}'

# Replay a webhook (idempotent – same eventId)
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
  -d '{"eventId":"evt_12345","bookingId":"<bookingId>","providerRef":"prov_abc","outcome":"SUCCESS","amountPaise":49900}'
```
---

## Schema Notes
- **Money** is stored as an integer number of paise (`Number`). The API always returns money as a string with two decimal places, e.g. `"499.00"`.
- Each model defines a `toJSON` transform that removes internal fields (`__v`, `passwordHash`) and converts `amountPaise` using `toRupeeString`.
- **Partial Unique Indexes** enforce critical business rules:
  - `Booking` – prevents duplicate active bookings for the same user/centre/test at the same appointment time.
  - `Payment` – ensures only one `SUCCESS` payment per booking.
- **WebhookEvent** – stores each incoming webhook `eventId`. Duplicate `eventId`s are detected and reported as `DUPLICATE` without side‑effects.

---

## Booking State Machine
| State          | Description                                    | Transitions                                    |
|----------------|------------------------------------------------|-----------------------------------------------|
| `PENDING`      | Booking created, awaiting payment.             | → `CONFIRMED` (SUCCESS), → `FAILED` (FAILED), → `CANCELLED` (user cancel) |
| `CONFIRMED`    | Payment succeeded, booking confirmed.          | → `COMPLETED` (post‑appointment, not in Phase 1) |
| `FAILED`       | Payment failed.                                 | → `CANCELLED` (user may cancel) |
| `CANCELLED`    | User or admin cancelled before completion.     | Terminal – no further transitions |

All state changes are performed atomically with `findOneAndUpdate` queries that include the current state in the filter, guaranteeing race‑free transitions.

---

## Assumptions & Decisions
- The client supplies the payment outcome (`SUCCESS` or `FAILED`). No refund flow is implemented.
- Only **one** diagnostic test per booking (simplifies the model).
- `X‑Webhook‑Secret` is compared using a timing‑safe check; it is **not** an HMAC.
- No pagination, rate‑limiting, or background job queues are added (deferred to later phases).
- All error responses follow the shape `{ "error": { "code": "...", "message": "...", "details": [] } }`.
- Admin can view all bookings/payments; regular users can only view their own resources (404 otherwise).

---

## Later (Deferred) Items
- Redis caching
- Celery or any background job queue
- Docker & docker‑compose configuration
- Swagger / OpenAPI documentation
- Unit & integration tests
- Structured logging (pino, winston, request‑id middleware)
- Pagination for list endpoints
- Rate limiting
- Retry handling for webhook processing (back‑off, retry queue)
- Idempotency for other mutable endpoints (e.g., centre creation)
- Micro‑service decomposition
- GraphQL API
- TypeScript migration
- Deployment CI/CD pipelines

---

## License
MIT © 2026
