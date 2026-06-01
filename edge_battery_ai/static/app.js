const chart = document.querySelector("#telemetry-chart");
const context = chart.getContext("2d");

const elements = {
  status: document.querySelector("#status-line"),
  statHealth: document.querySelector("#stat-health"),
  statSamples: document.querySelector("#stat-samples"),
  voltage: document.querySelector("#voltage"),
  current: document.querySelector("#current"),
  power: document.querySelector("#power"),
  temperature: document.querySelector("#temperature"),
  capacity: document.querySelector("#capacity"),
  cycles: document.querySelector("#cycles"),
  report: document.querySelector("#ai-report"),
  reportSource: document.querySelector("#report-source"),
  issues: document.querySelector("#issues"),
  recommendations: document.querySelector("#recommendations"),
  refreshReport: document.querySelector("#refresh-report"),
  resetSession: document.querySelector("#reset-session"),
  detailKicker: document.querySelector("#detail-kicker"),
  detailTitle: document.querySelector("#detail-title"),
  detailBody: document.querySelector("#detail-body"),
  detailList: document.querySelector("#detail-list"),
};

const details = {
  sensing: {
    kicker: "Sensor Layer",
    title: "INA219 or simulated telemetry",
    body: "The collector reads voltage, current, calculated power, and temperature. Simulator mode lets the project run on a laptop before the Raspberry Pi wiring is ready.",
    facts: {
      "Python file": "edge_battery_ai/sensors.py",
      "Real sensor": "INA219 I2C adapter",
      "Demo mode": "Deterministic simulated battery curve",
      "Safety": "Use a BMS and protected load path",
    },
  },
  storage: {
    kicker: "Telemetry Store",
    title: "Local SQLite time-series log",
    body: "Every sample is written to a local SQLite database so sessions can be analyzed without a network connection or cloud account.",
    facts: {
      "Python file": "edge_battery_ai/storage.py",
      "Database": "battery_ai.sqlite3",
      "Tables": "sessions, telemetry",
      "Privacy": "All measurements stay local",
    },
  },
  analytics: {
    kicker: "Health Analytics",
    title: "Battery math before AI language",
    body: "The analytics layer integrates current over time for mAh, integrates voltage and current for Wh, estimates health, flags partial sessions, and detects thermal or voltage risks.",
    facts: {
      "Python file": "edge_battery_ai/analytics.py",
      "Capacity": "mAh = current x time",
      "Energy": "Wh = voltage x current x time",
      "Cycles": "Measured throughput / rated capacity",
    },
  },
  llm: {
    kicker: "Local LLM",
    title: "Qwen3 0.6B through Ollama",
    body: "The model receives structured diagnostic facts and writes a concise report. If the model server is unavailable, deterministic reporting keeps the dashboard usable.",
    facts: {
      "Python file": "edge_battery_ai/llm.py",
      "Model": "qwen3:0.6b",
      "Provider": "Ollama or llama.cpp",
      "Prompt rule": "Do not invent missing measurements",
    },
  },
  dashboard: {
    kicker: "Dashboard",
    title: "Interactive technical guide plus live view",
    body: "The interface combines a resume-friendly project explanation with live charts and local AI reports, similar to a public engineering project page.",
    facts: {
      "Frontend": "Plain HTML, CSS, JavaScript",
      "API": "FastAPI JSON routes",
      "Chart": "Canvas telemetry plot",
      "Docs style": "Clickable subsystem cards",
    },
  },
  deployment: {
    kicker: "Pi Deployment",
    title: "One-command setup scripts",
    body: "The repository includes Windows and Raspberry Pi setup scripts that install dependencies, pull the model, and start the app with the right environment variables.",
    facts: {
      "Windows": "scripts/setup_windows.ps1",
      "Linux/Pi": "scripts/setup_pi.sh",
      "Default URL": "http://127.0.0.1:8000",
      "Hardware mode": "BATTERY_AI_SENSOR=ina219",
    },
  },
};

async function getJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

