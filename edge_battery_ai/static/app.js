const page = document.body.dataset.page;

async function getJson(url, options){
  const response = await fetch(url, options);
  if(!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

function tag(label, cls){
  return `<span class="tag ${cls}">${label}</span>`;
}

if(page === "overview"){
  const cv = document.getElementById("arch");
  const cx = cv.getContext("2d");
  let W = 0, H = 0, DPR = 1, hov = null, nodes = [], edges = [], parts = [];
  const ND = {
    dut:{lbl:["Device /","Battery"],sub:"pack, phone, USB bank",col:"#69f0ae",rx:.04,ry:.36,rw:.13,rh:.22,grp:"physical"},
    protection:{lbl:["BMS +","Load"],sub:"safe test path",col:"#fb923c",rx:.21,ry:.36,rw:.13,rh:.22,grp:"physical"},
    sensor:{lbl:["INA219","Sensor"],sub:"voltage + current",col:"#b388ff",rx:.38,ry:.20,rw:.13,rh:.24,grp:"sensing"},
    temp:{lbl:["Temp","Probe"],sub:"thermal context",col:"#c084fc",rx:.38,ry:.58,rw:.13,rh:.22,grp:"sensing"},
    collector:{lbl:["Collector","Loop"],sub:"samples every 2 sec",col:"#4ade80",rx:.57,ry:.18,rw:.13,rh:.22,grp:"runtime"},
    sqlite:{lbl:["SQLite","Store"],sub:"sessions + readings",col:"#ffd740",rx:.57,ry:.58,rw:.13,rh:.22,grp:"runtime"},
    analytics:{lbl:["Analytics","Engine"],sub:"mAh, Wh, rules",col:"#00d4ff",rx:.74,ry:.18,rw:.13,rh:.22,grp:"intelligence"},
    llm:{lbl:["Local","LLM"],sub:"Qwen3 report",col:"#c084fc",rx:.74,ry:.58,rw:.13,rh:.22,grp:"intelligence"},
    ui:{lbl:["Interactive","Pages"],sub:"guide + dashboard",col:"#fb923c",rx:.88,ry:.39,rw:.10,rh:.24,grp:"interface"},
  };
  const ED = [
    {f:"dut",t:"protection",lbl:"power path",col:"#69f0ae"},
    {f:"protection",t:"sensor",lbl:"shunt",col:"#fb923c"},
    {f:"protection",t:"temp",lbl:"thermal",col:"#c084fc"},
    {f:"sensor",t:"collector",lbl:"I2C",col:"#b388ff"},
    {f:"temp",t:"collector",lbl:"C",col:"#c084fc"},
    {f:"collector",t:"sqlite",lbl:"insert",col:"#ffd740"},
    {f:"collector",t:"analytics",lbl:"readings",col:"#4ade80"},
    {f:"sqlite",t:"analytics",lbl:"history",col:"#ffd740"},
    {f:"analytics",t:"llm",lbl:"facts JSON",col:"#00d4ff"},
    {f:"analytics",t:"ui",lbl:"metrics",col:"#00d4ff"},
    {f:"llm",t:"ui",lbl:"diagnosis",col:"#c084fc"},
  ];
  const DETAIL = {
    dut:["Device / Battery","The subject under test can be a USB battery pack, phone, smart battery, or protected cell pack. The software measures behavior; it does not magically read private manufacturer data from every device.",["rated capacity","device under test","USB pack","battery cell"]],
    protection:["BMS + Load Path","The protected path keeps the Pi away from raw battery current. Use a BMS, fuse, charger/load module, and sensor rated for the expected current.",["BMS required","fuse","rated load","safety first"]],
    sensor:["Sensor Adapter","The simulated adapter makes the site demo-ready. The INA219 adapter reads bus voltage and shunt current from Raspberry Pi I2C.",["INA219","voltage","current","power"]],
    temp:["Temperature Probe","Temperature provides safety context. Heat is one of the clearest signs of battery stress during charge or discharge.",["temperature","thermal warning","safety","optional"]],
    collector:["Collector Loop","The background task reads the sensor periodically and writes each sample into the active session. This is the heartbeat of the edge device.",["async loop","sample interval","TelemetryReading","server.py"]],
    sqlite:["SQLite Telemetry Store","Each session and sample is saved locally so capacity, energy, and trends can be recomputed without cloud storage.",["sessions","telemetry","local data","storage.py"]],
    analytics:["Analytics Engine","Deterministic code integrates current over time, computes Wh and equivalent cycles, flags partial sessions, and produces rule-based issues.",["mAh","Wh","diagnostic rules","analytics.py"]],
    llm:["Local Small Language Model","Qwen3 0.6B runs through Ollama. It explains structured facts from analytics and does not invent measurements.",["qwen3:0.6b","Ollama","prompt contract","fallback report"]],
    ui:["Interactive Project Guide","The website documents the full system while also showing live readings and generated reports from the running service.",["linkable pages","canvas diagram","live API","GitHub-ready"]],
  };

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const box = cv.parentElement.getBoundingClientRect();
    W = box.width; H = Math.round(W * 480 / 1060);
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    cx.setTransform(DPR,0,0,DPR,0,0);
    buildLayout();
  }
  function buildLayout(){
    nodes = Object.entries(ND).map(([id,d]) => ({id,...d,x:d.rx*W,y:d.ry*H,w:d.rw*W,h:d.rh*H}));
    edges = ED.map(e => {
      const f = nodes.find(n => n.id === e.f), t = nodes.find(n => n.id === e.t);
      return {...e,x1:f.x+f.w,y1:f.y+f.h*.5,x2:t.x,y2:t.y+t.h*.5};
    });
    parts = [];
    edges.forEach((_,i) => { for(let j=0;j<3;j++) parts.push({ei:i,t:j/3,spd:.003+Math.random()*.002}); });
  }
  function roundRect(x,y,w,h,r){ cx.beginPath(); cx.moveTo(x+r,y); cx.arcTo(x+w,y,x+w,y+h,r); cx.arcTo(x+w,y+h,x,y+h,r); cx.arcTo(x,y+h,x,y,r); cx.arcTo(x,y,x+w,y,r); cx.closePath(); }
  function draw(){
    cx.clearRect(0,0,W,H);
    cx.fillStyle = "#0c1a0d"; cx.fillRect(0,0,W,H);
    cx.strokeStyle = "rgba(74,222,128,.055)";
    for(let x=0;x<W;x+=32){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,H);cx.stroke();}
    for(let y=0;y<H;y+=32){cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke();}
    drawGroups();
    edges.forEach(e => {
      cx.strokeStyle = e.col; cx.globalAlpha = .42; cx.lineWidth = 2;
      cx.beginPath(); cx.moveTo(e.x1,e.y1);
      const dx = Math.max(36, Math.abs(e.x2-e.x1)*.42);
      cx.bezierCurveTo(e.x1+dx,e.y1,e.x2-dx,e.y2,e.x2,e.y2); cx.stroke();
      drawArrow(e.x2,e.y2,e.col);
      cx.globalAlpha = 1; cx.fillStyle = e.col; cx.font = "10px JetBrains Mono";
      cx.fillText(e.lbl,(e.x1+e.x2)/2-18,(e.y1+e.y2)/2-8);
    });
    parts.forEach(p => {
      const e = edges[p.ei]; p.t = (p.t + p.spd) % 1;
      const x = (1-p.t)*e.x1 + p.t*e.x2, y = (1-p.t)*e.y1 + p.t*e.y2;
      cx.fillStyle = e.col; cx.globalAlpha = .85; cx.beginPath(); cx.arc(x,y,3,0,Math.PI*2); cx.fill(); cx.globalAlpha = 1;
    });
    nodes.forEach(n => {
      const active = hov === n.id;
      cx.shadowColor = active ? n.col : "transparent"; cx.shadowBlur = active ? 18 : 0;
      cx.fillStyle = active ? "#112213" : "#0f1d10"; cx.strokeStyle = active ? n.col : "rgba(74,222,128,.16)"; cx.lineWidth = active ? 2 : 1;
      roundRect(n.x,n.y,n.w,n.h,12); cx.fill(); cx.stroke(); cx.shadowBlur = 0;
      cx.fillStyle = n.col; cx.font = "700 13px Space Mono"; cx.textAlign = "center";
      n.lbl.forEach((line,i) => cx.fillText(line,n.x+n.w/2,n.y+n.h/2-8+i*17));
      cx.fillStyle = "#4a6e52"; cx.font = "10px JetBrains Mono"; cx.fillText(n.sub,n.x+n.w/2,n.y+n.h-14); cx.textAlign = "left";
    });
    requestAnimationFrame(draw);
  }
  function drawGroups(){
    const groups = [
      ["physical","Physical test setup",.025,.10,.32,.78,"#69f0ae"],
      ["sensing","Sensor layer",.365,.10,.17,.78,"#b388ff"],
      ["runtime","Edge runtime",.555,.10,.16,.78,"#4ade80"],
      ["intelligence","Analytics + AI",.725,.10,.16,.78,"#00d4ff"],
      ["interface","Output",.865,.10,.12,.78,"#fb923c"],
    ];
    groups.forEach(([,label,rx,ry,rw,rh,col]) => {
      cx.globalAlpha = .52;
      cx.strokeStyle = col; cx.lineWidth = 1; cx.setLineDash([6,7]);
      roundRect(rx*W,ry*H,rw*W,rh*H,16); cx.stroke(); cx.setLineDash([]);
      cx.globalAlpha = 1; cx.fillStyle = col; cx.font = "10px JetBrains Mono";
      cx.fillText(label,rx*W+14,ry*H+20);
    });
  }
  function drawArrow(x,y,col){
    cx.save(); cx.fillStyle = col; cx.globalAlpha = .85;
    cx.beginPath(); cx.moveTo(x,y); cx.lineTo(x-8,y-4); cx.lineTo(x-8,y+4); cx.closePath(); cx.fill();
    cx.restore();
  }
  cv.addEventListener("mousemove", e => {
    const r = cv.getBoundingClientRect(), x = e.clientX-r.left, y = e.clientY-r.top;
    const hit = nodes.find(n => x>=n.x && x<=n.x+n.w && y>=n.y && y<=n.y+n.h);
    hov = hit ? hit.id : null; cv.style.cursor = hit ? "pointer" : "default";
  });
  cv.addEventListener("click", () => { if(hov) showDetail(hov); });
  window.closeDetail = () => document.getElementById("detail").classList.remove("on");
  function showDetail(id){
    const [title,desc,tags] = DETAIL[id];
    document.getElementById("d-title").textContent = title;
    document.getElementById("d-desc").textContent = desc;
    document.getElementById("d-tags").innerHTML = tags.map((t,i)=>tag(t,["c","g","p","o","y","d"][i%6])).join("");
    document.getElementById("detail").classList.add("on");
  }
  window.addEventListener("resize", resize);
  resize(); draw();
}

