from __future__ import annotations

from datetime import datetime, timedelta, timezone

from edge_battery_ai.analytics import summarize_session
from edge_battery_ai.models import TelemetryReading


def test_summarize_session_integrates_capacity() -> None:
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    readings = [
        TelemetryReading(timestamp=start, voltage_v=4.0, current_a=1.0, power_w=4.0, temperature_c=30),
        TelemetryReading(
            timestamp=start + timedelta(hours=1),
            voltage_v=4.0,
            current_a=1.0,
            power_w=4.0,
            temperature_c=31,
        ),
    ]

    summary = summarize_session(1, readings, rated_capacity_mah=2000, rated_voltage_v=3.7)

    assert summary.measured_capacity_mah == 1000
    assert summary.measured_energy_wh == 4
    assert summary.equivalent_cycles == 0.5
    assert summary.health_percent == 50
    assert "Severe capacity loss detected." in summary.issues


def test_empty_session_returns_unknown() -> None:
    summary = summarize_session(1, [], rated_capacity_mah=5000, rated_voltage_v=3.7)

    assert summary.status == "unknown"
    assert summary.sample_count == 0
    assert summary.issues
