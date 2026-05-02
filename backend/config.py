import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

REQUIRED_ENV_VARS = [
    "GROQ_API_KEY",
    "CEREBRAS_API_KEY",
    "CURRENTS_API_KEY",
    "FINNHUB_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "MOCK_MODE"
]

config = {}

for var in REQUIRED_ENV_VARS:
    val = os.getenv(var)
    if not val:
        raise RuntimeError(f"Missing or empty environment variable: {var}")
    config[var] = val

def is_mock_mode() -> bool:
    return config["MOCK_MODE"].lower() == "true"
