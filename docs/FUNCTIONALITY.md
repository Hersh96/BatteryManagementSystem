# Edge AI Battery Diagnostics: Functionality Guide

## Overview

Edge AI Battery Diagnostics is a Raspberry Pi project that measures battery telemetry, estimates battery health, and uses a local small language model to explain the results. The system is designed to run offline with low power requirements.

The project follows the same presentation style as an interactive engineering portfolio page: a project overview, live metrics, clickable architecture blocks, hardware notes, model details, and setup instructions.

## Core Capabilities

### Live Telemetry

The collector records:

- Voltage in volts
- Current in amps
- Power in watts
- Temperature in Celsius
- Timestamp
- Sensor source

The project starts in simulator mode so it can be demonstrated without hardware. On a Raspberry Pi, it can be switched to the INA219 adapter by setting:

```bash
BATTERY_AI_SENSOR=ina219
```

### Battery Analytics

The analytics engine calculates:

- Measured capacity in mAh
- Measured energy in Wh
- Equivalent cycle throughput
- Health percentage against rated capacity
- Maximum temperature
- Minimum and maximum voltage
- Partial-session warnings
- Issue and recommendation lists

Capacity is integrated from current over time:

```text
mAh = sum(current_mA * delta_hours)
```

Energy is integrated from voltage and current:

```text
Wh = sum(voltage * current * delta_hours)
```

### Edge AI Reporting

The local LLM receives structured diagnostic facts from the analytics layer. It does not directly measure the battery and should not invent missing values.

Default model:

```text
qwen3:0.6b through Ollama
```

The report contains:

- Diagnosis
- Evidence
- Recommendation

If Ollama or llama.cpp is unavailable, the app returns a deterministic fallback report so the dashboard stays usable.

### Interactive Dashboard

The dashboard includes:

- Sticky project navigation
- Hero summary and project stats
- Live voltage/current/power/temperature cards
- Canvas telemetry chart
- On-device AI report panel
- Clickable architecture map
- Hardware and setup sections

The dashboard is served by FastAPI at:

```text
http://127.0.0.1:8000
```

## Architecture

```text
Battery or simulated source
  -> sensor adapter
  -> SQLite telemetry database
  -> analytics engine
  -> local LLM report generator
  -> FastAPI dashboard
```

## Hardware Mode

Recommended hardware:

- Raspberry Pi 5 8GB
- INA219 or INA226 current/voltage sensor
- DS18B20 or BME280 temperature sensor
- Protected battery holder
- BMS or charger/protection circuit
- Fuse and rated load module

Important: do not connect Li-ion or LiPo cells directly to Raspberry Pi GPIO.

## Model Setup

The model was downloaded with:

```bash
ollama pull qwen3:0.6b
```

Run the app with:

```bash
BATTERY_AI_LLM_PROVIDER=ollama BATTERY_AI_MODEL=qwen3:0.6b python -m edge_battery_ai.server
```

On Windows, use:

```powershell
scripts\setup_windows.ps1
scripts\run_windows.ps1
```

On Raspberry Pi or Linux, use:

```bash
bash scripts/setup_pi.sh
bash scripts/run_pi.sh
```

## Fine-Tuning Path

Fine-tuning is optional. The project includes:

- `training/build_dataset.py`
- `training/finetune_lora.py`
- `training/merge_and_quantize.md`

The recommended workflow is:

1. Collect real diagnostic sessions.
2. Convert useful examples into instruction/input/output pairs.
3. Fine-tune with LoRA on a GPU machine.
4. Quantize the merged model to GGUF.
5. Deploy the quantized model to Raspberry Pi with llama.cpp.

## Resume Description

Built an edge AI battery diagnostics system on Raspberry Pi that measures voltage, current, power, temperature, charge throughput, estimated capacity, and equivalent cycle count, then uses a local Qwen3 0.6B small language model to generate offline diagnostic reports through an interactive FastAPI dashboard.

