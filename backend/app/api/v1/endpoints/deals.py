import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_seller
from app.core.redis import cache
from app.models.deal import Deal, DealStatus, DealType, SavedDeal
from app.models.store import Store
from app.models.review import Review
from app.models.user import User
from app.schemas.deal import DealCreate, DealUpdate, DealOut, DealListParams, ReviewCreate, ReviewOut
from app.schemas.common import MessageResponse, PaginatedResponse
from app.utils.storage import save_upload
from geoalchemy2.functions import ST_DWithin, ST_Distance, ST_MakePoint, ST_SetSRID

router = APIRouter(tags=["Deals & Reviews"])


# ─── Deals ───────────────────────────────────────────────────────────────────

@router.post("/stores/{store_id}/deals", response_model=DealOut, status_code=201)
async def create_deal(
    store_id: uuid.UUID,
    payload: DealCreate,
    current_user: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    store_result = await db.execute(select(Store).where(Store.id == store_id))
    store = store_result.scalar_one_or_none()
    if not store or store.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Store not found or not yours")

    deal = Deal(
        store_id=store_id,
        **payload.model_dump(),
        status=DealStatus.active if not payload.starts_at or payload.starts_at <= datetime.now(timezone.utc) else DealStatus.scheduled,
    )
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    await cache.delete_pattern("deals:*")
    result = DealOut.model_validate(deal)
    result.store_name = store.name
    result.store_city = store.city
    result.store_rating = store.rating_avg
    return result


@router.get("/deals", response_model=PaginatedResponse[DealOut])
async def list_deals(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: float = Query(20.0, le=100),
    deal_type: Optional[DealType] = None,
    include_expired: bool = Query(False, description="Include old/past trip offers"),
    sort_by: str = Query("created_at", pattern="^(created_at|distance|discount)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    List deals. Set include_expired=true to see past/old trip offers.
    Pass lat/lng to get nearby deals with distances.
    """
    cache_key = f"deals:{lat}:{lng}:{radius_km}:{deal_type}:{include_expired}:{sort_by}:{page}:{limit}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    stmt = select(Deal, Store).join(Store, Deal.store_id == Store.id)

    if not include_expired:
        stmt = stmt.where(Deal.status == DealStatus.active)
    else:
        # Show active + expired (old trip offers)
        stmt = stmt.where(Deal.status.in_([DealStatus.active, DealStatus.expired]))

    if deal_type:
        stmt = stmt.where(Deal.deal_type == deal_type)

    distance_label = False
    if lat and lng:
        user_point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        radius_meters = radius_km * 1000
        stmt = stmt.where(ST_DWithin(Store.location, user_point, radius_meters))
        stmt = stmt.add_columns(ST_Distance(Store.location, user_point).label("distance_m"))
        distance_label = True

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    if sort_by == "distance" and distance_label:
        stmt = stmt.order_by("distance_m")
    elif sort_by == "discount":
        stmt = stmt.order_by(Deal.discount_value.desc())
    else:
        stmt = stmt.order_by(Deal.created_at.desc())

    stmt = stmt.offset((page - 1) * limit).limit(limit)
    results = await db.execute(stmt)
    rows = results.all()

    items = []
    for row in rows:
        if distance_label:
            deal, store, dist_m = row
        else:
            deal, store = row
            dist_m = None
        d = DealOut.model_validate(deal)
        d.store_name = store.name
        d.store_city = store.city
        d.store_rating = store.rating_avg
        d.distance_km = round(dist_m / 1000, 2) if dist_m else None
        items.append(d)

    response = PaginatedResponse.create(items=items, total=total, page=page, limit=limit)
    await cache.set(cache_key, response.model_dump(), ttl=120)
    return response


@router.get("/stores/{store_id}/deals", response_model=PaginatedResponse[DealOut])
async def get_store_deals(
    store_id: uuid.UUID,
    include_expired: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Deal).where(Deal.store_id == store_id)
    if not include_expired:
        stmt = stmt.where(Deal.status == DealStatus.active)
    count = (await db.execute(select(func.count(Deal.id)).where(Deal.store_id == store_id))).scalar()
    deals = (await db.execute(stmt.offset((page - 1) * limit).limit(limit).order_by(Deal.created_at.desc()))).scalars().all()

    store_result = await db.execute(select(Store).where(Store.id == store_id))
    store = store_result.scalar_one_or_none()

    items = []
    for deal in deals:
        d = DealOut.model_validate(deal)
        if store:
            d.store_name = store.name
            d.store_city = store.city
            d.store_rating = store.rating_avg
        items.append(d)
    return PaginatedResponse.create(items=items, total=count, page=page, limit=limit)


@router.patch("/deals/{deal_id}", response_model=DealOut)
async def update_deal(
    deal_id: uuid.UUID,
    payload: DealUpdate,
    current_user: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    store = await db.get(Store, deal.store_id)
    if not store or store.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(deal, k, v)
    await db.commit()
    await db.refresh(deal)
    await cache.delete_pattern("deals:*")
    return DealOut.model_validate(deal)


@router.post("/deals/{deal_id}/save", response_model=MessageResponse)
async def save_deal(
    deal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(SavedDeal).where(SavedDeal.user_id == current_user.id, SavedDeal.deal_id == deal_id)
    )
    if existing.scalar_one_or_none():
        return MessageResponse(message="Already saved")
    db.add(SavedDeal(user_id=current_user.id, deal_id=deal_id))
    # Increment save count
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if deal:
        deal.save_count = (deal.save_count or 0) + 1
    await db.commit()
    return MessageResponse(message="Deal saved")


@router.get("/deals/saved", response_model=PaginatedResponse[DealOut])
async def list_saved_deals(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = (await db.execute(select(func.count(SavedDeal.id)).where(SavedDeal.user_id == current_user.id))).scalar()
    result = await db.execute(
        select(Deal, Store)
        .join(SavedDeal, SavedDeal.deal_id == Deal.id)
        .join(Store, Deal.store_id == Store.id)
        .where(SavedDeal.user_id == current_user.id)
        .offset((page - 1) * limit)
        .limit(limit)
        .order_by(SavedDeal.created_at.desc())
    )
    rows = result.all()
    items = []
    for deal, store in rows:
        d = DealOut.model_validate(deal)
        d.store_name = store.name
        d.store_city = store.city
        d.store_rating = store.rating_avg
        items.append(d)
    return PaginatedResponse.create(items=items, total=count, page=page, limit=limit)


# ─── Reviews ─────────────────────────────────────────────────────────────────

@router.post("/stores/{store_id}/reviews", response_model=ReviewOut, status_code=201)
async def create_review(
    store_id: uuid.UUID,
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not 1.0 <= payload.rating <= 5.0:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    # One review per user per store
    existing = await db.execute(
        select(Review).where(Review.store_id == store_id, Review.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already reviewed this store")

    review = Review(
        store_id=store_id,
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)

    # Recalculate store rating
    store = await db.get(Store, store_id)
    if store:
        new_count = store.rating_count + 1
        new_avg = ((store.rating_avg * store.rating_count) + payload.rating) / new_count
        store.rating_count = new_count
        store.rating_avg = round(new_avg, 2)

    await db.commit()
    await db.refresh(review)
    await cache.delete(f"store:{store_id}")

    out = ReviewOut.model_validate(review)
    out.user_name = current_user.full_name
    out.user_avatar = current_user.avatar_url
    return out


@router.get("/stores/{store_id}/reviews", response_model=PaginatedResponse[ReviewOut])
async def list_reviews(
    store_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    count = (await db.execute(select(func.count(Review.id)).where(Review.store_id == store_id))).scalar()
    result = await db.execute(
        select(Review, User)
        .join(User, Review.user_id == User.id)
        .where(Review.store_id == store_id)
        .offset((page - 1) * limit)
        .limit(limit)
        .order_by(Review.created_at.desc())
    )
    rows = result.all()
    items = []
    for review, user in rows:
        r = ReviewOut.model_validate(review)
        r.user_name = user.full_name
        r.user_avatar = user.avatar_url
        items.append(r)
    return PaginatedResponse.create(items=items, total=count, page=page, limit=limit)
