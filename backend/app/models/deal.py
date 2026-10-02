import uuid
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Enum, Text, ForeignKey, Float, Integer, DateTime, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class DealStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    draft = "draft"
    scheduled = "scheduled"


class DealType(str, enum.Enum):
    percentage = "percentage"       # e.g., 20% off
    flat = "flat"                   # e.g., ₹50 off
    bogo = "bogo"                   # buy one get one
    bundle = "bundle"               # combo deal
    trip_offer = "trip_offer"       # old/special trip offers
    seasonal = "seasonal"


class Deal(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "deals"

    store_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)

    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deal_type: Mapped[DealType] = mapped_column(Enum(DealType), default=DealType.percentage)
    status: Mapped[DealStatus] = mapped_column(Enum(DealStatus), default=DealStatus.active)

    # Discount details
    discount_value: Mapped[float] = mapped_column(Numeric(10, 2), default=0)  # % or flat amount
    original_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    deal_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    coupon_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Validity
    starts_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)

    # Media
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Stats
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    save_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    store: Mapped["Store"] = relationship("Store", back_populates="deals")
    saved_by: Mapped[list["SavedDeal"]] = relationship("SavedDeal", back_populates="deal")

    def __repr__(self):
        return f"<Deal {self.title}>"


class SavedDeal(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "saved_deals"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    deal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("deals.id", ondelete="CASCADE"))

    user: Mapped["User"] = relationship("User", back_populates="saved_deals")
    deal: Mapped["Deal"] = relationship("Deal", back_populates="saved_by")