async function refresh() {
  const [status, readings, summary] = await Promise.all([
    getJson("/api/status"),
    getJson("/api/readings?limit=160"),
    getJson("/api/summary"),
  ]);

  elements.status.textContent = `Session ${status.session_id} · ${status.sensor} sensor · ${status.llm_provider} model path`;
  elements.statHealth.textContent = summary.status === "unknown" ? "Partial" : `${summary.health_percent}%`;
  elements.statSamples.textContent = summary.sample_count;
  elements.capacity.textContent = `${Math.round(summary.measured_capacity_mah)} mAh`;
  elements.cycles.textContent = summary.equivalent_cycles.toFixed(4);

  const latest = readings.at(-1);
  if (latest) {
    elements.voltage.textContent = `${latest.voltage_v.toFixed(3)} V`;
    elements.current.textContent = `${latest.current_a.toFixed(3)} A`;
    elements.power.textContent = `${latest.power_w.toFixed(2)} W`;
    elements.temperature.textContent = `${latest.temperature_c.toFixed(1)} C`;
  }

  fillList(elements.issues, summary.issues);
  fillList(elements.recommendations, summary.recommendations);
  drawChart(readings);
}

async function refreshReport() {
  elements.report.textContent = "Generating diagnosis on the local model path...";
  const report = await getJson("/api/report");
  elements.reportSource.textContent = report.generated_by;
  elements.report.textContent = report.report || "No report generated.";
}

function fillList(list, values) {
  list.replaceChildren(...values.map((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    return item;
  }));
}

function drawChart(readings) {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = chart.clientWidth * pixelRatio;
  const height = chart.clientHeight * pixelRatio;
  chart.width = width;
  chart.height = height;
  context.clearRect(0, 0, width, height);

  const padding = 44 * pixelRatio;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  context.strokeStyle = "#d9e3dd";
  context.lineWidth = 1 * pixelRatio;
  for (let index = 0; index <= 4; index += 1) {
    const y = padding + (plotHeight / 4) * index;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  drawSeries(readings.map((row) => row.voltage_v), "#17614a", padding, plotWidth, plotHeight);
  drawSeries(readings.map((row) => row.current_a), "#d2673f", padding, plotWidth, plotHeight);
  drawSeries(readings.map((row) => row.temperature_c / 10), "#315d8a", padding, plotWidth, plotHeight);

  drawLegend(pixelRatio, padding);
}

function drawSeries(values, color, padding, plotWidth, plotHeight) {
  if (values.length < 2) {
    return;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  context.strokeStyle = color;
  context.lineWidth = 2.5 * (window.devicePixelRatio || 1);
  context.beginPath();
  values.forEach((value, index) => {
    const x = padding + (plotWidth * index) / (values.length - 1);
    const y = padding + plotHeight - ((value - min) / range) * plotHeight;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();
}

function drawLegend(pixelRatio, padding) {
  const items = [
    ["Voltage", "#17614a"],
    ["Current", "#d2673f"],
    ["Temp/10", "#315d8a"],
  ];

  context.font = `${12 * pixelRatio}px sans-serif`;
  items.forEach(([label, color], index) => {
    const x = padding + index * 92 * pixelRatio;
    context.fillStyle = color;
    context.fillRect(x, 18 * pixelRatio, 12 * pixelRatio, 12 * pixelRatio);
    context.fillStyle = "#50635d";
    context.fillText(label, x + 18 * pixelRatio, 29 * pixelRatio);
  });
}

function selectDetail(topic) {
  const selected = details[topic];
  elements.detailKicker.textContent = selected.kicker;
  elements.detailTitle.textContent = selected.title;
  elements.detailBody.textContent = selected.body;
  elements.detailList.replaceChildren(...Object.entries(selected.facts).flatMap(([key, value]) => {
    const term = document.createElement("dt");
    term.textContent = key;
    const description = document.createElement("dd");
    description.textContent = value;
    return [term, description];
  }));

  document.querySelectorAll(".system-block").forEach((button) => {
    button.classList.toggle("active", button.dataset.topic === topic);
  });
}

document.querySelectorAll(".system-block").forEach((button) => {
  button.addEventListener("click", () => selectDetail(button.dataset.topic));
});

elements.refreshReport.addEventListener("click", refreshReport);
elements.resetSession.addEventListener("click", async () => {
  await getJson("/api/session/reset", { method: "POST" });
  elements.report.textContent = "Session reset. Collecting new telemetry...";
  await refresh();
});

selectDetail("sensing");
refresh().then(refreshReport).catch((error) => {
  elements.status.textContent = error.message;
});

setInterval(() => {
  refresh().catch((error) => {
    elements.status.textContent = error.message;
  });
}, 2500);
