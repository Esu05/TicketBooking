# SortMyScene — Event Ticket Booking

A full-stack seat reservation and booking system built with the MERN stack.

---

## Project Structure

```
sortmyscene/
├── backend/      # Node.js + Express + MongoDB
└── frontend/     # React + Vite
```

---

## Running Locally

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI

### Backend

```bash
cd backend
cp .env.example .env          # set MONGO_URI and JWT_SECRET
npm install
npm run seed                  # populates 3 sample events with seats
npm run dev                   # starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                   # starts on http://localhost:5173
```

Vite proxies `/api` → `http://localhost:5000`, so no CORS config needed in dev.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/events` | — | List all events with seat counts |
| GET | `/api/events/:id` | — | Event details + full seat list |
| POST | `/api/reserve` | ✓ | Reserve selected seats for 10 min |
| POST | `/api/bookings` | ✓ | Confirm reservation → book seats |

---

## Assumptions

- A single user can reserve seats multiple times (e.g. browsing multiple events), but each reservation is independent and expires after 10 minutes.
- No payment step — booking confirmation is the final action.
- `userId` is derived from the JWT token on every authenticated request; there is no guest booking.
- Seats are auto-generated row-by-row (A1, A2 … B1 …) when seeding.
- MongoDB must be run as a **replica set** (even a single-node one) for multi-document transactions. Atlas free tier supports this out of the box. For local dev with a standalone mongod, use `mongod --replSet rs0` and run `rs.initiate()` once in the mongo shell.

---

## Design Decisions

### Double-Booking Prevention

The core constraint is preventing two users from reserving the same seat concurrently.

**Approach: Mongoose sessions + `findOneAndUpdate` with status filter**

```js
Seat.findOneAndUpdate(
  { eventId, seatNumber, status: 'available' },   // ← atomic condition
  { $set: { status: 'reserved', reservedBy: userId } },
  { session }                                       // ← transaction session
)
```

If two users attempt to reserve the same seat at the same moment, MongoDB's document-level locking ensures only one update succeeds. The other receives `null` back (seat was no longer `available`), and the entire transaction is aborted — no partial reservation is committed.

This is stronger than an application-level check, which has a TOCTOU (time-of-check/time-of-use) race condition.

### Expired Reservation Handling

- `expiresAt` is set to `now + 10 minutes` when a reservation is created.
- A MongoDB **TTL index** on `expiresAt` auto-deletes expired Reservation documents.
- On the frontend, a live countdown timer checks the deadline client-side and pre-emptively resets the UI when it hits zero.
- On the backend, `POST /api/bookings` explicitly checks `reservation.expiresAt < new Date()` and releases seats back to `available` if expired — this guards against any clock drift between client and server.

### State Management

React Hooks only (`useState`, `useEffect`, `useCallback`) — no Redux/Zustand overhead for an app of this scope. Auth state is held in `AuthContext` backed by `localStorage`. The booking flow is driven by a `phase` enum (`select → reserved → booked`).

### Component Architecture

```
App (router + AuthProvider)
├── Navbar
├── Events (list page)
├── EventDetail (seat selection + booking)
│   ├── SeatGrid (visual seat map)
│   └── CountdownTimer (live reservation countdown)
├── Login
└── Register
```