if(page === "hardware"){
  const details = {
    "pi-detail":["Raspberry Pi 5","The Pi is the edge computer. It runs the collector, API, dashboard, analytics engine, and Ollama client. Use 8GB for a smoother local model experience.",["ARM64","FastAPI","Ollama","SQLite"]],
    "ina-detail":["INA219 / INA226","This is the measurement front end. It reads voltage and current over I2C so software can integrate mAh and Wh.",["I2C","0x40","shunt current","bus voltage"]],
    "temp-detail":["Temperature Sensor","Temperature adds the safety layer. Hot batteries degrade faster and unsafe temperatures should stop a test.",["thermal","warning","Celsius","safety"]],
    "safety-detail":["Protected Battery Path","Battery testing needs a BMS, fuse, and rated load. The Raspberry Pi should never be part of the raw high-current battery path.",["BMS","fuse","rated load","no direct GPIO"]],
  };
  window.expand = id => {
    const [title,desc,tags] = details[id];
    document.getElementById("hw-title").textContent = title;
    document.getElementById("hw-desc").textContent = desc;
    document.getElementById("hw-tags").innerHTML = tags.map((t,i)=>tag(t,["c","g","p","o"][i])).join("");
    document.getElementById("hw-detail").classList.add("on");
  };
}

async function loadTelemetry(){
  const readings = await getJson("/api/readings?limit=160");
  const summary = await getJson("/api/summary");
  const latest = readings.at(-1);
  const status = document.getElementById("status-line");
  if(status) status.textContent = `Session ${summary.session_id} - ${summary.sample_count} samples - ${summary.status}`;
  if(latest){
    setText("voltage", `${latest.voltage_v.toFixed(3)} V`);
    setText("current", `${latest.current_a.toFixed(3)} A`);
    setText("power", `${latest.power_w.toFixed(2)} W`);
    setText("temperature", `${latest.temperature_c.toFixed(1)} C`);
  }
  setText("capacity", `${Math.round(summary.measured_capacity_mah)} mAh`);
  setText("energy", `${summary.measured_energy_wh.toFixed(3)} Wh`);
  setText("cycles", summary.equivalent_cycles.toFixed(4));
  setText("health", summary.status === "unknown" ? "Partial" : `${summary.health_percent}%`);
  setText("sample-count", summary.sample_count);
  drawTelemetry(readings);
}
function setText(id,value){ const el = document.getElementById(id); if(el) el.textContent = value; }
function drawTelemetry(readings){
  const chart = document.getElementById("telemetry-chart"); if(!chart) return;
  const cx = chart.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = chart.clientWidth, H = chart.clientHeight || 380;
  chart.width = W*dpr; chart.height = H*dpr; cx.setTransform(dpr,0,0,dpr,0,0);
  cx.clearRect(0,0,W,H); cx.fillStyle = "#0c1a0d"; cx.fillRect(0,0,W,H);
  const pad = 42, pw = W-pad*2, ph = H-pad*2;
  cx.strokeStyle = "rgba(74,222,128,.1)";
  for(let i=0;i<=4;i++){ const y=pad+ph*i/4; cx.beginPath(); cx.moveTo(pad,y); cx.lineTo(W-pad,y); cx.stroke(); }
  series(readings.map(r=>r.voltage_v),"#4ade80",pad,pw,ph,cx);
  series(readings.map(r=>r.current_a),"#fb923c",pad,pw,ph,cx);
  series(readings.map(r=>r.temperature_c/10),"#c084fc",pad,pw,ph,cx);
  cx.font = "12px JetBrains Mono"; [["Voltage","#4ade80"],["Current","#fb923c"],["Temp/10","#c084fc"]].forEach(([l,c],i)=>{cx.fillStyle=c;cx.fillText(l,pad+i*90,22);});
}
function series(values,color,pad,pw,ph,cx){
  if(values.length < 2) return;
  const min = Math.min(...values), max = Math.max(...values), range = max-min || 1;
  cx.strokeStyle = color; cx.lineWidth = 2; cx.beginPath();
  values.forEach((v,i)=>{ const x=pad+pw*i/(values.length-1), y=pad+ph-((v-min)/range)*ph; i?cx.lineTo(x,y):cx.moveTo(x,y); });
  cx.stroke();
}
if(page === "telemetry" || page === "analytics"){
  loadTelemetry().catch(e => setText("status-line", e.message));
  setInterval(() => loadTelemetry().catch(()=>{}), 2500);
}

