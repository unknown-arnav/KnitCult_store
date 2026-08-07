import os
import redis

redis_client = redis.Redis.from_url(
    os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0"),
    decode_responses=True,
    socket_connect_timeout=3,
)
