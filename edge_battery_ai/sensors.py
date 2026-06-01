from __future__ import annotations

import math
import random
import time
from abc import ABC, abstractmethod

from .models import TelemetryReading


class Sensor(ABC):
    name: str

    @abstractmethod
    def read(self) -> TelemetryReading:
        raise NotImplementedError


class SimulatedBatterySensor(Sensor):
    name = "simulated"

    def __init__(self) -> None:
        self.started = time.monotonic()
        self.rng = random.Random(42)

    def read(self) -> TelemetryReading:
        elapsed = time.monotonic() - self.started
        phase = min(elapsed / 900, 1)
        voltage = 3.25 + (1 - math.exp(-phase * 4)) * 0.95
        current = 1.15 - phase * 0.55 + self.rng.uniform(-0.035, 0.035)
        temperature = 28 + math.sin(phase * math.pi) * 9 + self.rng.uniform(-0.4, 0.4)
        power = voltage * current
        return TelemetryReading(
            voltage_v=round(voltage, 3),
            current_a=round(current, 3),
            power_w=round(power, 3),
            temperature_c=round(temperature, 1),
            source=self.name,
        )


class Ina219Sensor(Sensor):
    name = "ina219"

    def __init__(self) -> None:
        try:
            import board
            import busio
            from adafruit_ina219 import INA219
        except ImportError as exc:
            raise RuntimeError(
                "INA219 support requires adafruit-circuitpython-ina219 on Raspberry Pi."
            ) from exc

        i2c_bus = busio.I2C(board.SCL, board.SDA)
        self.ina219 = INA219(i2c_bus)

    def read(self) -> TelemetryReading:
        voltage = float(self.ina219.bus_voltage)
        current = float(self.ina219.current) / 1000
        power = voltage * current
        return TelemetryReading(
            voltage_v=round(voltage, 3),
            current_a=round(current, 3),
            power_w=round(power, 3),
            temperature_c=25.0,
            source=self.name,
        )


def build_sensor(sensor_name: str) -> Sensor:
    if sensor_name == "simulated":
        return SimulatedBatterySensor()
    if sensor_name == "ina219":
        return Ina219Sensor()
    raise ValueError(f"Unsupported sensor: {sensor_name}")

