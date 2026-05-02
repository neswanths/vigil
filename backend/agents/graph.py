from typing import Any

from backend.agents.fast_pipeline import run_fast_mission


class FastGraphCompat:
    """Compatibility shim for older tests/imports.

    The production pipeline is single-pass fast mode. This object preserves the
    previous `create_graph().astream(state)` shape without restoring LangGraph
    or multi-agent execution.
    """

    async def astream(self, state: dict[str, Any]):
        updates = await run_fast_mission(state["mission"])
        yield {
            "fast_mode": {
                "websocket_updates": updates,
                "raw_signals": [],
                "scored_signals": [],
                "insights": [],
                "recommendations": [],
                "agent_status": {"fast_mode": "completed"},
            }
        }


def create_graph() -> FastGraphCompat:
    return FastGraphCompat()
