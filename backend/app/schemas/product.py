import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.product import ProductStatus


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    price: float
    mrp: Optional[float] = None
    unit: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_featured: bool = False


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    price: Optional[float] = None
    mrp: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[ProductStatus] = None
    stock_quantity: Optional[int] = None
    is_featured: Optional[bool] = None


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    url: str
    alt_text: Optional[str] = None
    order: int


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    store_id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    price: float
    mrp: Optional[float] = None
    unit: Optional[str] = None
    status: ProductStatus
    image_url: Optional[str] = None
    is_featured: bool
    stock_quantity: Optional[int] = None
    images: List[ProductImageOut] = []
    created_at: datetime


class ProductSearchResult(ProductOut):
    store_name: Optional[str] = None
    store_slug: Optional[str] = None
    store_city: Optional[str] = None
    distance_km: Optional[float] = None
    store_rating: Optional[float] = None
