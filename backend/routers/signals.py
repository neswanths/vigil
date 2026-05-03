from fastapi import APIRouter
from backend.memory.supabase_client import get_supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/signals")
async def get_signals(mission_id: str):
    supabase = get_supabase_client()
    res = supabase.table("signals").select("*").eq("mission_id", mission_id).order("published_at", desc=True).execute()
    logger.info("supabase_signals_select_body mission_id=%s body=%s", mission_id, str(res.data)[:2500])
    return {"signals": res.data}
