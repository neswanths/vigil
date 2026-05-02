import asyncio
import sys
import httpx
from supabase import create_client, Client
from upstash_redis import Redis
from backend.config import config

async def check_groq():
    return bool(config["GROQ_API_KEY"]), "Configured"

async def check_cerebras():
    return bool(config["CEREBRAS_API_KEY"]), "Configured"

async def check_currents():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.currentsapi.services/v1/search",
                params={"apiKey": config["CURRENTS_API_KEY"], "keywords": "market", "limit": 1}
            )
            data = response.json()
            if "news" in data and len(data["news"]) > 0:
                return True, "OK"
            return False, f"Unexpected response: {data}"
    except Exception as e:
        return False, str(e)

async def check_finnhub():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://finnhub.io/api/v1/company-news",
                params={"symbol": "HUL", "from": "2023-01-01", "to": "2023-01-02", "token": config["FINNHUB_API_KEY"]}
            )
            if response.status_code == 200:
                return True, "OK"
            return False, f"Status code: {response.status_code}"
    except Exception as e:
        return False, str(e)

async def check_supabase():
    try:
        supabase: Client = create_client(config["SUPABASE_URL"], config["SUPABASE_SERVICE_ROLE_KEY"])
        test_id = "test-healthcheck"
        supabase.table("missions").insert({"id": test_id, "raw_input": "test"}).execute()
        supabase.table("missions").delete().eq("id", test_id).execute()
        return True, "OK"
    except Exception as e:
        return False, str(e)

async def check_redis():
    try:
        redis = Redis(url=config["UPSTASH_REDIS_REST_URL"], token=config["UPSTASH_REDIS_REST_TOKEN"])
        redis.set("healthcheck", "ok", ex=10)
        val = redis.get("healthcheck")
        if val == "ok":
            return True, "OK"
        return False, f"Expected 'ok', got {val}"
    except Exception as e:
        return False, str(e)

async def main():
    services = {
        "Groq": check_groq,
        "Cerebras": check_cerebras,
        "Currents API": check_currents,
        "Finnhub": check_finnhub,
        "Supabase": check_supabase,
        "Upstash Redis": check_redis
    }
    
    failures = 0
    results = {}
    
    for name, func in services.items():
        success, message = await func()
        if success:
            print(f"{name.ljust(15)} OK")
        else:
            print(f"{name.ljust(15)} FAILED - {message}")
            failures += 1
            
    if failures > 0:
        print(f"\n{failures} service(s) failed. Stopping. Fix the above before proceeding.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
