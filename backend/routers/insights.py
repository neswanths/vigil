from fastapi import APIRouter, HTTPException
from backend.memory.supabase_client import get_supabase_client

router = APIRouter()

@router.get("/insights")
async def get_insights(mission_id: str):
    supabase = get_supabase_client()
    res = supabase.table("insights").select("*").eq("mission_id", mission_id).order("last_updated", desc=True).execute()
    return {"insights": res.data}

@router.get("/insights/{insight_id}")
async def get_insight(insight_id: str):
    supabase = get_supabase_client()
    res = supabase.table("insights").select("*").eq("id", insight_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Insight not found")
    return {"insight": res.data[0]}
