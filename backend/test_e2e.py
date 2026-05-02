import asyncio
import httpx
import websockets
import json

async def ws_listener():
    try:
        async with websockets.connect("ws://127.0.0.1:8000/ws") as ws:
            print("WS Connected")
            while True:
                msg = await ws.recv()
                data = json.loads(msg)
                print(f"WS Event: {data.get('event_type')}")
    except Exception as e:
        print(f"WS Error: {e}")

async def test_e2e():
    print("Testing e2e flow...")
    
    ws_task = asyncio.create_task(ws_listener())
    await asyncio.sleep(1)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post("http://127.0.0.1:8000/mission", json={
            "raw_input": "We are a D2C men's skincare brand deciding whether to launch a beard care range in Q3 competing with Beardo and Man Arden"
        })
        mission_id = res.json()["mission_id"]
        print(f"Mission started: {mission_id}")
        
        print("Waiting for pipeline to complete...")
        for _ in range(60):
            await asyncio.sleep(2)
            res = await client.get(f"http://127.0.0.1:8000/strategy?mission_id={mission_id}")
            recs = res.json().get("recommendations", [])
            if recs:
                print(f"Got {len(recs)} recommendations")
                break
                
        res = await client.get(f"http://127.0.0.1:8000/signals?mission_id={mission_id}")
        print(f"Signals: {len(res.json()['signals'])}")
        
        res = await client.get(f"http://127.0.0.1:8000/insights?mission_id={mission_id}")
        print(f"Insights: {len(res.json()['insights'])}")
        
        res = await client.get(f"http://127.0.0.1:8000/strategy?mission_id={mission_id}")
        recs = res.json()['recommendations']
        print(f"Recommendations: {len(recs)}")
        
        if recs:
            rec_id = recs[0]['id']
            res = await client.post("http://127.0.0.1:8000/simulate", json={
                "mission_id": mission_id,
                "recommendation_id": rec_id
            })
            print(f"Simulation status: {res.status_code}")
            print(f"Simulation result: {list(res.json().keys()) if res.status_code == 200 else res.text}")
            
    ws_task.cancel()

if __name__ == "__main__":
    asyncio.run(test_e2e())
