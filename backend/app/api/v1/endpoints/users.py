from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.redis import cache
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserUpdate, SellerRegisterRequest
from app.schemas.common import MessageResponse
from app.utils.storage import save_upload
import uuid

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    await cache.delete(f"user:{current_user.id}")
    return UserOut.model_validate(current_user)


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    url = await save_upload(file, folder="avatars")
    current_user.avatar_url = url
    await db.commit()
    await db.refresh(current_user)
    await cache.delete(f"user:{current_user.id}")
    return UserOut.model_validate(current_user)


@router.post("/me/become-seller", response_model=UserOut)
async def become_seller(
    payload: SellerRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == UserRole.seller:
        raise HTTPException(status_code=400, detail="Already a seller")
    current_user.role = UserRole.seller
    await db.commit()
    await db.refresh(current_user)
    await cache.delete(f"user:{current_user.id}")
    return UserOut.model_validate(current_user)


@router.delete("/me", response_model=MessageResponse)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.is_active = False
    await db.commit()
    await cache.delete(f"user:{current_user.id}")
    return MessageResponse(message="Account deactivated")
