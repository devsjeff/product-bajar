import uuid
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, Float, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Review(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "reviews"

    store_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    rating: Mapped[float] = mapped_column(Float)  # 1.0 - 5.0
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_verified_purchase: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    store: Mapped["Store"] = relationship("Store", back_populates="reviews")
    user: Mapped["User"] = relationship("User", back_populates="reviews")

    def __repr__(self):
        return f"<Review store={self.store_id} rating={self.rating}>"


class Notification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(50))  # deal_alert, new_store, review, etc.
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    data: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # JSON string with extra data
