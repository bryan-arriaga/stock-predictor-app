#!/usr/bin/env python3
from app import update_predictions, save_cache
import json
from datetime import datetime

print("Updating cache with current predictions...")
cache = update_predictions()
save_cache(cache)

print(f"Cache updated successfully!")
print(f"New timestamp: {cache['last_updated']}")
print(f"Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}") 