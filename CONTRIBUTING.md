# Contributing

Thanks for improving Edge AI Battery Diagnostics.

## Local Development

```bash
python -m pip install -r requirements.txt
python -m pytest
python -m edge_battery_ai.server
```

Open `http://127.0.0.1:8000`.

## Pull Request Checklist

- Keep sensor and analytics code deterministic where possible.
- Add tests for health calculations and anomaly rules.
- Do not commit generated databases, logs, model weights, or GGUF files.
- Keep battery safety warnings clear when adding hardware instructions.

