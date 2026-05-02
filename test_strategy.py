import requests
import json

mission_id = "MISS-1777724508-3d28"
url = f"http://127.0.0.1:8000/strategy?mission_id={mission_id}"

try:
    response = requests.get(url, timeout=10)
    print(json.dumps(response.json(), indent=4))
except Exception as e:
    print(f"Error: {e}")
