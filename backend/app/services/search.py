import uuid
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, and_, or_, Float, cast
from sqlalchemy.orm import selectinload
from geoalchemy2.functions import ST_DWithin, ST_Distance, ST_MakePoint, ST_SetSRID
from app.models.store import Store, StoreStatus
from app.models.product import Product, ProductStatus
from app.schemas.store import StoreSearchResult
from app.schemas.product import ProductSearchResult
from app.core.redis import cache
import json


async def search_stores(
    db: AsyncSession,
    lat: float,
    lng: float,
    radius_km: float = 10.0,
    query: Optional[str] = None,
    category: Optional[str] = None,
    min_rating: Optional[float] = None,
    sort_by: str = "distance",
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[dict], int]:
    """
    Search stores by proximity with optional keyword and rating filters.
    Returns stores sorted by distance (nearest first) + rating.
    """
    cache_key = f"search:stores:{lat}:{lng}:{radius_km}:{query}:{category}:{min_rating}:{sort_by}:{page}:{limit}"
    cached = await cache.get(cache_key)
    if cached:
        return cached["items"], cached["total"]

    # User location as PostGIS point
    user_point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    radius_meters = radius_km * 1000

    stmt = (
        select(
            Store,
            ST_Distance(Store.location, user_point).label("distance_m"),
        )
        .where(
            Store.status == StoreStatus.active,
            ST_DWithin(Store.location, user_point, radius_meters),
        )
        .options(selectinload(Store.photos))
    )

    if query:
        q = f"%{query.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Store.name).like(q),
                func.lower(Store.description).like(q),
            )
        )

    if category:
        stmt = stmt.where(Store.category == category)

    if min_rating is not None:
        stmt = stmt.where(Store.rating_avg >= min_rating)

    # Count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    # Sort
    if sort_by == "rating":
        stmt = stmt.order_by(Store.rating_avg.desc(), text("distance_m ASC"))
    elif sort_by == "relevance" and query:
        stmt = stmt.order_by(text("distance_m ASC"), Store.rating_avg.desc())
    else:  # default: distance
        stmt = stmt.order_by(text("distance_m ASC"), Store.rating_avg.desc())

    stmt = stmt.offset((page - 1) * limit).limit(limit)
    results = await db.execute(stmt)
    rows = results.all()

    items = []
    for row in rows:
        store, distance_m = row
        store_dict = StoreSearchResult.model_validate(store).model_dump()
        store_dict["distance_km"] = round(distance_m / 1000, 2) if distance_m else None
        items.append(store_dict)

    await cache.set(cache_key, {"items": items, "total": total}, ttl=60)
    return items, total


async def search_products(
    db: AsyncSession,
    query: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: float = 10.0,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_store_rating: Optional[float] = None,
    sort_by: str = "distance",
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[dict], int]:
    """
    Search products by name/tags across all stores.
    Results include store info and distance when lat/lng provided.
    """
    cache_key = f"search:products:{query}:{lat}:{lng}:{radius_km}:{category}:{sort_by}:{page}:{limit}"
    cached = await cache.get(cache_key)
    if cached:
        return cached["items"], cached["total"]

    q_lower = f"%{query.lower()}%"
    
    stmt = (
        select(Product, Store)
        .join(Store, Product.store_id == Store.id)
        .where(
            Product.status == ProductStatus.active,
            Store.status == StoreStatus.active,
            or_(
                func.lower(Product.name).like(q_lower),
                func.lower(Product.description).like(q_lower),
                func.lower(cast(Product.tags, type_=func.text)).like(q_lower),
                func.lower(Product.category).like(q_lower),
            ),
        )
        .options(selectinload(Product.images))
    )

    distance_label = None
    if lat and lng:
        user_point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        radius_meters = radius_km * 1000
        stmt = stmt.where(ST_DWithin(Store.location, user_point, radius_meters))
        stmt = stmt.add_columns(ST_Distance(Store.location, user_point).label("distance_m"))
        distance_label = True

    if category:
        stmt = stmt.where(Product.category == category)
    if min_price:
        stmt = stmt.where(Product.price >= min_price)
    if max_price:
        stmt = stmt.where(Product.price <= max_price)
    if min_store_rating:
        stmt = stmt.where(Store.rating_avg >= min_store_rating)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    if distance_label:
        if sort_by == "rating":
            stmt = stmt.order_by(Store.rating_avg.desc(), text("distance_m ASC"))
        else:
            stmt = stmt.order_by(text("distance_m ASC"), Store.rating_avg.desc())
    else:
        stmt = stmt.order_by(Store.rating_avg.desc())

    stmt = stmt.offset((page - 1) * limit).limit(limit)
    results = await db.execute(stmt)
    rows = results.all()

    items = []
    for row in rows:
        if distance_label:
            product, store, distance_m = row
        else:
            product, store = row
            distance_m = None

        product_dict = ProductSearchResult.model_validate(product).model_dump()
        product_dict["store_name"] = store.name
        product_dict["store_slug"] = store.slug
        product_dict["store_city"] = store.city
        product_dict["store_rating"] = store.rating_avg
        product_dict["distance_km"] = round(distance_m / 1000, 2) if distance_m else None
        items.append(product_dict)

    await cache.set(cache_key, {"items": items, "total": total}, ttl=60)
    return items, total
