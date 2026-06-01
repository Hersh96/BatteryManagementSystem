from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


class TelemetryReading(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    voltage_v: float
    current_a: float
    power_w: float
    temperature_c: float
    source: str = "simulated"


class SessionSummary(BaseModel):
    session_id: int
    sample_count: int
    started_at: datetime | None
    ended_at: datetime | None
    duration_s: float
    measured_capacity_mah: float
    measured_energy_wh: float
    equivalent_cycles: float
    rated_capacity_mah: float
    rated_energy_wh: float
    health_percent: float
    average_voltage_v: float
    average_current_a: float
    max_temperature_c: float
    min_voltage_v: float
    max_voltage_v: float
    status: Literal["excellent", "good", "degraded", "poor", "unknown"]
    issues: list[str]
    recommendations: list[str]


class AiReport(BaseModel):
    generated_by: str
    report: str
