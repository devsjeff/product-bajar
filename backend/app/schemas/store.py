import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.models.store import StoreStatus, StoreCategory


class OpeningHours(BaseModel):
    mon: Optional[str] = None
    tue: Optional[str] = None
    wed: Optional[str] = None
    thu: Optional[str] = None
    fri: Optional[str] = None
    sat: Optional[str] = None
    sun: Optional[str] = None


class StoreCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: StoreCategory = StoreCategory.other
    address: str
    city: str
    state: str
    pincode: Optional[str] = None
    latitude: float
    longitude: float
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    opening_hours: Optional[OpeningHours] = None


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[StoreCategory] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    opening_hours: Optional[OpeningHours] = None
    cover_image_url: Optional[str] = None


class StorePhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    url: str
    caption: Optional[str] = None
    is_cover: bool
    order: int


class StoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    category: StoreCategory
    status: StoreStatus
    address: str
    city: str
    state: str
    pincode: Optional[str] = None
    latitude: float
    longitude: float
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    opening_hours: Optional[Dict[str, Any]] = None
    rating_avg: float
    rating_count: int
    is_featured: bool
    cover_image_url: Optional[str] = None
    photos: List[StorePhotoOut] = []
    created_at: datetime


class StoreSearchResult(StoreOut):
    distance_km: Optional[float] = None  # injected from geo query


class NearbySearchParams(BaseModel):
    lat: float
    lng: float
    radius_km: float = 10.0
    query: Optional[str] = None
    category: Optional[StoreCategory] = None
    min_rating: Optional[float] = None
    sort_by: str = "distance"  # "distance" | "rating" | "relevance"
    page: int = 1
    limit: int = 20
