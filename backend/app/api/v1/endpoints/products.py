import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from slugify import slugify
from app.core.database import get_db
from app.core.deps import get_current_seller
from app.core.redis import cache
from app.models.product import Product, ProductImage, ProductStatus
from app.models.store import Store, StoreStatus
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.schemas.common import MessageResponse, PaginatedResponse
from app.utils.storage import save_upload

router = APIRouter(prefix="/stores/{store_id}/products", tags=["Products"])


async def get_owned_store(store_id: uuid.UUID, current_user: User, db: AsyncSession) -> Store:
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    if store.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your store")
    return store


@router.post("", response_model=ProductOut, status_code=201)
async def create_product(
    store_id: uuid.UUID,
    payload: ProductCreate,
    current_user: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_store(store_id, current_user, db)
    base_slug = slugify(payload.name)
    slug = f"{base_slug}-{str(store_id)[:8]}"

    product = Product(
        store_id=store_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
        category=payload.category,
        tags=payload.tags,
        price=payload.price,
        mrp=payload.mrp,
        unit=payload.unit,
        stock_quantity=payload.stock_quantity,
        is_featured=payload.is_featured,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    await cache.delete_pattern(f"search:products:*")
    return ProductOut.model_validate(product)


@router.get("", response_model=PaginatedResponse[ProductOut])
async def list_store_products(
    store_id: uuid.UUID,
    status: Optional[ProductStatus] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product).where(Product.store_id == store_id).options(selectinload(Product.images))
    if status:
        stmt = stmt.where(Product.status == status)
    count = (await db.execute(select(func.count(Product.id)).where(Product.store_id == store_id))).scalar()
    result = await db.execute(stmt.offset((page - 1) * limit).limit(limit).order_by(Product.created_at.desc()))
    products = result.scalars().all()
    return PaginatedResponse.create(items=[ProductOut.model_validate(p) for p in products], total=count, page=page, limit=limit)


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    store_id: uuid.UUID,
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.store_id == store_id)
        .options(selectinload(Product.images))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductOut.model_validate(product)


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    store_id: uuid.UUID,
    product_id: uuid.UUID,
    payload: ProductUpdate,
    current_user: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_store(store_id, current_user, db)
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.store_id == store_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(product, k, v)
    await db.commit()
    await db.refresh(product)
    await cache.delete_pattern(f"search:products:*")
    return ProductOut.model_validate(product)


@router.delete("/{product_id}", response_model=MessageResponse)
async def delete_product(
    store_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_store(store_id, current_user, db)
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.store_id == store_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await db.commit()
    await cache.delete_pattern(f"search:products:*")
    return MessageResponse(message="Product deleted")


@router.post("/{product_id}/images", response_model=ProductOut)
async def upload_product_image(
    store_id: uuid.UUID,
    product_id: uuid.UUID,
    file: UploadFile = File(...),
    alt_text: Optional[str] = None,
    current_user: User = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_store(store_id, current_user, db)
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.store_id == store_id)
        .options(selectinload(Product.images))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    url = await save_upload(file, folder=f"products/{product_id}")
    img = ProductImage(product_id=product_id, url=url, alt_text=alt_text)
    db.add(img)
    if not product.image_url:
        product.image_url = url
    await db.commit()
    await db.refresh(product)
    return ProductOut.model_validate(product)
