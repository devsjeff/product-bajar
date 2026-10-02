import redis.asyncio as aioredis
from app.core.config import settings
from typing import Optional, Any
import json

_redis: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def close_redis():
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None


class RedisCache:
    def __init__(self, prefix: str = "productbajar"):
        self.prefix = prefix

    def _key(self, key: str) -> str:
        return f"{self.prefix}:{key}"

    async def get(self, key: str) -> Optional[Any]:
        r = await get_redis()
        val = await r.get(self._key(key))
        if val is None:
            return None
        try:
            return json.loads(val)
        except (json.JSONDecodeError, TypeError):
            return val

    async def set(self, key: str, value: Any, ttl: int = 300):
        r = await get_redis()
        serialized = json.dumps(value) if not isinstance(value, str) else value
        await r.setex(self._key(key), ttl, serialized)

    async def delete(self, key: str):
        r = await get_redis()
        await r.delete(self._key(key))

    async def delete_pattern(self, pattern: str):
        r = await get_redis()
        keys = await r.keys(self._key(pattern))
        if keys:
            await r.delete(*keys)

    async def exists(self, key: str) -> bool:
        r = await get_redis()
        return bool(await r.exists(self._key(key)))

    async def incr(self, key: str, ttl: int = 60) -> int:
        r = await get_redis()
        k = self._key(key)
        val = await r.incr(k)
        if val == 1:
            await r.expire(k, ttl)
        return val


cache = RedisCache()
