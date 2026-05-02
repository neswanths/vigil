"""Quick check of the data stored from the live mission."""
from backend.memory.supabase_client import get_supabase_client

sb = get_supabase_client()
mission_id = "MISS-1777714373-c2ce"

res = sb.table("signals").select("id,signal_type,raw_summary,relevance_score,source_name").eq("mission_id", mission_id).execute()
print(f"\n=== Signals ({len(res.data)}) ===")
for r in res.data:
    print(f"  [{r['signal_type']}] rel={r['relevance_score']} src={r['source_name']}")
    print(f"    {r['raw_summary'][:80]}")

res = sb.table("insights").select("id,title,confidence,confidence_delta,flags_for_human_review,status").eq("mission_id", mission_id).execute()
print(f"\n=== Insights ({len(res.data)}) ===")
for r in res.data:
    print(f"  {r['id']}: conf={r['confidence']} delta={r['confidence_delta']} review={r['flags_for_human_review']} status={r['status']}")
    print(f"    {r['title']}")

res = sb.table("recommendations").select("id,title,rank,confidence").eq("mission_id", mission_id).execute()
print(f"\n=== Recommendations ({len(res.data)}) ===")
for r in res.data:
    print(f"  #{r['rank']} {r['title']} (conf={r['confidence']})")
