#!/usr/bin/env bash
set -euo pipefail

echo "Creating virtual environment..."
python3 -m venv .venv

echo "Installing Python dependencies..."
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt

if ! command -v ollama >/dev/null 2>&1; then
  echo "Installing Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
fi

echo "Downloading qwen3:0.6b..."
ollama pull qwen3:0.6b

echo "Optional INA219 support:"
echo ".venv/bin/python -m pip install adafruit-circuitpython-ina219"
echo "Setup complete. Run scripts/run_pi.sh to start the app."

