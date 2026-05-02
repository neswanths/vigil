import asyncio
import websockets
import json

async def listen():
    try:
        async with websockets.connect('ws://127.0.0.1:8000/ws') as ws:
            print('Connected', flush=True)
            while True:
                msg = await ws.recv()
                data = json.loads(msg)
                print(f'event_type={data.get("event_type")} agent={data.get("agent")}', flush=True)
                print(f'  payload keys={list(data.get("payload", {}).keys())}', flush=True)
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    try:
        asyncio.run(listen())
    except KeyboardInterrupt:
        pass
