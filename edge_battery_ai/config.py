from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    sensor: str = os.getenv("BATTERY_AI_SENSOR", "simulated")
    database_path: Path = Path(os.getenv("BATTERY_AI_DB", "battery_ai.sqlite3"))
    rated_capacity_mah: float = float(os.getenv("BATTERY_AI_RATED_CAPACITY_MAH", "5000"))
    rated_voltage_v: float = float(os.getenv("BATTERY_AI_RATED_VOLTAGE_V", "3.7"))
    sample_interval_s: float = float(os.getenv("BATTERY_AI_SAMPLE_INTERVAL_S", "2"))
    llm_provider: str = os.getenv("BATTERY_AI_LLM_PROVIDER", "ollama")
    llm_model: str = os.getenv("BATTERY_AI_MODEL", "qwen3:0.6b")
    ollama_url: str = os.getenv("BATTERY_AI_OLLAMA_URL", "http://127.0.0.1:11434")
    llama_cpp_url: str = os.getenv("BATTERY_AI_LLAMA_CPP_URL", "http://127.0.0.1:8080")


def get_settings() -> Settings:
    return Settings()
