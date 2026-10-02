# ProductBajar — Full Backend

Offline store & product discovery platform backend.

## Stack
| Layer | Technology |
|-------|-----------|
| API | FastAPI 0.115 (Python 3.12) |
| Database | PostgreSQL 16 + **PostGIS** (geo queries) |
| Cache | Redis 7.4 |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Background jobs | Celery + Celery Beat |
| Job monitoring | Flower |
| File storage | Local disk / AWS S3 |
| Auth | JWT (access + refresh tokens) |
| Container | Docker + Docker Compose |

---

## Quick Start

### 1. Clone & configure
```bash
cd backend
cp .env.example .env
# Edit .env — at minimum change SECRET_KEY
```

### 2. Start everything
```bash
docker-compose up --build
```

Services started:
| Service | URL |
|---------|-----|
| **API** | http://localhost:8000 |
| **Swagger docs** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |
| **Flower** (Celery) | http://localhost:5555 |
| **pgAdmin** (optional) | `docker-compose --profile tools up` → http://localhost:5050 |

---

## API Endpoints

### Auth `/api/v1/auth`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/register` | Register buyer account |
| `POST` | `/login` | Login → access + refresh token |
| `POST` | `/refresh` | Rotate refresh token |
| `POST` | `/logout` | Revoke refresh token |
| `POST` | `/change-password` | Change password |

### Users `/api/v1/users`
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/me` | Get current user profile |
| `PATCH` | `/me` | Update profile |
| `POST` | `/me/avatar` | Upload avatar image |
| `POST` | `/me/become-seller` | **Register as Seller** from settings |
| `DELETE` | `/me` | Deactivate account |

### Search `/api/v1/search`
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/stores?lat=&lng=&q=` | Nearest stores (geo + keyword) |
| `GET` | `/products?q=spoon&lat=&lng=` | **Search products by name** — nearest + top rating first |

### Stores `/api/v1/stores`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Create store (seller only) |
| `GET` | `/` | List my stores |
| `GET` | `/{id}` | Get store detail |
| `PATCH` | `/{id}` | Update store |
| `DELETE` | `/{id}` | Delete store |
| `POST` | `/{id}/photos` | Upload store photos |
| `POST` | `/{id}/save` | Save store to wishlist |
| `GET` | `/saved/list` | List saved stores |

### Products `/api/v1/stores/{store_id}/products`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Add product to store |
| `GET` | `/` | List store products |
| `GET` | `/{id}` | Product detail |
| `PATCH` | `/{id}` | Update product |
| `DELETE` | `/{id}` | Delete product |
| `POST` | `/{id}/images` | Upload product images |

### Deals `/api/v1`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/stores/{id}/deals` | Create deal/offer |
| `GET` | `/deals?lat=&lng=` | List deals near me |
| `GET` | `/deals?include_expired=true` | **View old/past trip offers** |
| `GET` | `/stores/{id}/deals` | Store's deals |
| `PATCH` | `/deals/{id}` | Update deal |
| `POST` | `/deals/{id}/save` | Save deal |
| `GET` | `/deals/saved` | My saved deals |

### Reviews `/api/v1`
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/stores/{id}/reviews` | Add review + auto-recalculate rating |
| `GET` | `/stores/{id}/reviews` | List store reviews |

---

## Search Algorithm

When a user searches for **"spoon"** or **"cooker"**:

1. PostGIS `ST_DWithin` filters stores within the specified radius
2. Full-text LIKE match on `product.name`, `description`, `tags`, `category`
3. `ST_Distance` calculates exact distance
4. Results sorted: **nearest first** → **highest rating** as tiebreaker
5. Results cached in Redis (60s TTL)

---

## Background Tasks (Celery)

| Task | Schedule | Description |
|------|----------|-------------|
| `expire_deals` | Every hour | Marks expired deals as `expired` |
| `activate_scheduled_deals` | Every 5 min | Activates deals whose `starts_at` has passed |
| `send_push_notification` | On demand | Firebase FCM push (stub — integrate FCM) |

---

## Database Schema

```
users ──────────────────┐
  └── refresh_tokens    │
  └── reviews           │
  └── saved_stores      │
  └── saved_deals       │
  └── notifications     │
                        │
stores ◄────────────────┘  (owner_id → users.id)
  └── store_photos
  └── products
       └── product_images
  └── deals
       └── saved_deals
  └── reviews
```

---

## Running Tests

```bash
docker-compose exec api pytest tests/ -v
```

---

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | JWT signing key — **change in production!** |
| `DATABASE_URL` | PostgreSQL async URL |
| `REDIS_URL` | Redis connection URL |
| `STORAGE_BACKEND` | `local` or `s3` |
| `DEFAULT_SEARCH_RADIUS_KM` | Default search radius (10km) |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app entry point
│   ├── api/v1/
│   │   ├── router.py            # API v1 router
│   │   └── endpoints/
│   │       ├── auth.py          # Auth endpoints
│   │       ├── users.py         # User endpoints
│   │       ├── stores.py        # Store CRUD
│   │       ├── products.py      # Product CRUD
│   │       ├── deals.py         # Deals + Reviews
│   │       └── search.py        # Geo search
│   ├── core/
│   │   ├── config.py            # Settings (pydantic)
│   │   ├── database.py          # Async SQLAlchemy
│   │   ├── security.py          # JWT + password hashing
│   │   ├── redis.py             # Redis cache client
│   │   └── deps.py              # FastAPI dependencies
│   ├── models/                  # SQLAlchemy ORM models
│   ├── schemas/                 # Pydantic v2 schemas
│   ├── services/
│   │   └── search.py            # Geo + keyword search logic
│   ├── utils/
│   │   └── storage.py           # File upload (local/S3)
│   └── worker/
│       ├── celery_app.py        # Celery configuration
│       └── tasks.py             # Background tasks
├── alembic/                     # Database migrations
├── tests/                       # Pytest async tests
├── Dockerfile
├── alembic.ini
└── requirements.txt
```
