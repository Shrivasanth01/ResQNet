import time
from typing import Dict, Any

class PerformanceMetricsCollector:
    def __init__(self):
        self.total_packets_ingested: int = 0
        self.total_packets_rejected: int = 0
        self.total_db_writes: int = 0
        self.total_processing_time_ms: float = 0.0
        self.last_ingest_time_ms: float = 0.0

    def record_ingest(self, duration_ms: float, success: bool):
        if success:
            self.total_packets_ingested += 1
            self.total_db_writes += 1
        else:
            self.total_packets_rejected += 1
        self.total_processing_time_ms += duration_ms
        self.last_ingest_time_ms = duration_ms

    def get_summary(self) -> Dict[str, Any]:
        total = self.total_packets_ingested + self.total_packets_rejected
        avg_ms = (self.total_processing_time_ms / total) if total > 0 else 0.0
        return {
            "totalPacketsProcessed": total,
            "successfulIngests": self.total_packets_ingested,
            "rejectedPackets": self.total_packets_rejected,
            "totalDbWrites": self.total_db_writes,
            "averageProcessingTimeMs": round(avg_ms, 3),
            "lastProcessingTimeMs": round(self.last_ingest_time_ms, 3)
        }

metrics_collector = PerformanceMetricsCollector()
