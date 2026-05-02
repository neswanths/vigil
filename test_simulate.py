import requests
import json

mission_id = "MISS-1777724508-3d28"
recommendation_id = "REC-1680148800-1"
url = "http://127.0.0.1:8000/simulate"
payload = {
    "recommendation_id": recommendation_id,
    "mission_id": mission_id
}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers, timeout=15)
    print(json.dumps(response.json(), indent=4))
except Exception as e:
    print(f"Error: {e}")
