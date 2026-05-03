from fastapi import APIRouter, HTTPException
from backend.memory.supabase_client import get_supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/insights")
async def get_insights(mission_id: str):
    supabase = get_supabase_client()
    res = supabase.table("insights").select("*").eq("mission_id", mission_id).order("last_updated", desc=True).execute()
    logger.info("supabase_insights_select_body mission_id=%s body=%s", mission_id, str(res.data)[:2500])
    return {"insights": res.data}

@router.get("/insights/{insight_id}")
async def get_insight(insight_id: str):
    supabase = get_supabase_client()
    res = supabase.table("insights").select("*").eq("id", insight_id).execute()
    logger.info("supabase_insight_select_body insight_id=%s body=%s", insight_id, str(res.data)[:2500])
    if not res.data:
        raise HTTPException(status_code=404, detail="Insight not found")
    return {"insight": res.data[0]}
