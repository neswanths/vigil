from supabase import create_client, Client
from backend.config import config

def get_supabase_client() -> Client:
    return create_client(config["SUPABASE_URL"], config["SUPABASE_SERVICE_ROLE_KEY"])

def test_connection():
    try:
        client = get_supabase_client()
        res = client.table("missions").select("id").limit(1).execute()
        print("Supabase connection successful.")
    except Exception as e:
        print(f"Supabase test failed: {e}")

if __name__ == "__main__":
    test_connection()
