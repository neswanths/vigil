from fastapi import APIRouter
from backend.models.schemas import Mission
from backend.agents.domain import build_domain_context
from backend.agents.fast_pipeline import run_fast_mission
from backend.mission_quality import evaluate_mission_quality
from backend.routers.ws import manager
from backend.memory.supabase_client import get_supabase_client
import uuid
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
router = APIRouter()

async def run_mission_task(mission: Mission):
    supabase = get_supabase_client()

    try:
        updates = await run_fast_mission(mission)
        signals = []
        insights = []
        recommendations = []
        for update in updates:
            await manager.broadcast(update)

            if update["event_type"] == "signal_received":
                signals.append(update["payload"])
            elif update["event_type"] == "insight_updated":
                insights.append(update["payload"])
            elif update["event_type"] == "recommendation_ready":
                recommendations.append(update["payload"])

        try:
            if signals:
                res = supabase.table("signals").upsert(signals).execute()
                logger.info("supabase_signals_upsert_body mission_id=%s body=%s", mission.id, str(res.data)[:2500])
            if insights:
                res = supabase.table("insights").upsert(insights).execute()
                logger.info("supabase_insights_upsert_body mission_id=%s body=%s", mission.id, str(res.data)[:2500])
            if recommendations:
                res = supabase.table("recommendations").upsert(recommendations).execute()
                logger.info("supabase_recommendations_upsert_body mission_id=%s body=%s", mission.id, str(res.data)[:2500])
        except Exception as e:
            logger.error(f"DB save error: {e}")
        return {
            "signals": signals,
            "insights": insights,
            "recommendations": recommendations,
        }
    except Exception as e:
        logger.error(f"Fast mission execution error: {e}")
        await manager.broadcast({
            "event_type": "error",
            "agent": "system",
            "payload": {"message": str(e)},
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return {
            "signals": [],
            "insights": [],
            "recommendations": [],
        }

@router.post("/mission")
async def start_mission(mission_data: dict):
    supabase = get_supabase_client()
    raw_input = mission_data.get("raw_input", "")
    provided_competitors = mission_data.get("competitors", [])
    quality = evaluate_mission_quality(raw_input, mission_data.get("industry", ""), provided_competitors)
    if not quality.should_proceed:
        return {
            "status": "needs_clarification",
            "mission_id": None,
            "quality": quality.model_dump(),
        }

    context = build_domain_context(raw_input, mission_data.get("industry", ""), provided_competitors)
    mission = Mission(
        id=f"MISS-{int(datetime.now().timestamp())}-{str(uuid.uuid4())[:4]}",
        raw_input=raw_input,
        industry=mission_data.get("industry") or context.industry,
        competitors=provided_competitors or context.competitors,
        decision_context=mission_data.get("decision_context", ""),
        timeframe=mission_data.get("timeframe", ""),
        created_at=datetime.now(timezone.utc)
    )
    
    mission_res = supabase.table("missions").insert(mission.model_dump(mode="json")).execute()
    logger.info("supabase_mission_insert_body mission_id=%s body=%s", mission.id, str(mission_res.data)[:2500])
    result = await run_mission_task(mission)
    
    return {
        "status": "started",
        "mission_id": mission.id,
        "quality": quality.model_dump(),
        **result,
    }
