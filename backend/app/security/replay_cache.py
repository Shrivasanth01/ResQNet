import time
from typing import Dict

class ReplayCacheEngine:
    def __init__(self, max_capacity: int = 10000, ttl_seconds: int = 86400):
        self.max_capacity = max_capacity
        self.ttl_seconds = ttl_seconds
        self._cache: Dict[str, float] = {}

    def has(self, key: str) -> bool:
        if not key:
            return False
        timestamp = self._cache.get(key)
        if timestamp is None:
            return False
        
        if time.time() - timestamp > self.ttl_seconds:
            del self._cache[key]
            return False
            
        return True

    def add(self, key: str) -> None:
        if not key:
            return
            
        if len(self._cache) >= self.max_capacity:
            # Evict oldest key
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]
            
        self._cache[key] = time.time()

    def clear(self) -> None:
        self._cache.clear()

replay_cache = ReplayCacheEngine()
