import asyncio
from backend.models.schemas import Mission
from backend.agents.graph import create_graph
import uuid
from datetime import datetime, timezone

async def test_graph():
    mission = Mission(
        id=f"MISS-{int(datetime.now().timestamp())}-{str(uuid.uuid4())[:4]}",
        raw_input="We are a D2C men's skincare brand deciding whether to launch a beard care range in Q3 competing with Beardo and Man Arden",
        industry="D2C Men's Skincare",
        competitors=["Beardo", "Man Arden"],
        decision_context="Product launch",
        timeframe="Q3",
        created_at=datetime.now(timezone.utc)
    )
    graph = create_graph()
    state = {
        "mission": mission,
        "raw_signals": [],
        "scored_signals": [],
        "insights": [],
        "recommendations": [],
        "agent_status": {},
        "websocket_updates": []
    }
    try:
        print("Starting graph...")
        async for event in graph.astream(state):
            print(event)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_graph())
