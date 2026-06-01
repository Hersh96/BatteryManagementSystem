from __future__ import annotations

from datetime import datetime

from .models import SessionSummary, TelemetryReading


def summarize_session(
    session_id: int,
    readings: list[TelemetryReading],
    rated_capacity_mah: float,
    rated_voltage_v: float,
) -> SessionSummary:
    if not readings:
        return SessionSummary(
            session_id=session_id,
            sample_count=0,
            started_at=None,
            ended_at=None,
            duration_s=0,
            measured_capacity_mah=0,
            measured_energy_wh=0,
            equivalent_cycles=0,
            rated_capacity_mah=rated_capacity_mah,
            rated_energy_wh=(rated_capacity_mah / 1000) * rated_voltage_v,
            health_percent=0,
            average_voltage_v=0,
            average_current_a=0,
            max_temperature_c=0,
            min_voltage_v=0,
            max_voltage_v=0,
            status="unknown",
            issues=["No telemetry samples collected."],
            recommendations=["Start a session and collect readings before diagnosing the battery."],
        )

    sorted_readings = sorted(readings, key=lambda item: item.timestamp)
    measured_capacity_mah, measured_energy_wh = _integrate_capacity(sorted_readings)
    rated_energy_wh = (rated_capacity_mah / 1000) * rated_voltage_v
    health_percent = _safe_percent(measured_capacity_mah, rated_capacity_mah)
    equivalent_cycles = measured_capacity_mah / rated_capacity_mah if rated_capacity_mah > 0 else 0

    voltages = [reading.voltage_v for reading in sorted_readings]
    currents = [reading.current_a for reading in sorted_readings]
    temps = [reading.temperature_c for reading in sorted_readings]
    started_at = sorted_readings[0].timestamp
    ended_at = sorted_readings[-1].timestamp
    duration_s = max((ended_at - started_at).total_seconds(), 0)
    capacity_reliable = duration_s >= 1800 or measured_capacity_mah >= rated_capacity_mah * 0.2

    issues, recommendations = diagnose(
        health_percent=health_percent,
        max_temperature_c=max(temps),
        min_voltage_v=min(voltages),
        average_current_a=sum(currents) / len(currents),
        duration_s=duration_s,
        sample_count=len(sorted_readings),
        capacity_reliable=capacity_reliable,
    )

    return SessionSummary(
        session_id=session_id,
        sample_count=len(sorted_readings),
        started_at=started_at,
        ended_at=ended_at,
        duration_s=duration_s,
        measured_capacity_mah=round(measured_capacity_mah, 2),
        measured_energy_wh=round(measured_energy_wh, 3),
        equivalent_cycles=round(equivalent_cycles, 4),
        rated_capacity_mah=rated_capacity_mah,
        rated_energy_wh=round(rated_energy_wh, 3),
        health_percent=round(health_percent, 1),
        average_voltage_v=round(sum(voltages) / len(voltages), 3),
        average_current_a=round(sum(currents) / len(currents), 3),
        max_temperature_c=round(max(temps), 1),
        min_voltage_v=round(min(voltages), 3),
        max_voltage_v=round(max(voltages), 3),
        status=_health_status(health_percent) if capacity_reliable else "unknown",
        issues=issues,
        recommendations=recommendations,
    )


def diagnose(
    health_percent: float,
    max_temperature_c: float,
    min_voltage_v: float,
    average_current_a: float,
    duration_s: float,
    sample_count: int,
    capacity_reliable: bool = True,
) -> tuple[list[str], list[str]]:
    issues: list[str] = []
    recommendations: list[str] = []

    if sample_count < 10:
        issues.append("Telemetry sample count is low.")
        recommendations.append("Collect a longer full charge or discharge session for a reliable estimate.")

    if not capacity_reliable:
        issues.append("Capacity health estimate is based on a partial session.")
        recommendations.append("Run a full charge or discharge cycle before treating health percentage as final.")
    elif health_percent and health_percent < 60:
        issues.append("Severe capacity loss detected.")
        recommendations.append("Replace the battery if the device is used for critical work.")
    elif health_percent and health_percent < 80:
        issues.append("Battery capacity degradation detected.")
        recommendations.append("Avoid heat and fast charging; plan for replacement if runtime matters.")

    if max_temperature_c >= 50:
        issues.append("Unsafe battery temperature observed.")
        recommendations.append("Stop the test, disconnect the battery, and inspect the charger and wiring.")
    elif max_temperature_c >= 43:
        issues.append("Elevated battery temperature observed.")
        recommendations.append("Improve cooling and avoid charging in hot environments.")

    if min_voltage_v < 3.1:
        issues.append("Low voltage condition observed.")
        recommendations.append("Avoid deep discharge because it accelerates cell wear.")

    if duration_s > 600 and abs(average_current_a) < 0.05:
        issues.append("Very low charging or discharge current observed.")
        recommendations.append("Check the cable, charger, load, or protection circuit.")

    if not issues:
        issues.append("No major battery issues detected in this session.")
        recommendations.append("Repeat the test periodically and compare capacity trends over time.")

    return issues, recommendations


def _integrate_capacity(readings: list[TelemetryReading]) -> tuple[float, float]:
    capacity_mah = 0.0
    energy_wh = 0.0

    for previous, current in zip(readings, readings[1:]):
        delta_hours = _hours_between(previous.timestamp, current.timestamp)
        average_current_a = (abs(previous.current_a) + abs(current.current_a)) / 2
        average_voltage_v = (previous.voltage_v + current.voltage_v) / 2
        capacity_mah += average_current_a * 1000 * delta_hours
        energy_wh += average_voltage_v * average_current_a * delta_hours

    return capacity_mah, energy_wh


def _hours_between(start: datetime, end: datetime) -> float:
    return max((end - start).total_seconds(), 0) / 3600


def _safe_percent(value: float, denominator: float) -> float:
    if denominator <= 0:
        return 0
    return max(0, min((value / denominator) * 100, 150))


def _health_status(health_percent: float) -> str:
    if health_percent <= 0:
        return "unknown"
    if health_percent >= 90:
        return "excellent"
    if health_percent >= 80:
        return "good"
    if health_percent >= 60:
        return "degraded"
    return "poor"