if(page === "telemetry"){
  const metricDetails = {
    voltage:["Voltage","Voltage shows the electrical potential at the battery path. It helps reveal whether the pack is charging normally, sagging under load, or approaching a low-voltage condition.",["voltage_v","INA219","battery path","live value"]],
    current:["Current","Current tells me how much charge is moving through the sensor. Over time, this is the value that becomes the mAh capacity estimate.",["current_a","charge/discharge","capacity input","shunt"]],
    power:["Power","Power is voltage multiplied by current. It is useful for quickly seeing how hard the battery is being charged or discharged.",["power_w","V x I","instant load","derived"]],
    temperature:["Temperature","Temperature is a safety signal. A battery can look electrically normal while still getting too hot, so this value belongs next to the electrical readings.",["temperature_c","safety","thermal","warning"]],
  };
  window.showMetric = id => {
    const [title, desc, tags] = metricDetails[id];
    setText("metric-title", title);
    setText("metric-desc", desc);
    document.getElementById("metric-tags").innerHTML = tags.map((t,i)=>tag(t,["c","g","p","o"][i])).join("");
  };
  const telemetrySteps = {
    collector:["Collector","The background task in server.py asks the active sensor for a reading every few seconds. In demo mode, that sensor is the simulator."],
    api:["API","The page calls /api/readings and /api/summary. Those routes return JSON from the same local process that is collecting the data."],
    render:["Render","app.js places the newest values into the cards, draws the chart on canvas, and updates the session summary."],
    refresh:["Refresh","The browser repeats the fetch cycle every few seconds, so the page feels live without needing a cloud service or separate frontend framework."],
  };
  window.selectTelemetryStep = (el,id) => {
    document.querySelectorAll(".byte").forEach(b=>b.classList.remove("active"));
    el.classList.add("active");
    const [title, desc] = telemetrySteps[id];
    document.getElementById("telemetry-step").innerHTML = `<h4>${title}</h4><p>${desc}</p>`;
  };
}

