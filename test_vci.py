# -*- coding: utf-8 -*-
"""
Test VCI API - Find working endpoints for historical prices
"""

import requests
import json
import time

def get_headers(referer=None):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
    }
    if referer:
        headers["Referer"] = referer
        headers["Origin"] = referer.rstrip("/")
    return headers

def test_apis():
    end_ts = int(time.time())
    start_ts = end_ts - (30 * 86400)  # 30 days
    
    tests = [
        # VCI - Different endpoints
        {
            "name": "VCI Price Symbols (working)",
            "url": "https://trading.vietcap.com.vn/api/price/symbols/getAll",
            "method": "GET"
        },
        {
            "name": "VCI GetByGroup VN30",
            "url": "https://trading.vietcap.com.vn/api/price/symbols/getByGroup?group=VN30",
            "method": "GET"
        },
        # Simplize API
        {
            "name": "Simplize Stock Info",
            "url": "https://api.simplize.vn/api/company/summary/fpt",
            "method": "GET"
        },
        {
            "name": "Simplize Price History",
            "url": "https://simplize.vn/api/historical/quote/fpt",
            "method": "GET"
        },
        # Cafef 
        {
            "name": "Cafef History",
            "url": "https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol=FPT&StartDate=&EndDate=&PageIndex=1&PageSize=30",
            "method": "GET"
        },
        # Fireant
        {
            "name": "Fireant Quotes",
            "url": "https://restv2.fireant.vn/symbols/FPT/historical-quotes?startDate=2024-11-01&endDate=2024-12-23",
            "method": "GET",
            "headers_extra": {"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IkdYdExONzViZlZQakdvNERWdjV4QkZwdEVvSSJ9.eyJpc3MiOiJGaXJlYW50LlRyYWRpbmciLCJhdWQiOiJGaXJlYW50LlRyYWRpbmciLCJleHAiOjE5NDAxMTQ2OTEsIm5iZiI6MTY0MDExNDY5MSwidW5pcXVlX25hbWUiOiJhbm9ueW1vdXMiLCJzdWIiOiJhbm9ueW1vdXMiLCJqdGkiOiJhZGRkNWMwZS1jMDExLTQyNjgtODJiMS05MTJkOWQxYTYyOWMifQ.Pq0x5fxCKYpZ7-8xr8LGQIj-D1TmzOkQ2_mtxPxiZn7EW684XqfbLYKFMaFJNKPxq3k3LXn4LzPpx8MKT2NHjRe7qd-_8YjTk-F8YzHYR6sJvGqYsyqjJmSXZKa_fTVJjfxJBMF0HH59WqM6jOTpXNu3cjvjD4yJYJvnLqU1l2U"}
        },
        # SSI iBoard
        {
            "name": "SSI iBoard Bars",
            "url": f"https://iboard.ssi.com.vn/dchart/api/1.1/bars?resolution=D&symbol=FPT&from={start_ts}&to={end_ts}",
            "method": "GET"
        },
        # VNDirect - alternative
        {
            "name": "VNDirect Prices",
            "url": "https://finfo-api.vndirect.com.vn/v4/stock_prices?sort=date&q=code:FPT~date:gte:2024-11-01&size=50",
            "method": "GET"
        }
    ]
    
    print("Testing APIs for historical stock prices...")
    print("=" * 70)
    print("")
    
    working_apis = []
    
    for test in tests:
        print(f"[{test['name']}]")
        
        try:
            headers = get_headers()
            if "headers_extra" in test:
                headers.update(test["headers_extra"])
            
            if test["method"] == "POST":
                response = requests.post(
                    test["url"],
                    headers=headers,
                    json=test.get("payload"),
                    timeout=15
                )
            else:
                response = requests.get(
                    test["url"],
                    headers=headers,
                    timeout=15
                )
            
            print(f"  Status: {response.status_code}")
            
            if response.ok:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        print(f"  Data: Array with {len(data)} items")
                        if len(data) > 0:
                            sample = str(data[0])[:100]
                            print(f"  Sample: {sample}...")
                            working_apis.append(test['name'])
                    elif isinstance(data, dict):
                        keys = list(data.keys())[:5]
                        print(f"  Data: Dict with keys: {keys}")
                        if 'data' in data and isinstance(data['data'], list):
                            print(f"  data[] has {len(data['data'])} items")
                            if len(data['data']) > 0:
                                working_apis.append(test['name'])
                        elif any(data.values()):
                            working_apis.append(test['name'])
                    print("  >> WORKING!")
                except Exception as e:
                    print(f"  Parse error: {e}")
                    print(f"  Response: {response.text[:100]}...")
            else:
                resp_preview = response.text[:80].replace('\n', ' ')
                print(f"  Error: {resp_preview}")
                
        except Exception as e:
            print(f"  Exception: {e}")
        
        print("")
        time.sleep(0.5)
    
    print("=" * 70)
    print(f"WORKING APIs: {working_apis}")
    print("=" * 70)

if __name__ == "__main__":
    test_apis()
