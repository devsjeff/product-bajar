import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.deal import DealStatus, DealType


class DealCreate(BaseModel):
    product_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    deal_type: DealType = DealType.percentage
    discount_value: float = 0
    original_price: Optional[float] = None
    deal_price: Optional[float] = None
    coupon_code: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_recurring: bool = False
    terms: Optional[str] = None


class DealUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deal_type: Optional[DealType] = None
    discount_value: Optional[float] = None
    original_price: Optional[float] = None
    deal_price: Optional[float] = None
    coupon_code: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    status: Optional[DealStatus] = None
    is_recurring: Optional[bool] = None
    terms: Optional[str] = None
    image_url: Optional[str] = None


class DealOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    store_id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    deal_type: DealType
    status: DealStatus
    discount_value: float
    original_price: Optional[float] = None
    deal_price: Optional[float] = None
    coupon_code: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_recurring: bool
    image_url: Optional[str] = None
    terms: Optional[str] = None
    view_count: int
    save_count: int
    created_at: datetime
    # Joined store info
    store_name: Optional[str] = None
    store_city: Optional[str] = None
    store_rating: Optional[float] = None
    distance_km: Optional[float] = None


class DealListParams(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_km: float = 20.0
    deal_type: Optional[DealType] = None
    status: Optional[DealStatus] = None
    include_expired: bool = False   # True to show old/past trip offers
    sort_by: str = "created_at"     # "created_at" | "distance" | "discount"
    page: int = 1
    limit: int = 20


class ReviewCreate(BaseModel):
    rating: float
    comment: Optional[str] = None

    def validate_rating(self):
        if not 1.0 <= self.rating <= 5.0:
            raise ValueError("Rating must be between 1 and 5")


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    store_id: uuid.UUID
    user_id: uuid.UUID
    rating: float
    comment: Optional[str] = None
    is_verified_purchase: bool
    created_at: datetime
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
