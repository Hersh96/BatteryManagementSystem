$ErrorActionPreference = "Stop"

Write-Host "Creating virtual environment..."
python -m venv .venv

Write-Host "Installing Python dependencies..."
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

Write-Host "Checking Ollama..."
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
  Write-Host "Ollama is not installed. Install it from https://ollama.com/download, then rerun this script."
  exit 1
}

Write-Host "Downloading qwen3:0.6b..."
ollama pull qwen3:0.6b

Write-Host "Setup complete. Run scripts\run_windows.ps1 to start the app."

