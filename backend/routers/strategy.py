from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.memory.supabase_client import get_supabase_client
from backend.memory.redis_client import get_redis_client
from backend.agents.strategist import simulate_recommendation
from backend.models.schemas import Recommendation, Insight
import json

router = APIRouter()

class SimulateRequest(BaseModel):
    mission_id: str
    recommendation_id: str

@router.get("/strategy")
async def get_strategy(mission_id: str):
    supabase = get_supabase_client()
    res = supabase.table("recommendations").select("*").eq("mission_id", mission_id).order("rank").execute()
    return {"recommendations": res.data}

@router.post("/simulate")
async def simulate(req: SimulateRequest):
    supabase = get_supabase_client()
    redis_client = get_redis_client()
    
    cached = redis_client.get(f"sim:{req.recommendation_id}")
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass
            
    rec_res = supabase.table("recommendations").select("*").eq("id", req.recommendation_id).execute()
    if not rec_res.data:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    rec = Recommendation(**rec_res.data[0])
    
    ins_res = supabase.table("insights").select("*").eq("mission_id", req.mission_id).execute()
    insights = [Insight(**i) for i in ins_res.data]
    
    sim_out = await simulate_recommendation(rec, insights)
    if not sim_out:
        raise HTTPException(status_code=500, detail="Simulation failed")
        
    sim_dict = sim_out.model_dump(mode="json")
    
    redis_client.set(f"sim:{req.recommendation_id}", json.dumps(sim_dict), ex=3600)
    
    return sim_dict
