import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import HTTPException, UploadFile
from app.core.config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024  # bytes


async def save_upload(file: UploadFile, folder: str = "uploads") -> str:
    """Save an uploaded file to local storage or S3. Returns the public URL."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    # Read and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"

    if settings.STORAGE_BACKEND == "s3":
        return await _save_to_s3(content, folder, filename, file.content_type)
    else:
        return await _save_locally(content, folder, filename)


async def _save_locally(content: bytes, folder: str, filename: str) -> str:
    upload_dir = Path(settings.LOCAL_UPLOAD_DIR) / folder
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / filename

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    return f"/uploads/{folder}/{filename}"


async def _save_to_s3(content: bytes, folder: str, filename: str, content_type: str) -> str:
    try:
        import boto3
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        key = f"{folder}/{filename}"
        s3.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=key,
            Body=content,
            ContentType=content_type,
            ACL="public-read",
        )
        return f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
