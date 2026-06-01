from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from collections.abc import AsyncIterator

import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .analytics import summarize_session
from .config import get_settings
from .llm import BatteryReportGenerator
from .sensors import Sensor, build_sensor
from .storage import TelemetryStore

settings = get_settings()
store = TelemetryStore(settings.database_path)
sensor: Sensor = build_sensor(settings.sensor)
reporter = BatteryReportGenerator(
    provider=settings.llm_provider,
    model=settings.llm_model,
    ollama_url=settings.ollama_url,
    llama_cpp_url=settings.llama_cpp_url,
)

static_dir = Path(__file__).parent / "static"
collector_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    global collector_task
    store.active_session_id()
    collector_task = asyncio.create_task(_collect_loop())
    try:
        yield
    finally:
        if collector_task:
            collector_task.cancel()


app = FastAPI(title="Edge AI Battery Health Monitor", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
def dashboard() -> FileResponse:
    return FileResponse(static_dir / "index.html")


@app.get("/api/status")
def status() -> dict[str, object]:
    session_id = store.active_session_id()
    return {
        "session_id": session_id,
        "sensor": sensor.name,
        "llm_provider": settings.llm_provider,
        "llm_model": settings.llm_model,
        "rated_capacity_mah": settings.rated_capacity_mah,
    }


@app.post("/api/session/reset")
def reset_session() -> dict[str, int]:
    session_id = store.active_session_id()
    store.close_session(session_id)
    new_session_id = store.create_session()
    return {"session_id": new_session_id}


@app.get("/api/readings")
def readings(limit: int = 120) -> list[dict[str, object]]:
    session_id = store.active_session_id()
    return [reading.model_dump(mode="json") for reading in store.latest_readings(session_id, limit)]


@app.get("/api/summary")
def summary() -> dict[str, object]:
    session_id = store.active_session_id()
    readings_for_session = store.readings_for_session(session_id)
    result = summarize_session(
        session_id=session_id,
        readings=readings_for_session,
        rated_capacity_mah=settings.rated_capacity_mah,
        rated_voltage_v=settings.rated_voltage_v,
    )
    return result.model_dump(mode="json")


@app.get("/api/report")
def report() -> dict[str, object]:
    session_id = store.active_session_id()
    result = summarize_session(
        session_id=session_id,
        readings=store.readings_for_session(session_id),
        rated_capacity_mah=settings.rated_capacity_mah,
        rated_voltage_v=settings.rated_voltage_v,
    )
    return reporter.generate(result).model_dump()


async def _collect_loop() -> None:
    while True:
        session_id = store.active_session_id()
        store.insert_reading(session_id, sensor.read())
        await asyncio.sleep(settings.sample_interval_s)


def main() -> None:
    uvicorn.run("edge_battery_ai.server:app", host="0.0.0.0", port=8000, reload=False)


if __name__ == "__main__":
    main()
