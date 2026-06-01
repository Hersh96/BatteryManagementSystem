# Battery Management System

This is my edge AI battery diagnostics project. The idea is to use a Raspberry Pi as a small local battery testing device instead of depending on a cloud API or an expensive lab setup.

The Pi collects battery readings, stores them locally, calculates useful battery metrics, and then uses a small language model running locally to explain the result in plain English.

I started the project in simulator mode first so I could build the software before wiring the hardware. The same app can later run on a Raspberry Pi with an INA219 or INA226 current/voltage sensor.

## Why I Built This

I wanted a project that connects embedded systems, sensors, data logging, and small language models in one place. Battery health is a good use case because it is practical and measurable. The AI part is not guessing the battery health. The measurements and formulas come first, and the model is used at the end to write a readable diagnosis.

The basic flow is:

```text
battery/device -> sensor readings -> local database -> battery analytics -> local LLM report -> dashboard
```

## What It Does Right Now

- Runs a FastAPI web app locally.
- Shows an interactive project guide and live telemetry dashboard.
- Collects simulated battery readings by default.
- Supports an INA219 sensor path for Raspberry Pi hardware.
- Stores readings in SQLite.
- Calculates measured capacity, energy, equivalent cycles, and health status.
- Flags partial sessions so short tests are not treated like full battery cycles.
- Uses Ollama with `qwen3:0.6b` to generate a local battery report.
- Falls back to a normal rule-based report if the model is not running.
- Includes a starter LoRA fine-tuning workflow for later.

## How I Built It

I built the project in layers:

1. First, I made a simulator so the app could generate battery-like voltage/current data without hardware.
2. Then I added SQLite storage so every reading belongs to a test session.
3. After that, I wrote the analytics code for mAh, Wh, equivalent cycles, health estimate, and warnings.
4. Then I connected a local LLM through Ollama so the app could explain the computed results.
5. Finally, I built the interactive website with linked pages for hardware, telemetry, analytics, model details, and project concepts.

## Running It On My Laptop

On Windows:

```powershell
scripts\setup_windows.ps1
scripts\run_windows.ps1
```

Then open:

```text
http://127.0.0.1:8000
```

The live metrics page is:

```text
http://127.0.0.1:8000/telemetry.html
```

## Running It On Raspberry Pi

On Raspberry Pi or Linux:

```bash
bash scripts/setup_pi.sh
bash scripts/run_pi.sh
```

By default, it still runs in simulator mode. That is intentional because it lets me check the app before connecting real hardware.

## Using The Local Model

I am using Ollama with:

```bash
ollama pull qwen3:0.6b
```

The app uses this by default:

```text
BATTERY_AI_LLM_PROVIDER=ollama
BATTERY_AI_MODEL=qwen3:0.6b
```

The model receives a structured summary from the analytics code. It does not directly calculate battery health. That is handled in `edge_battery_ai/analytics.py`.

## Using Real Sensor Hardware

For real hardware, I plan to use:

- Raspberry Pi 4 or 5
- INA219 or INA226 current/voltage sensor
- Temperature sensor such as DS18B20 or BME280
- Battery holder or USB power path
- BMS/protection circuit
- Fuse and rated load/charger module

To switch from simulator mode to INA219 mode:

```bash
BATTERY_AI_SENSOR=ina219 python -m edge_battery_ai.server
```

On the Pi, the INA219 library can be installed with:

```bash
pip install adafruit-circuitpython-ina219
```

Important note: I should not connect Li-ion or LiPo batteries directly to Raspberry Pi GPIO. The Pi should only read sensor data. The battery path needs proper protection.

## Website Pages

The website is also meant to explain the project, not just show numbers.

- `index.html` - overview and architecture diagram
- `hardware.html` - parts, wiring, and safety notes
- `telemetry.html` - live metrics dashboard
- `analytics.html` - battery math and diagnostic rules
- `model.html` - local LLM report generation
- `concepts.html` - project concepts and code walkthrough

## Code Layout

```text
edge_battery_ai/
  analytics.py       battery math, health estimate, warnings
  config.py          environment settings
  llm.py             Ollama / llama.cpp report generation
  models.py          shared data models
  sensors.py         simulator and INA219 sensor adapter
  server.py          FastAPI app and background collector
  storage.py         SQLite sessions and readings
  static/            interactive website

training/
  build_dataset.py   creates starter report examples
  finetune_lora.py   optional LoRA fine-tuning script

tests/
  test_analytics.py  tests for the battery analytics logic
```

## Fine-Tuning Notes

Fine-tuning is not required for the project to work. The useful version is already:

```text
measurements -> formulas/rules -> local model explanation
```

Later, I can fine-tune the model if I collect enough example battery reports and want the responses to sound more consistent. That would probably be done on Colab, Kaggle, or another GPU machine, not directly on the Raspberry Pi.

## Current Limitation

Right now the app shows the current active test session. A future improvement would be a real device/session history system where I can add multiple devices, set each device's rated capacity, and compare battery tests over time.

