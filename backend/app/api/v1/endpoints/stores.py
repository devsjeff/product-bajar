import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from slugify import slugify
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_seller, get_optional_user
from app.core.redis import cache
from app.models.store import Store, StoreStatus, StorePhoto, SavedStore
from app.models.user import User
from app.schemas.store import StoreCreate, StoreUpdate, StoreOut, StoreSearchResult
from app.schemas.common import MessageResponse, PaginatedResponse
from app.utils.storage import save_upload
from geoalchemy2 import WKTElement

router = APIRouter(prefix="/stores", tags=["Stores"])


def make_location(lat: float, lng: float) -> str:
    return f"POINT({lng} {lat})"


async def get_store_or_404(store_id: uuid.UUID, db: AsyncSession) -> Store:
    result = await db.execute(
        select(Store)
        .where(Store.id == store_id)
        .options(selectinload(Store.photos))
    )
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@router.post("", response_model=StoreOut, status_code=201)
async def create_store(
    payload: StoreCreate,
    current_user: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    base_slug = slugify(payload.name)
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(select(Store).where(Store.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    store = Store(
        owner_id=current_user.id,
        name=payload.name,
        slug=slug,
        description=payload.description,
        category=payload.category,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        latitude=payload.latitude,
        longitude=payload.longitude,
        location=WKTElement(make_location(payload.latitude, payload.longitude), srid=4326),
        phone=payload.phone,
        whatsapp=payload.whatsapp,
        email=payload.email,
        website=payload.website,
        opening_hours=payload.opening_hours.model_dump() if payload.opening_hours else None,
        status=StoreStatus.pending,
    )
    db.add(store)
    await db.commit()
    await db.refresh(store)
    return StoreOut.model_validate(store)


@router.get("", response_model=PaginatedResponse[StoreOut])
async def list_my_stores(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    count = (await db.execute(select(func.count(Store.id)).where(Store.owner_id == current_user.id))).scalar()
    result = await db.execute(
        select(Store)
        .where(Store.owner_id == current_user.id)
        .options(selectinload(Store.photos))
        .offset((page - 1) * limit)
        .limit(limit)
        .order_by(Store.created_at.desc())
    )
    stores = result.scalars().all()
    items = [StoreOut.model_validate(s) for s in stores]
    return PaginatedResponse.create(items=items, total=count, page=page, limit=limit)


@router.get("/{store_id}", response_model=StoreOut)
async def get_store(
    store_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"store:{store_id}"
    cached = await cache.get(cache_key)
    if cached:
        return cached
    store = await get_store_or_404(store_id, db)
    data = StoreOut.model_validate(store)
    await cache.set(cache_key, data.model_dump(), ttl=300)
    return data


@router.patch("/{store_id}", response_model=StoreOut)
async def update_store(
    store_id: uuid.UUID,
    payload: StoreUpdate,
    current_user: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    store = await get_store_or_404(store_id, db)
    if store.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your store")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(store, k, v)

    if payload.latitude and payload.longitude:
        store.location = WKTElement(
            make_location(payload.latitude, payload.longitude), srid=4326
        )
    await db.commit()
    await db.refresh(store)
    await cache.delete(f"store:{store_id}")
    return StoreOut.model_validate(store)


@router.delete("/{store_id}", response_model=MessageResponse)
async def delete_store(
    store_id: uuid.UUID,
    current_user: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    store = await get_store_or_404(store_id, db)
    if store.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your store")
    await db.delete(store)
    await db.commit()
    await cache.delete(f"store:{store_id}")
    return MessageResponse(message="Store deleted")


@router.post("/{store_id}/photos", response_model=StoreOut)
async def upload_store_photo(
    store_id: uuid.UUID,
    file: UploadFile = File(...),
    caption: Optional[str] = None,
    is_cover: bool = False,
    current_user: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    store = await get_store_or_404(store_id, db)
    if store.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your store")
    url = await save_upload(file, folder=f"stores/{store_id}")
    photo = StorePhoto(store_id=store_id, url=url, caption=caption, is_cover=is_cover)
    db.add(photo)
    if is_cover:
        store.cover_image_url = url
    await db.commit()
    await db.refresh(store)
    await cache.delete(f"store:{store_id}")
    return StoreOut.model_validate(store)


@router.post("/{store_id}/save", response_model=MessageResponse)
async def save_store(
    store_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(SavedStore).where(
            SavedStore.user_id == current_user.id,
            SavedStore.store_id == store_id,
        )
    )
    if existing.scalar_one_or_none():
        return MessageResponse(message="Already saved")
    db.add(SavedStore(user_id=current_user.id, store_id=store_id))
    await db.commit()
    return MessageResponse(message="Store saved")


@router.delete("/{store_id}/save", response_model=MessageResponse)
async def unsave_store(
    store_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedStore).where(
            SavedStore.user_id == current_user.id,
            SavedStore.store_id == store_id,
        )
    )
    saved = result.scalar_one_or_none()
    if saved:
        await db.delete(saved)
        await db.commit()
    return MessageResponse(message="Store removed from saved")


@router.get("/saved/list", response_model=PaginatedResponse[StoreOut])
async def list_saved_stores(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count_q = select(func.count(SavedStore.id)).where(SavedStore.user_id == current_user.id)
    count = (await db.execute(count_q)).scalar()
    result = await db.execute(
        select(Store)
        .join(SavedStore, SavedStore.store_id == Store.id)
        .where(SavedStore.user_id == current_user.id)
        .options(selectinload(Store.photos))
        .offset((page - 1) * limit)
        .limit(limit)
    )
    stores = result.scalars().all()
    return PaginatedResponse.create(items=[StoreOut.model_validate(s) for s in stores], total=count, page=page, limit=limit)
