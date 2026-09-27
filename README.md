# EVE Health Care API

A **full‑stack health‑care booking platform** built with **Node.js (Express)**, **MongoDB**, **Redis**, **Docker**, and **Swagger** documentation.

---

## 📋 Assumptions Made During Development

| # | Assumption | Rationale |
|---|------------|-----------|
| 1 | **MongoDB URI is provided via `.env`** | Enables the same codebase to run locally, in Docker, or in CI without code changes. |
| 2 | **JWT secret & expiry are environment variables** | Keeps authentication keys out of source control and allows per‑environment configuration. |
| 3 | **Rate‑limit only applies to the signup endpoint** | The spec required protecting the public signup route; other routes are protected by JWT and don’t need aggressive throttling. |
| 4 | **Redis is used only for centre‑detail caching** | Caching was the only explicit requirement; extending it to other endpoints is straightforward later. |
| 5 | **All list endpoints return a `{ data, meta }` payload** (centres) or `{ bookings, meta }` (bookings) | Provides a uniform pagination contract across the API. |
| 6 | **Pagination defaults** – `page=1`, `limit=20` | The user confirmed “cool” for these defaults. |
| 7 | **Swagger UI is served at `/docs`** and the OpenAPI spec lives in `src/openapi.yaml`. | Allows anyone to discover the API without needing a separate doc generator. |
| 8 | **Docker Compose runs three services** – `api`, `mongo`, `redis`. | Keeps the development environment isolated and reproducible. |
| 9 | **Tests are written with Jest + Supertest** and run with `npm test`. | This covers HTTP behaviour and is the most common stack for Node.js projects. |
| 10 | **Python FastAPI microservice (optional)** is not part of the core Docker compose; it can be started separately if you need the AI prediction side‑car. | The current project focuses on the booking platform; the FastAPI service is an optional add‑on. |
| 11 | **No TLS/HTTPS in development** – the services run on plain HTTP. | Simplicity for local testing; production should terminate TLS at a reverse proxy/load balancer. |
| 12 | **No dedicated CI/CD pipeline** – you can add one later (GitHub Actions, GitLab CI, etc.). | Out of scope for the proof‑of‑concept, but the Dockerfile and tests make it CI‑ready. |

---

## 🚀 Setup Steps

### 1️⃣ Prerequisites

| Tool | Minimum version | Install command |
|------|----------------|-----------------|
| **Git** | 2.30+ | `brew install git` |
| **Node.js** | 20.x LTS | `brew install node@20` or use `nvm` |
| **Docker & Docker Compose** | Docker 27+, Compose 2.20+ | Download from <https://www.docker.com/products/docker-desktop> |
| **MongoDB Compass** *(optional)* | any | GUI client for inspecting the DB |
| **Redis Insight** *(optional)* | any | GUI client for Redis |
| **Python** (only for the optional FastAPI service) | 3.11+ | `brew install python@3.11` |
| **pip** | latest | `python3 -m ensurepip --upgrade` |

### 2️⃣ Clone the Repository

```bash
git clone <repo-url>
cd EVE-HEALTH-CARE
```

### 3️⃣ Configure Environment Variables

Copy the example file and edit the values that suit your environment.

```bash
cp .env.example .env
```

Edit `.env` (any editor works). Example contents:

```dotenv
# Server
PORT=3000


# JWT
JWT_SECRET=super-secret-key
JWT_EXPIRES_IN=1d

# Webhook
WEBHOOK_SECRET=another-secret
```

### 4️⃣ Start the Stack with Docker (Recommended)

```bash
docker compose up --build
```

What this does:
- Builds the **API image** (`Dockerfile`).
- Starts **MongoDB** (port 27017) and **Redis** (port 6379).
- Maps the API to `localhost:3000`.

You should see logs similar to:
```
api_1   | Server listening on port 3000
mongo_1  | ...
redis_1  | ...
```

### 5️⃣ Verify the API
- **Swagger UI** – open `http://localhost:3000/docs` in a browser.
- **Health check** – `curl http://localhost:3000/health` (should return `{ "status": "ok" }`).

### 6️⃣ Running Locally *without* Docker (if you prefer)

```bash
# Install Node deps
npm install

# (Optional) Install Python deps for the FastAPI side‑car
pip install -r requirements.txt

# Start MongoDB & Redis manually (e.g., via Homebrew services)
brew services start mongodb-community
brew services start redis

# Run the server in development mode (auto‑restart on changes)
npm run dev   # nodemon
```

The server will be reachable at `http://localhost:3000`.

### 7️⃣ Running the Optional FastAPI Prediction Service

```bash
# Inside the repository root (if you created a subfolder for it)
cd fastapi-predictor   # <-- adjust if you placed it elsewhere
uvicorn main:app --reload --port 8000
```

Make sure `FASTAPI_BASE_URL` in `.env` points to `http://localhost:8000`.

### 8️⃣ Execute the Test Suite

```bash
npm test
```
All Jest/Supertest tests should pass (`PASS` status). The test command also generates a coverage report under `coverage/`.

### 9️⃣ Linting & Formatting (optional)

```bash
npm run lint      # runs eslint
npm run format    # runs prettier
```

### 🔟 Stopping the Stack
- **Docker**: `docker compose down` (add `-v` if you want to delete the persisted MongoDB volume).
- **Local services**: `brew services stop mongodb-community && brew services stop redis`.

---

## 📂 Repository Layout

```
EVE-HEALTH-CARE/
├─ Server/
│  ├─ src/
│  │  ├─ app.js               # Express app, routes, middlewares
│  │  ├─ server.js            # HTTP server, DB connection
│  │  ├─ config/              # env loader (dotenv + required checks)
│  │  ├─ lib/                 # logger, redis client, mongoose helper
│  │  ├─ middleware/          # error handler, rate limiter
│  │  ├─ models/              # Mongoose schemas (User, Centre, Booking, …)
│  │  ├─ modules/             # Business logic (centres, bookings, payments)
│  │  ├─ routes/              # Express routers (auth, centres, bookings, payments, docs)
│  │  ├─ openapi.yaml         # OpenAPI spec (served at /docs)
│  │  └─ jobs/                # Background jobs (webhook retry – TODO)
│  ├─ tests/                  # Jest/Supertest tests
│  │   └─ bookings.test.js
│  ├─ Dockerfile
│  ├─ docker-compose.yml
│  ├─ .env.example
│  └─ package.json
├─ requirements.txt            # Python deps for optional FastAPI service
└─ README.md                   # (this file)
```

---

### 🙋‍♂️ Need Help?
- **API not reachable?** Check that the containers are healthy (`docker compose ps`) and that ports 3000, 27017, and 6379 are not in use.
- **Authentication failing?** Verify that `JWT_SECRET` in `.env` matches the value used when generating tokens (sign‑up endpoint returns the token).
- **Swagger UI blank?** Ensure the `openapi.yaml` file is present and that the `docs` router (`src/routes/docs.js`) is mounted in `app.js`.

Feel free to open an issue in the repo or ping me if you hit any roadblocks. Happy coding! 🎉
