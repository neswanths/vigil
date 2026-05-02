import requests
import json

url = "http://localhost:8000/mission"
payload = {
    "raw_input": "We are a D2C men's skincare brand called RawForm planning to launch a beard care range in Q3 2026. Competitors are Beardo, Man Arden, The Man Company. Deciding whether to enter premium above Rs 499 or mid-market at Rs 249 to Rs 349."
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
print(json.dumps(response.json(), indent=4))
