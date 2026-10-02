from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int

    @classmethod
    def create(cls, items: List[T], total: int, page: int, limit: int) -> "PaginatedResponse[T]":
        pages = (total + limit - 1) // limit if limit > 0 else 0
        return cls(items=items, total=total, page=page, limit=limit, pages=pages)


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
