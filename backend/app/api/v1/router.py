from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, stores, products, deals, search

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(stores.router)
api_router.include_router(products.router)
api_router.include_router(deals.router)
api_router.include_router(search.router)
