from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path

from .models import TelemetryReading


class TelemetryStore:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self._initialize()

    def create_session(self, label: str = "battery-test") -> int:
        with self._connect() as connection:
            cursor = connection.execute(
                "insert into sessions(label, started_at, active) values (?, ?, 1)",
                (label, datetime.utcnow().isoformat()),
            )
            return int(cursor.lastrowid)

    def active_session_id(self) -> int:
        with self._connect() as connection:
            row = connection.execute(
                "select id from sessions where active = 1 order by id desc limit 1"
            ).fetchone()
        if row:
            return int(row["id"])
        return self.create_session()

    def close_session(self, session_id: int) -> None:
        with self._connect() as connection:
            connection.execute(
                "update sessions set active = 0, ended_at = ? where id = ?",
                (datetime.utcnow().isoformat(), session_id),
            )

    def insert_reading(self, session_id: int, reading: TelemetryReading) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                insert into telemetry(
                    session_id, timestamp, voltage_v, current_a, power_w, temperature_c, source
                )
                values (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    reading.timestamp.isoformat(),
                    reading.voltage_v,
                    reading.current_a,
                    reading.power_w,
                    reading.temperature_c,
                    reading.source,
                ),
            )

    def readings_for_session(self, session_id: int, limit: int | None = None) -> list[TelemetryReading]:
        query = "select * from telemetry where session_id = ? order by timestamp asc"
        parameters: tuple[object, ...] = (session_id,)
        if limit:
            query += " limit ?"
            parameters = (session_id, limit)

        with self._connect() as connection:
            rows = connection.execute(query, parameters).fetchall()

        return [
            TelemetryReading(
                timestamp=datetime.fromisoformat(row["timestamp"]),
                voltage_v=row["voltage_v"],
                current_a=row["current_a"],
                power_w=row["power_w"],
                temperature_c=row["temperature_c"],
                source=row["source"],
            )
            for row in rows
        ]

    def latest_readings(self, session_id: int, limit: int = 120) -> list[TelemetryReading]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                select * from telemetry
                where session_id = ?
                order by timestamp desc
                limit ?
                """,
                (session_id, limit),
            ).fetchall()
        readings = [
            TelemetryReading(
                timestamp=datetime.fromisoformat(row["timestamp"]),
                voltage_v=row["voltage_v"],
                current_a=row["current_a"],
                power_w=row["power_w"],
                temperature_c=row["temperature_c"],
                source=row["source"],
            )
            for row in rows
        ]
        return list(reversed(readings))

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                create table if not exists sessions(
                    id integer primary key autoincrement,
                    label text not null,
                    started_at text not null,
                    ended_at text,
                    active integer not null default 1
                )
                """
            )
            connection.execute(
                """
                create table if not exists telemetry(
                    id integer primary key autoincrement,
                    session_id integer not null,
                    timestamp text not null,
                    voltage_v real not null,
                    current_a real not null,
                    power_w real not null,
                    temperature_c real not null,
                    source text not null,
                    foreign key(session_id) references sessions(id)
                )
                """
            )

