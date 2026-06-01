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
    battery:{lbl:["Battery","Pack"],sub:"Device under test",col:"#69f0ae",rx:.04,ry:.34,rw:.13,rh:.24},
    sensor:{lbl:["INA219","Sensor"],sub:"I2C telemetry",col:"#b388ff",rx:.24,ry:.18,rw:.13,rh:.56},
    pi:{lbl:["Raspberry","Pi"],sub:"collector + API",col:"#4ade80",rx:.45,ry:.15,rw:.14,rh:.62},
    db:{lbl:["SQLite","Log"],sub:"local sessions",col:"#ffd740",rx:.68,ry:.10,rw:.13,rh:.25},
    llm:{lbl:["Qwen3","0.6B"],sub:"Ollama report",col:"#c084fc",rx:.68,ry:.55,rw:.13,rh:.28},
    ui:{lbl:["Interactive","Guide"],sub:"FastAPI pages",col:"#fb923c",rx:.84,ry:.32,rw:.13,rh:.26},
  };
  const ED = [
    {f:"battery",t:"sensor",lbl:"V/I",col:"#69f0ae"},
    {f:"sensor",t:"pi",lbl:"I2C",col:"#b388ff"},
    {f:"pi",t:"db",lbl:"SQL",col:"#ffd740"},
    {f:"pi",t:"llm",lbl:"facts",col:"#c084fc"},
    {f:"db",t:"ui",lbl:"API",col:"#ffd740"},
    {f:"llm",t:"ui",lbl:"report",col:"#fb923c"},
  ];
  const DETAIL = {
    battery:["Battery / Device","A USB pack, phone, smart battery, or protected bare cell being measured. The project estimates health from observed charge or discharge behavior.",["BMS required","rated capacity","safe load","no raw GPIO"]],
    sensor:["Sensor Adapter","The simulated adapter makes the site demo-ready. The INA219 adapter reads bus voltage and shunt current from Raspberry Pi I2C.",["INA219","voltage","current","power"]],
    pi:["Raspberry Pi Runtime","The Pi runs the collector loop, SQLite database, analytics functions, FastAPI routes, and local LLM client.",["FastAPI","Python","edge device","offline"]],
    db:["SQLite Telemetry Store","Each session and sample is saved locally so capacity, energy, and trends can be recomputed without cloud storage.",["sessions","telemetry","local data","privacy"]],
    llm:["Local Small Language Model","Qwen3 0.6B runs through Ollama. It explains structured facts from analytics and does not invent measurements.",["qwen3:0.6b","Ollama","prompt contract","fallback report"]],
    ui:["Interactive Project Guide","The website documents the full system while also showing live readings and generated reports from the running service.",["linkable pages","canvas diagram","live API","GitHub-ready"]],
  };

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const box = cv.parentElement.getBoundingClientRect();
    W = box.width; H = Math.round(W * 420 / 1060);
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
    edges.forEach(e => {
      cx.strokeStyle = e.col; cx.globalAlpha = .36; cx.lineWidth = 2;
      cx.beginPath(); cx.moveTo(e.x1,e.y1); cx.bezierCurveTo(e.x1+45,e.y1,e.x2-45,e.y2,e.x2,e.y2); cx.stroke();
      cx.globalAlpha = 1; cx.fillStyle = e.col; cx.font = "10px JetBrains Mono"; cx.fillText(e.lbl,(e.x1+e.x2)/2-10,(e.y1+e.y2)/2-8);
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
