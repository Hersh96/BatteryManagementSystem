#!/usr/bin/env bash
set -euo pipefail

export BATTERY_AI_SENSOR="${BATTERY_AI_SENSOR:-simulated}"
export BATTERY_AI_LLM_PROVIDER="${BATTERY_AI_LLM_PROVIDER:-ollama}"
export BATTERY_AI_MODEL="${BATTERY_AI_MODEL:-qwen3:0.6b}"

.venv/bin/python -m edge_battery_ai.server

