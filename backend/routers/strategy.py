from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.memory.supabase_client import get_supabase_client
from backend.memory.redis_client import get_redis_client
from backend.agents.strategist import simulate_recommendation
from backend.models.schemas import Recommendation, Insight
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class SimulateRequest(BaseModel):
    mission_id: str
    recommendation_id: str

@router.get("/strategy")
async def get_strategy(mission_id: str):
    supabase = get_supabase_client()
    res = supabase.table("recommendations").select("*").eq("mission_id", mission_id).order("rank").execute()
    logger.info("supabase_strategy_select_body mission_id=%s body=%s", mission_id, str(res.data)[:2500])
    return {"recommendations": res.data}

@router.post("/simulate")
async def simulate(req: SimulateRequest):
    supabase = get_supabase_client()
    redis_client = get_redis_client()
    
    cache_key = f"sim:{req.mission_id}:{req.recommendation_id}"
    cached = redis_client.get(cache_key)
    if cached:
        try:
            logger.info("redis_simulation_cache_body mission_id=%s recommendation_id=%s body=%s", req.mission_id, req.recommendation_id, str(cached)[:2500])
            return json.loads(cached)
        except Exception:
            pass
            
    rec_res = supabase.table("recommendations").select("*").eq("id", req.recommendation_id).execute()
    logger.info("supabase_recommendation_select_body mission_id=%s recommendation_id=%s body=%s", req.mission_id, req.recommendation_id, str(rec_res.data)[:2500])
    if not rec_res.data:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    rec = Recommendation(**rec_res.data[0])
    
    ins_res = supabase.table("insights").select("*").eq("mission_id", req.mission_id).execute()
    logger.info("supabase_insights_select_body mission_id=%s body=%s", req.mission_id, str(ins_res.data)[:2500])
    insights = [Insight(**i) for i in ins_res.data]
    
    sim_out = await simulate_recommendation(rec, insights)
    if not sim_out:
        raise HTTPException(status_code=500, detail="Simulation failed")
        
    sim_dict = sim_out.model_dump(mode="json")
    logger.info("simulation_response_body mission_id=%s recommendation_id=%s body=%s", req.mission_id, req.recommendation_id, str(sim_dict)[:2500])
    
    redis_client.set(cache_key, json.dumps(sim_dict), ex=3600)
    
    return sim_dict
