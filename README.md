# ProductBajar — Full Stack App

**Offline store & product discovery** — Find nearest stores, search products (spoon, cooker…), discover deals, and register as a seller.

---

## 🚀 Quick Start (Full Stack)

```bash
# 1. Clone & configure backend
cd backend
cp .env.example .env

# 2. Start everything (backend + frontend + DB + Redis + Celery)
docker-compose up --build
```

| Service | URL |
|---------|-----|
| **Frontend** (Next.js) | http://localhost:3000 |
| **API** (FastAPI) | http://localhost:8000 |
| **Swagger Docs** | http://localhost:8000/docs |
| **Flower** (Celery) | http://localhost:5555 |

---

## 🖥️ Frontend — Next.js 14

### Tech Stack
| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + CSS Variables |
| State | Zustand (auth) + React Query (server state) |
| Forms | React Hook Form + Zod validation |
| Maps | Leaflet + React Leaflet |
| HTTP | Axios (with auto token refresh) |
| UI | Radix UI + Lucide icons |

### Screens

| Route | Screen |
|---|---|
| `/` | **Home** — categories, top-rated stores, deals, trending products |
| `/search` | **Search** — products & stores with filters (radius, category, sort) |
| `/map` | **Map View** — interactive Leaflet map with store pins + ratings |
| `/deals` | **Deals** — active offers, flash sales, old/past trip offers |
| `/settings` | **Settings** — profile, seller registration, app preferences |
| `/login` | Login with Zod-validated form |
| `/register` | Register new account |
| `/stores/[id]` | **Store Detail** — photos, products, deals, reviews, directions |
| `/stores/create` | Create Store (seller only, GPS location auto-detect) |
| `/seller/dashboard` | **Seller Dashboard** — manage stores, products, deals |

### Run Locally
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## ⚙️ Backend — FastAPI

See [backend/README.md](backend/README.md) for full API docs.

### Key APIs
- `GET /api/v1/search/products?q=spoon&lat=&lng=` → **Nearest + top-rated results**
- `GET /api/v1/deals?include_expired=true` → **Old/past trip offers**
- `POST /api/v1/users/me/become-seller` → **Register as Seller** from Settings
- Full CRUD for stores, products, deals, reviews

---

## 📁 Project Structure

```
Producthunt/
├── docker-compose.yml       ← Full stack orchestration
├── backend/                 ← FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── api/v1/endpoints/
│   │   │   ├── auth.py      ← Register, Login, JWT
│   │   │   ├── users.py     ← Profile, Become Seller
│   │   │   ├── stores.py    ← Store CRUD
│   │   │   ├── products.py  ← Product CRUD
│   │   │   ├── deals.py     ← Deals + Reviews
│   │   │   └── search.py    ← Geo search
│   │   ├── models/          ← SQLAlchemy ORM
│   │   ├── schemas/         ← Pydantic v2
│   │   ├── services/        ← Search algorithm
│   │   └── worker/          ← Celery tasks
│   └── alembic/             ← DB migrations
└── frontend/                ← Next.js 14 frontend
    ├── app/
    │   ├── page.tsx          ← Home
    │   ├── search/           ← Search
    │   ├── map/              ← Map View
    │   ├── deals/            ← Deals
    │   ├── settings/         ← Settings + Seller reg
    │   ├── (auth)/           ← Login/Register
    │   ├── stores/[id]/      ← Store Detail
    │   ├── stores/create/    ← Create Store
    │   └── seller/dashboard/ ← Seller Dashboard
    ├── components/
    │   ├── layout/           ← BottomNav
    │   ├── store/            ← StoreCard
    │   ├── product/          ← ProductCard
    │   ├── deal/             ← DealCard
    │   └── map/              ← MapView (Leaflet)
    ├── lib/
    │   ├── api.ts            ← Axios client (auto-refresh)
    │   ├── types.ts          ← TypeScript types
    │   └── utils.ts          ← cn, formatPrice, etc.
    ├── hooks/
    │   └── useLocation.ts    ← Browser geolocation
    └── store/
        └── authStore.ts      ← Zustand auth store
```
