$ErrorActionPreference = "Stop"

$env:BATTERY_AI_SENSOR = if ($env:BATTERY_AI_SENSOR) { $env:BATTERY_AI_SENSOR } else { "simulated" }
$env:BATTERY_AI_LLM_PROVIDER = if ($env:BATTERY_AI_LLM_PROVIDER) { $env:BATTERY_AI_LLM_PROVIDER } else { "ollama" }
$env:BATTERY_AI_MODEL = if ($env:BATTERY_AI_MODEL) { $env:BATTERY_AI_MODEL } else { "qwen3:0.6b" }

.\.venv\Scripts\python.exe -m edge_battery_ai.server

