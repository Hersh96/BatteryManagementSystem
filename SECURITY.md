# Security and Safety

This project is intended for educational battery diagnostics. It does not replace certified battery test equipment.

## Battery Safety

- Do not connect batteries directly to Raspberry Pi GPIO pins.
- Use a protected BMS, fuse, and rated charger/load path.
- Stay within the voltage and current limits of the sensor module.
- Stop a test immediately if the battery swells, leaks, smells unusual, or becomes hot.
- Do not leave Li-ion or LiPo tests unattended.

## Software Safety

- The local LLM explains structured facts. It should not be treated as the source of truth.
- Health calculations come from `edge_battery_ai/analytics.py`.
- Logs and SQLite databases may contain device test data; do not publish them by accident.