if(page === "analytics"){
  const formula = {
    current:["Current samples","Current is read from the sensor in amps. Absolute current is used because both charge and discharge move capacity through the cell."],
    time:["Time delta","Each pair of samples has a timestamp delta. The app converts seconds to hours before integrating capacity."],
    capacity:["Capacity integration","mAh is the sum of current_mA times delta_hours across the session. Full-cycle sessions give the most reliable health estimate."],
    health:["Health percent","Health is measured_capacity / rated_capacity. Short sessions are marked partial so a tiny sample is not mistaken for a bad battery."],
  };
  window.selectFormula = (el,id) => {
    document.querySelectorAll(".byte").forEach(b=>b.classList.remove("active")); el.classList.add("active");
    const [h,p] = formula[id]; document.getElementById("formula-detail").innerHTML = `<h4>${h}</h4><p>${p}</p>`;
  };
}

if(page === "model"){
  window.loadReport = async () => {
    setText("ai-report","Generating local LLM report...");
    const report = await getJson("/api/report");
    setText("ai-report", report.report);
    setText("report-source", `Model source: ${report.generated_by}`);
  };
}

if(page === "concepts"){
  const concepts = {
    edge:["Edge Intelligence","For this project, edge intelligence means the Raspberry Pi is not just forwarding data somewhere else. It is reading the sensor, storing the session, running the calculations, serving the dashboard, and asking the local model for a report.",["Raspberry Pi","offline","local model","FastAPI"]],
    telemetry:["Telemetry","Telemetry is the stream of readings I trust most in the project. Every later result depends on these samples: voltage, current, power, temperature, timestamp, and source.",["TelemetryReading","sensors.py","storage.py","SQLite"]],
    capacity:["Capacity Integration","The capacity estimate comes from adding up current over time. A short test can show that the pipeline works, but a full charge or discharge cycle is needed before treating the health number as meaningful.",["analytics.py","mAh","Wh","equivalent cycles"]],
    llm:["LLM Report","The model gets a summary that has already been calculated. Its job is to explain the result in normal language, so the final output sounds like a useful diagnostic note instead of raw numbers.",["llm.py","Ollama","structured facts","Qwen3 0.6B"]],
  };
  window.showConcept = id => {
    const [title,desc,tags] = concepts[id];
    setText("concept-title", title);
    setText("concept-desc", desc);
    document.getElementById("concept-tags").innerHTML = tags.map((t,i)=>tag(t,["c","g","p","o"][i])).join("");
  };
  const steps = {
    sample:["Sample","server.py keeps a background collector running. Every few seconds it asks the active sensor for one reading."],
    store:["Store","storage.py saves that reading into SQLite under the current session. This gives the project a local history instead of only a live value."],
    analyze:["Analyze","analytics.py takes the session readings and turns them into battery metrics: capacity, energy, cycle throughput, health status, and warnings."],
    explain:["Explain","llm.py sends the finished summary to the local model. The model writes a short diagnosis from the facts it was given."],
    display:["Display","The HTML pages explain the project, and app.js pulls the API data into charts, cards, diagrams, and report text."],
  };
  window.selectConceptStep = (el,id) => {
    document.querySelectorAll(".byte").forEach(b=>b.classList.remove("active")); el.classList.add("active");
    const [h,p] = steps[id]; document.getElementById("concept-step").innerHTML = `<h4>${h}</h4><p>${p}</p>`;
  };
}
