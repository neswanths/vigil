import logging
import os
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

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
origins = [
    "https://vigil-amin.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
if allowed_origins_env:
    # also support adding extra origins via ALLOWED_ORIGINS env variable
    origins.extend([o.strip() for o in allowed_origins_env.split(",") if o.strip()])

# remove any trailing slashes from origins as per fetch specs
origins = [o.rstrip("/") for o in origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
