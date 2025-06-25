import requests
import urllib3

# Disable SSL warnings
urllib3.disable_warnings()

# Test API direkte
url = "http://localhost:8000/api-token-auth/"
data = {
    "username": "admin",
    "password": "Andre1302"
}

try:
    # Force HTTP, not HTTPS
    response = requests.post(url, json=data, verify=False)
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {response.headers}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print(f"\nSUCCESS! Token: {response.json()['token']}")
except Exception as e:
    print(f"Error: {e}")
    
# Alternativ test med urllib
print("\n--- Testing with urllib ---")
import json
import urllib.request

try:
    data_json = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=data_json, headers={'Content-Type': 'application/json'})
    response = urllib.request.urlopen(req)
    result = json.loads(response.read().decode('utf-8'))
    print(f"Success! Token: {result['token']}")
except Exception as e:
    print(f"Error: {e}")