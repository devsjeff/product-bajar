import uuid
import enum
from typing import Optional, List
from sqlalchemy import String, Boolean, Enum, Text, ForeignKey, Float, Integer, JSON, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class ProductStatus(str, enum.Enum):
    active = "active"
    out_of_stock = "out_of_stock"
    discontinued = "discontinued"


class Product(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "products"

    store_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(300), index=True)
    slug: Mapped[str] = mapped_column(String(320), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # ["spoon", "kitchen", "utensil"]
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    mrp: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., "per piece", "per kg"
    status: Mapped[ProductStatus] = mapped_column(Enum(ProductStatus), default=ProductStatus.active)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    stock_quantity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    store: Mapped["Store"] = relationship("Store", back_populates="products")
    images: Mapped[List["ProductImage"]] = relationship("ProductImage", back_populates="product")

    def __repr__(self):
        return f"<Product {self.name}>"


class ProductImage(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "product_images"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"))
    url: Mapped[str] = mapped_column(String(500))
    alt_text: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped["Product"] = relationship("Product", back_populates="images")
