from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.config import settings
from app.services.search import search_stores, search_products
from app.schemas.common import PaginatedResponse
from app.schemas.store import StoreSearchResult, StoreCategory
from app.schemas.product import ProductSearchResult

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/stores", response_model=PaginatedResponse[StoreSearchResult])
async def search_nearby_stores(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius_km: float = Query(10.0, le=100, description="Search radius in km"),
    q: Optional[str] = Query(None, description="Search keyword"),
    category: Optional[StoreCategory] = None,
    min_rating: Optional[float] = Query(None, ge=1, le=5),
    sort_by: str = Query("distance", pattern="^(distance|rating|relevance)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Search nearby stores. Results sorted by nearest first + top rating by default."""
    items, total = await search_stores(
        db=db,
        lat=lat,
        lng=lng,
        radius_km=min(radius_km, settings.MAX_SEARCH_RADIUS_KM),
        query=q,
        category=category.value if category else None,
        min_rating=min_rating,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )
    return PaginatedResponse.create(items=items, total=total, page=page, limit=limit)


@router.get("/products", response_model=PaginatedResponse[ProductSearchResult])
async def search_products_endpoint(
    q: str = Query(..., min_length=1, description="Product search term e.g. spoon, cooker"),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius_km: float = Query(10.0, le=100),
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_store_rating: Optional[float] = Query(None, ge=1, le=5),
    sort_by: str = Query("distance", pattern="^(distance|rating)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Search products by keyword (spoon, cooker, etc). Results show nearest store + top rating."""
    items, total = await search_products(
        db=db,
        query=q,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        category=category,
        min_price=min_price,
        max_price=max_price,
        min_store_rating=min_store_rating,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )
    return PaginatedResponse.create(items=items, total=total, page=page, limit=limit)
