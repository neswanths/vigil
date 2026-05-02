"""
Quick diagnostic for live mode: tests each agent individually.
Run with: $env:PYTHONPATH="."; c:\vigil\.venv\Scripts\python.exe backend/test_live.py
"""
import asyncio
import logging
import httpx
from backend.config import config, is_mock_mode

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_currents():
    print("\n=== Currents API (live news fetch) ===")
    query = "men's grooming India beard care D2C"
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            "https://api.currentsapi.services/v1/search",
            params={"apiKey": config["CURRENTS_API_KEY"], "keywords": query, "limit": 10}
        )
        data = response.json()
        articles = data.get("news", [])
        print(f"Status: {response.status_code}")
        print(f"Articles returned: {len(articles)}")
        for a in articles[:3]:
            print(f"  - [{a.get('author','?')}] {a.get('title','no title')[:80]}")
        if not articles:
            print(f"  Raw response: {data}")
    return articles

async def test_finnhub():
    print("\n=== Finnhub API (live pricing fetch) ===")
    from datetime import datetime, timezone
    import time
    ts = int(time.time())
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = datetime.fromtimestamp(ts - 7*86400).strftime("%Y-%m-%d")
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            "https://finnhub.io/api/v1/company-news",
            params={"symbol": "HUL", "from": start_date, "to": end_date, "token": config["FINNHUB_API_KEY"]}
        )
        data = response.json()
        count = len(data) if isinstance(data, list) else 0
        print(f"Status: {response.status_code}")
        print(f"News items returned: {count}")
        if isinstance(data, list):
            for item in data[:3]:
                print(f"  - {str(item.get('headline',''))[:80]}")
        else:
            print(f"  Raw response: {data}")
    return data

async def test_news_scanner():
    print("\n=== Full News Scanner Agent (live) ===")
    from backend.agents.news_scanner import scan_news
    result = await scan_news("We are a D2C men's skincare brand deciding whether to launch a beard care range in Q3, competing with Beardo and Man Arden")
    print(f"Articles processed: {result.articles_processed}")
    print(f"Articles skipped:   {result.articles_skipped}")
    print(f"Skip reasons:       {result.skip_reasons}")
    print(f"Signals extracted:  {len(result.signals)}")
    for s in result.signals:
        print(f"  [{s.signal_type}] {s.raw_summary[:80]}")
    return result

async def test_pricing_scout():
    print("\n=== Full Pricing Scout Agent (live) ===")
    from backend.agents.pricing_scout import scan_prices
    result = await scan_prices(["Beardo", "Man Arden", "HUL"])
    print(f"Signals returned: {len(result)}")
    for s in result:
        print(f"  [{s.signal_type}] {s.raw_summary[:80]}")
    return result

async def main():
    print(f"MOCK_MODE={is_mock_mode()}")
    if is_mock_mode():
        print("ERROR: MOCK_MODE is still true. Set MOCK_MODE=false in .env first.")
        return

    articles = await test_currents()
    finnhub_data = await test_finnhub()
    news_result = await test_news_scanner()
    pricing_result = await test_pricing_scout()

    print("\n=== Summary ===")
    print(f"Currents articles fetched:   {len(articles)}")
    print(f"Finnhub items fetched:        {len(finnhub_data) if isinstance(finnhub_data, list) else 0}")
    print(f"News scanner signals:         {len(news_result.signals)}")
    print(f"Pricing scout signals:        {len(pricing_result)}")
    total = len(news_result.signals) + len(pricing_result)
    print(f"Total live signals available: {total}")

if __name__ == "__main__":
    asyncio.run(main())
