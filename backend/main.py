import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from backend.routers import mission, signals, insights, strategy, ws
from backend.healthcheck import check_currents, check_supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    services = {
        "Currents API": check_currents,
        "Supabase": check_supabase,
    }
    
    logger.info("Running healthchecks on startup...")
    for name, func in services.items():
        success, message = await func()
        if not success:
            raise RuntimeError(f"{name} failed: {message}")
        logger.info(f"{name} OK")
        
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mission.router)
app.include_router(signals.router)
app.include_router(insights.router)
app.include_router(strategy.router)
app.include_router(ws.router)

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
