from __future__ import annotations

import json
import random
from pathlib import Path


OUTPUT_PATH = Path(__file__).parent / "data" / "battery_reports.jsonl"


def main() -> None:
    random.seed(7)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for index in range(240):
        rated = random.choice([3000, 4000, 5000, 10000])
        health = random.randint(45, 102)
        measured = int(rated * health / 100)
        temp = random.randint(29, 55)
        issue = classify_issue(health, temp)
        rows.append(
            {
                "instruction": "Write a concise battery diagnosis from the telemetry facts.",
                "input": (
                    f"Rated capacity: {rated} mAh\n"
                    f"Measured capacity: {measured} mAh\n"
                    f"Health: {health}%\n"
                    f"Max temperature: {temp} C\n"
                    f"Issue: {issue}"
                ),
                "output": build_output(health, measured, rated, temp, issue),
            }
        )

    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        for row in rows:
            file.write(json.dumps(row) + "\n")

    print(f"Wrote {len(rows)} examples to {OUTPUT_PATH}")


def classify_issue(health: int, temp: int) -> str:
    if temp >= 50:
        return "Unsafe battery temperature observed."
    if health < 60:
        return "Severe capacity loss detected."
    if health < 80:
        return "Battery capacity degradation detected."
    if temp >= 43:
        return "Elevated battery temperature observed."
    return "No major battery issues detected."


def build_output(health: int, measured: int, rated: int, temp: int, issue: str) -> str:
    if "Unsafe" in issue:
        diagnosis = "Battery behavior is unsafe because the temperature exceeded a safe operating range."
        recommendation = "Stop the test, disconnect the battery, and inspect the charger, load, and wiring."
    elif "Severe" in issue:
        diagnosis = "Battery condition is poor because the measured capacity is far below the rated capacity."
        recommendation = "Replace the battery if the device needs reliable runtime."
    elif "degradation" in issue:
        diagnosis = "Battery capacity is degraded and runtime will be noticeably reduced."
        recommendation = "Avoid heat and fast charging, and plan for replacement."
    elif "Elevated" in issue:
        diagnosis = "Battery capacity is acceptable, but the session showed elevated temperature."
        recommendation = "Improve cooling and avoid charging in hot environments."
    else:
        diagnosis = "Battery health looks normal for this session."
        recommendation = "Continue normal use and repeat the test periodically."

    return (
        f"Diagnosis: {diagnosis} Evidence: Health is {health}% with {measured} mAh measured "
        f"against {rated} mAh rated capacity, and max temperature was {temp} C. "
        f"Recommendation: {recommendation}"
    )


if __name__ == "__main__":
    main()

