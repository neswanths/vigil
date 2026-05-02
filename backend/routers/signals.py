from fastapi import APIRouter
from backend.memory.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/signals")
async def get_signals(mission_id: str):
    supabase = get_supabase_client()
    res = supabase.table("signals").select("*").eq("mission_id", mission_id).order("published_at", desc=True).execute()
    return {"signals": res.data}
