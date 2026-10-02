import asyncio
from datetime import datetime, timezone
from sqlalchemy import select, update
from app.worker.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.deal import Deal, DealStatus


def run_async(coro):
    """Helper to run async code in Celery sync tasks."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.worker.tasks.expire_deals")
def expire_deals():
    """Mark deals as expired when their end_at has passed."""
    async def _run():
        async with AsyncSessionLocal() as db:
            now = datetime.now(timezone.utc)
            await db.execute(
                update(Deal)
                .where(
                    Deal.status == DealStatus.active,
                    Deal.ends_at.isnot(None),
                    Deal.ends_at < now,
                )
                .values(status=DealStatus.expired)
            )
            await db.commit()
    run_async(_run())
    return "Deals expired"


@celery_app.task(name="app.worker.tasks.activate_scheduled_deals")
def activate_scheduled_deals():
    """Activate deals whose start_at has passed."""
    async def _run():
        async with AsyncSessionLocal() as db:
            now = datetime.now(timezone.utc)
            await db.execute(
                update(Deal)
                .where(
                    Deal.status == DealStatus.scheduled,
                    Deal.starts_at.isnot(None),
                    Deal.starts_at <= now,
                )
                .values(status=DealStatus.active)
            )
            await db.commit()
    run_async(_run())
    return "Scheduled deals activated"


@celery_app.task(name="app.worker.tasks.send_push_notification")
def send_push_notification(user_id: str, title: str, body: str, data: dict = None):
    """Send FCM push notification to a user (stub — integrate with Firebase)."""
    # TODO: Integrate with Firebase Admin SDK
    print(f"[PUSH] to {user_id}: {title} — {body}")
    return "sent"
