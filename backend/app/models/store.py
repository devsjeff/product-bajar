import uuid
import enum
from typing import Optional, List
from sqlalchemy import String, Boolean, Enum, Text, ForeignKey, Float, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class StoreStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    suspended = "suspended"
    closed = "closed"


class StoreCategory(str, enum.Enum):
    grocery = "grocery"
    kitchen = "kitchen"
    electronics = "electronics"
    clothing = "clothing"
    pharmacy = "pharmacy"
    bakery = "bakery"
    restaurant = "restaurant"
    hardware = "hardware"
    stationery = "stationery"
    toys = "toys"
    sports = "sports"
    furniture = "furniture"
    beauty = "beauty"
    other = "other"


class Store(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "stores"

    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[StoreCategory] = mapped_column(Enum(StoreCategory), default=StoreCategory.other)
    status: Mapped[StoreStatus] = mapped_column(Enum(StoreStatus), default=StoreStatus.pending)

    # Location
    address: Mapped[str] = mapped_column(String(500))
    city: Mapped[str] = mapped_column(String(100), index=True)
    state: Mapped[str] = mapped_column(String(100))
    pincode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    location: Mapped[Optional[str]] = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=True
    )  # PostGIS point for fast geo queries

    # Business info
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    whatsapp: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    opening_hours: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"mon": "9am-9pm", ...}

    # Stats (denormalized for performance)
    rating_avg: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="stores")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="store", lazy="dynamic")
    deals: Mapped[List["Deal"]] = relationship("Deal", back_populates="store", lazy="dynamic")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="store")
    photos: Mapped[List["StorePhoto"]] = relationship("StorePhoto", back_populates="store")
    saved_by: Mapped[List["SavedStore"]] = relationship("SavedStore", back_populates="store")

    def __repr__(self):
        return f"<Store {self.name}>"


class StorePhoto(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "store_photos"

    store_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"))
    url: Mapped[str] = mapped_column(String(500))
    caption: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)

    store: Mapped["Store"] = relationship("Store", back_populates="photos")


class SavedStore(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "saved_stores"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    store_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"))

    user: Mapped["User"] = relationship("User", back_populates="saved_stores")
    store: Mapped["Store"] = relationship("Store", back_populates="saved_by")
