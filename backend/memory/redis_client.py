from upstash_redis import Redis
from backend.config import config

def get_redis_client() -> Redis:
    return Redis(url=config["UPSTASH_REDIS_REST_URL"], token=config["UPSTASH_REDIS_REST_TOKEN"])

def test_connection():
    client = get_redis_client()
    client.set("test_key", "test_value", ex=10)
    val = client.get("test_key")
    if val == "test_value":
        print("Redis connection successful.")
    else:
        print(f"Redis test failed. Got: {val}")

if __name__ == "__main__":
    test_connection()
