# Edge AI Battery Diagnostics

Raspberry Pi based battery diagnostics system with local telemetry, battery-health analytics, and an on-device LLM report generator. The dashboard is an interactive project guide inspired by portfolio-style engineering pages: live metrics, architecture blocks, model details, hardware notes, and setup instructions in one UI.

The project runs in simulator mode on any computer, then can be moved to a Raspberry Pi with an INA219/INA226 current sensor and a temperature sensor.

## What It Does

- Reads voltage, current, power, and temperature.
- Stores telemetry locally in SQLite.
- Estimates capacity in mAh and Wh from charge/discharge sessions.
- Computes battery health from measured vs rated capacity.
- Detects common battery issues with deterministic rules.
- Uses a local small language model through Ollama or llama.cpp to explain results.
- Serves a local dashboard with live charts and reports.
- Includes a LoRA fine-tuning pipeline for improving diagnostic report style.

## Hardware

Minimum demo:

- Raspberry Pi 4/5 or laptop
- No hardware required in `simulated` mode

Recommended real hardware:

- Raspberry Pi 5 8GB
- INA219 or INA226 voltage/current sensor
- DS18B20 or BME280 temperature sensor
- Proper battery holder, BMS, fuse, and load/charger module


## Quick Start

```powershell
scripts\setup_windows.ps1
scripts\run_windows.ps1
```

Open:

```text
http://127.0.0.1:8000
```

On Linux/Raspberry Pi:

```bash
bash scripts/setup_pi.sh
bash scripts/run_pi.sh
```

## Run With Ollama

The project uses Ollama by default. Pull the small model:

```bash
ollama pull qwen3:0.6b
```

Start the app with:

```bash
BATTERY_AI_LLM_PROVIDER=ollama BATTERY_AI_MODEL=qwen3:0.6b python -m edge_battery_ai.server
```

If Ollama is unavailable, the app falls back to a deterministic local report so the dashboard still works offline.

## Use Real Sensors

Set:

```bash
BATTERY_AI_SENSOR=ina219
```

Install optional sensor libraries on Raspberry Pi:

```bash
pip install adafruit-circuitpython-ina219
```

Then run:

```bash
BATTERY_AI_SENSOR=ina219 python -m edge_battery_ai.server
```

## Fine-Tuning

The folder `training/` contains a LoRA/QLoRA workflow. Start with the sample dataset:

```bash
python training/build_dataset.py
python training/finetune_lora.py --model Qwen/Qwen3-0.6B --dataset training/data/battery_reports.jsonl
```

Fine-tuning is usually too slow directly on Raspberry Pi. Use Colab, Kaggle, a school GPU, or your laptop if it has a supported GPU. After fine-tuning, export/merge the adapter and quantize to GGUF for Raspberry Pi inference.

Fine-tuning is optional. The working edge intelligence path is:

```text
sensor telemetry -> deterministic analytics -> local LLM explanation
```

## Documentation

Read the full project guide:

- `docs/FUNCTIONALITY.md`

## Project Layout

```text
edge_battery_ai/
  analytics.py       Battery health math and anomaly detection
  config.py          Environment-driven settings
  llm.py             Ollama/llama.cpp-compatible report generator
  sensors.py         Simulator and real sensor adapters
  server.py          FastAPI app
  storage.py         SQLite telemetry/session storage
  static/            Dashboard
training/
  build_dataset.py   Creates starter diagnostic dataset
  finetune_lora.py   LoRA fine-tuning script
tests/
  test_analytics.py
```
