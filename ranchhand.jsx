import { useState } from "react";

const colors = {
  bg: "#0C1008",
  panel: "#13180E",
  border: "#2A3520",
  green: "#7EC845",
  greenDim: "#4A7A28",
  amber: "#F5A623",
  blue: "#4A9EFF",
  purple: "#A78BFA",
  red: "#F87171",
  text: "#D4E8B0",
  muted: "#6B7E58",
  white: "#F0F4E8",
};

const NODE_DEFS = {
  solar:     { id: "solar",     label: "Solar Panel",         sub: "100W Mono",           color: colors.amber,  x: 60,  y: 60  },
  mppt:      { id: "mppt",      label: "MPPT Controller",     sub: "30A Renogy",           color: colors.amber,  x: 60,  y: 190 },
  battery:   { id: "battery",   label: "LiFePO4 Battery",     sub: "100Ah",                color: colors.amber,  x: 60,  y: 320 },
  buck19:    { id: "buck19",    label: "DC-DC Converter",     sub: "12V → 19V",            color: colors.amber,  x: 60,  y: 450 },
  jetson:    { id: "jetson",    label: "Jetson Orin NX",      sub: "16GB · AI Inference",  color: colors.green,  x: 310, y: 270 },
  rpi:       { id: "rpi",       label: "Raspberry Pi 5",      sub: "8GB · Orchestration",  color: colors.green,  x: 560, y: 270 },
  poe:       { id: "poe",       label: "PoE Switch",          sub: "8-Port TP-Link",       color: colors.blue,   x: 310, y: 110 },
  cam1:      { id: "cam1",      label: "Camera 1",            sub: "4K IR · Pasture",      color: colors.blue,   x: 130, y: 530 },
  cam2:      { id: "cam2",      label: "Camera 2",            sub: "4K IR · Perimeter",    color: colors.blue,   x: 270, y: 530 },
  cam3:      { id: "cam3",      label: "Camera 3",            sub: "4K IR · Gate",         color: colors.blue,   x: 410, y: 530 },
  cam4:      { id: "cam4",      label: "Camera 4",            sub: "4K IR · Pen",          color: colors.blue,   x: 550, y: 530 },
  lte:       { id: "lte",       label: "LTE HAT",             sub: "SIM7600G-H",           color: colors.purple, x: 700, y: 190 },
  cloud:     { id: "cloud",     label: "Cloud / Alerts",      sub: "Twilio · Dashboard",   color: colors.purple, x: 700, y: 350 },
  sensors:   { id: "sensors",   label: "Sensors",             sub: "BME280 · PIR",         color: colors.red,    x: 700, y: 110 },
};

const EDGES = [
  { from: "solar",   to: "mppt",    label: "DC power",         style: "power"  },
  { from: "mppt",    to: "battery", label: "regulated DC",     style: "power"  },
  { from: "battery", to: "buck19",  label: "12V",              style: "power"  },
  { from: "buck19",  to: "jetson",  label: "19V",              style: "power"  },
  { from: "battery", to: "rpi",     label: "5V via USB-C",     style: "power"  },
  { from: "battery", to: "poe",     label: "12V",              style: "power"  },
  { from: "poe",     to: "cam1",    label: "PoE",              style: "poe"    },
  { from: "poe",     to: "cam2",    label: "PoE",              style: "poe"    },
  { from: "poe",     to: "cam3",    label: "PoE",              style: "poe"    },
  { from: "poe",     to: "cam4",    label: "PoE",              style: "poe"    },
  { from: "poe",     to: "jetson",  label: "RTSP streams",     style: "data"   },
  { from: "jetson",  to: "rpi",     label: "detections / ETH", style: "data"   },
  { from: "rpi",     to: "lte",     label: "UART / USB",       style: "data"   },
  { from: "lte",     to: "cloud",   label: "4G LTE",           style: "wireless"},
  { from: "rpi",     to: "sensors", label: "GPIO / I2C",       style: "data"   },
];

const NODE_W = 130;
const NODE_H = 54;
const SVG_W = 860;
const SVG_H = 620;

function cx(id) { return NODE_DEFS[id].x + NODE_W / 2; }
function cy(id) { return NODE_DEFS[id].y + NODE_H / 2; }

function edgePath(from, to) {
  const x1 = cx(from), y1 = cy(from), x2 = cx(to), y2 = cy(to);
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

const EDGE_STYLES = {
  power:    { stroke: colors.amber,  dash: "none",  width: 2 },
  poe:      { stroke: colors.blue,   dash: "none",  width: 1.5 },
  data:     { stroke: colors.green,  dash: "5,4",   width: 1.5 },
  wireless: { stroke: colors.purple, dash: "3,5",   width: 1.5 },
};

const LEGEND = [
  { style: "power",    label: "DC Power" },
  { style: "poe",      label: "PoE (Power + Data)" },
  { style: "data",     label: "Data (Ethernet / GPIO)" },
  { style: "wireless", label: "Wireless (4G LTE)" },
];

// ── Starter code tabs ──────────────────────────────────────────────────────
const CODE_TABS = [
  {
    id: "jetson",
    label: "Jetson · AI Pipeline",
    lang: "python",
    code: `#!/usr/bin/env python3
"""
ranchhand_jetson.py
Runs on the Jetson Orin NX.
- Pulls RTSP streams from all 4 PoE cameras
- Runs YOLOv8 livestock/predator detection via DeepStream
- Sends detection events to RPi5 over local ethernet (TCP socket)

Requirements:
  pip install ultralytics opencv-python-headless requests
  # NVIDIA DeepStream SDK must be installed via JetPack
"""

import cv2
import json
import socket
import time
import threading
from datetime import datetime
from ultralytics import YOLO

# ── Config ──────────────────────────────────────────────────────────────────
CAMERA_STREAMS = [
    "rtsp://admin:password@192.168.1.101/stream0",  # Pasture
    "rtsp://admin:password@192.168.1.102/stream0",  # Perimeter
    "rtsp://admin:password@192.168.1.103/stream0",  # Gate
    "rtsp://admin:password@192.168.1.104/stream0",  # Pen
]

RPI_HOST = "192.168.1.10"   # Static IP of your Raspberry Pi 5
RPI_PORT = 9001              # Alert socket port

MODEL_PATH = "ranchhand_v1.pt"   # Fine-tuned YOLOv8 weights
CONFIDENCE = 0.45
ALERT_COOLDOWN = 30          # Seconds between repeat alerts per camera

# Classes your model detects -- fine-tune YOLOv8 on these
ALERT_CLASSES = {
    "coyote":       "PREDATOR",
    "dog_unknown":  "PREDATOR",
    "cow_down":     "HEALTH",
    "cow_limping":  "HEALTH",
    "fence_breach": "FENCE",
}

last_alert: dict[str, float] = {}

# ── Detection engine ─────────────────────────────────────────────────────────
model = YOLO(MODEL_PATH)

def send_alert(payload: dict):
    """Fire-and-forget alert to RPi5."""
    try:
        with socket.create_connection((RPI_HOST, RPI_PORT), timeout=3) as sock:
            sock.sendall((json.dumps(payload) + "\\n").encode())
    except Exception as e:
        print(f"[WARN] Could not reach RPi5: {e}")

def process_stream(cam_index: int, url: str):
    cap = cv2.VideoCapture(url)
    cam_id = f"cam_{cam_index + 1}"
    print(f"[{cam_id}] Stream opened: {url}")

    while True:
        ret, frame = cap.read()
        if not ret:
            print(f"[{cam_id}] Stream lost, retrying in 5s...")
            time.sleep(5)
            cap = cv2.VideoCapture(url)
            continue

        results = model(frame, conf=CONFIDENCE, verbose=False)

        for r in results:
            for box in r.boxes:
                cls_name = model.names[int(box.cls)]
                if cls_name not in ALERT_CLASSES:
                    continue

                key = f"{cam_id}_{cls_name}"
                now = time.time()
                if now - last_alert.get(key, 0) < ALERT_COOLDOWN:
                    continue

                last_alert[key] = now
                payload = {
                    "ts":         datetime.utcnow().isoformat(),
                    "camera":     cam_id,
                    "type":       ALERT_CLASSES[cls_name],
                    "class":      cls_name,
                    "confidence": round(float(box.conf), 3),
                    "bbox":       box.xyxy[0].tolist(),
                }
                print(f"[ALERT] {payload}")
                send_alert(payload)

        # Optional: save annotated frame every N seconds for the dashboard
        # cv2.imwrite(f"/tmp/snapshot_{cam_id}.jpg", r.plot())

def main():
    threads = []
    for i, url in enumerate(CAMERA_STREAMS):
        t = threading.Thread(target=process_stream, args=(i, url), daemon=True)
        t.start()
        threads.append(t)
    print("[JETSON] All camera threads started.")
    for t in threads:
        t.join()

if __name__ == "__main__":
    main()
`,
  },
  {
    id: "rpi",
    label: "RPi5 · Alert Hub",
    lang: "python",
    code: `#!/usr/bin/env python3
"""
ranchhand_rpi.py
Runs on the Raspberry Pi 5.
- Listens for detection events from the Jetson (TCP socket)
- Sends SMS via Twilio on critical alerts
- Logs all events to SQLite
- Reads sensor data (BME280 + PIR) on GPIO
- Serves a simple status API for the dashboard

Requirements:
  pip install twilio smbus2 flask RPi.GPIO
"""

import json
import socket
import sqlite3
import threading
import time
from datetime import datetime
from flask import Flask, jsonify
from twilio.rest import Client
import smbus2          # BME280 via I2C
import RPi.GPIO as GPIO

# ── Config ──────────────────────────────────────────────────────────────────
LISTEN_HOST = "0.0.0.0"
LISTEN_PORT = 9001

TWILIO_SID   = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_TOKEN = "your_auth_token"
TWILIO_FROM  = "+15551234567"
ALERT_TO     = "+19185559999"   # Ranch owner's number

DB_PATH = "/home/pi/ranchhand.db"

PIR_PIN_1 = 17   # GPIO pin for PIR sensor 1 (north perimeter)
PIR_PIN_2 = 27   # GPIO pin for PIR sensor 2 (south perimeter)

# ── Database ─────────────────────────────────────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            ts        TEXT,
            camera    TEXT,
            type      TEXT,
            class     TEXT,
            confidence REAL,
            notified  INTEGER DEFAULT 0
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ts          TEXT,
            temp_c      REAL,
            humidity    REAL,
            pressure_pa REAL
        )
    """)
    conn.commit()
    conn.close()

def log_event(ev: dict, notified: bool):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO events (ts, camera, type, class, confidence, notified) VALUES (?,?,?,?,?,?)",
        (ev["ts"], ev["camera"], ev["type"], ev["class"], ev["confidence"], int(notified))
    )
    conn.commit()
    conn.close()

# ── SMS Alerts ───────────────────────────────────────────────────────────────
twilio = Client(TWILIO_SID, TWILIO_TOKEN)

SMS_TEMPLATES = {
    "PREDATOR": "🚨 RanchHand ALERT: Predator detected on {camera} at {ts}. Check app.",
    "HEALTH":   "⚠️ RanchHand: Distressed animal detected on {camera}. Confidence: {conf}%.",
    "FENCE":    "🔧 RanchHand: Possible fence breach on {camera} at {ts}.",
}

def send_sms(ev: dict):
    tpl = SMS_TEMPLATES.get(ev["type"])
    if not tpl:
        return
    body = tpl.format(
        camera=ev["camera"],
        ts=ev["ts"][:19].replace("T", " "),
        conf=int(ev["confidence"] * 100),
    )
    try:
        twilio.messages.create(to=ALERT_TO, from_=TWILIO_FROM, body=body)
        print(f"[SMS] Sent: {body}")
    except Exception as e:
        print(f"[SMS ERROR] {e}")

# ── Alert listener (from Jetson) ─────────────────────────────────────────────
def alert_listener():
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((LISTEN_HOST, LISTEN_PORT))
    srv.listen(5)
    print(f"[RPI] Listening for Jetson events on port {LISTEN_PORT}")

    while True:
        conn, addr = srv.accept()
        with conn:
            data = conn.recv(4096).decode().strip()
            if not data:
                continue
            try:
                ev = json.loads(data)
                print(f"[EVENT] {ev}")
                # Only SMS on high-priority types
                notify = ev["type"] in ("PREDATOR", "HEALTH", "FENCE")
                if notify:
                    threading.Thread(target=send_sms, args=(ev,), daemon=True).start()
                log_event(ev, notify)
            except json.JSONDecodeError:
                print(f"[WARN] Bad payload: {data}")

# ── BME280 Sensor (temp / humidity / pressure) ───────────────────────────────
BME280_ADDR = 0x76
bus = smbus2.SMBus(1)

def read_bme280():
    """Simplified BME280 read -- use bme280 library for full calibration."""
    try:
        import bme280
        data = bme280.sample(bus, BME280_ADDR)
        return round(data.temperature, 1), round(data.humidity, 1), round(data.pressure, 1)
    except Exception:
        return None, None, None

def sensor_loop():
    while True:
        temp, hum, pres = read_bme280()
        if temp is not None:
            conn = sqlite3.connect(DB_PATH)
            conn.execute(
                "INSERT INTO sensor_readings (ts, temp_c, humidity, pressure_pa) VALUES (?,?,?,?)",
                (datetime.utcnow().isoformat(), temp, hum, pres)
            )
            conn.commit()
            conn.close()
        time.sleep(300)  # Log every 5 minutes

# ── PIR Motion (GPIO) ────────────────────────────────────────────────────────
def setup_pir():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(PIR_PIN_1, GPIO.IN)
    GPIO.setup(PIR_PIN_2, GPIO.IN)

    def pir_callback(channel):
        zone = "North" if channel == PIR_PIN_1 else "South"
        ev = {
            "ts":         datetime.utcnow().isoformat(),
            "camera":     f"PIR_{zone}",
            "type":       "PERIMETER",
            "class":      "motion",
            "confidence": 1.0,
        }
        log_event(ev, notified=False)
        print(f"[PIR] Motion detected: {zone}")

    GPIO.add_event_detect(PIR_PIN_1, GPIO.RISING, callback=pir_callback, bouncetime=3000)
    GPIO.add_event_detect(PIR_PIN_2, GPIO.RISING, callback=pir_callback, bouncetime=3000)

# ── Simple Status API (Flask) ────────────────────────────────────────────────
app = Flask(__name__)

@app.route("/api/events")
def get_events():
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT ts, camera, type, class, confidence FROM events ORDER BY id DESC LIMIT 50"
    ).fetchall()
    conn.close()
    return jsonify([
        {"ts": r[0], "camera": r[1], "type": r[2], "class": r[3], "confidence": r[4]}
        for r in rows
    ])

@app.route("/api/sensors/latest")
def get_sensor():
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT ts, temp_c, humidity, pressure_pa FROM sensor_readings ORDER BY id DESC LIMIT 1"
    ).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "no data"})
    return jsonify({"ts": row[0], "temp_c": row[1], "humidity": row[2], "pressure_pa": row[3]})

@app.route("/api/status")
def status():
    return jsonify({"status": "online", "ts": datetime.utcnow().isoformat()})

# ── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    setup_pir()
    threading.Thread(target=alert_listener, daemon=True).start()
    threading.Thread(target=sensor_loop, daemon=True).start()
    print("[RPI] RanchHand hub running.")
    app.run(host="0.0.0.0", port=8080)
`,
  },
  {
    id: "systemd",
    label: "systemd Services",
    lang: "bash",
    code: `# ── Install as systemd services so they auto-start on boot ──────────────────

# 1. Jetson service
sudo tee /etc/systemd/system/ranchhand-jetson.service > /dev/null <<EOF
[Unit]
Description=RanchHand AI Detection Pipeline
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/ranchhand/ranchhand_jetson.py
WorkingDirectory=/opt/ranchhand
Restart=always
RestartSec=10
User=ranchhand
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 2. RPi5 service
sudo tee /etc/systemd/system/ranchhand-hub.service > /dev/null <<EOF
[Unit]
Description=RanchHand Alert Hub
After=network.target

[Service]
ExecStart=/usr/bin/python3 /opt/ranchhand/ranchhand_rpi.py
WorkingDirectory=/opt/ranchhand
Restart=always
RestartSec=10
User=pi
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 3. Enable and start both
sudo systemctl daemon-reload
sudo systemctl enable ranchhand-jetson ranchhand-hub
sudo systemctl start  ranchhand-jetson ranchhand-hub

# 4. Check logs live
journalctl -u ranchhand-jetson -f
journalctl -u ranchhand-hub -f

# ── Quick network setup (static IPs, both boards on same switch) ─────────────

# On Jetson -- edit /etc/netplan/01-netcfg.yaml
# network:
#   version: 2
#   ethernets:
#     eth0:
#       dhcp4: no
#       addresses: [192.168.1.20/24]
#       gateway4: 192.168.1.1

# On RPi5 -- /etc/dhcpcd.conf
# interface eth0
# static ip_address=192.168.1.10/24
# static routers=192.168.1.1

# Camera IPs -- set via each camera's web UI:
# cam1 -> 192.168.1.101
# cam2 -> 192.168.1.102
# cam3 -> 192.168.1.103
# cam4 -> 192.168.1.104
`,
  },
  {
    id: "train",
    label: "Model Fine-Tuning",
    lang: "python",
    code: `#!/usr/bin/env python3
"""
train_ranchhand.py
Fine-tune YOLOv8 on livestock/predator detection data.
Run this on a GPU workstation or Google Colab -- then copy
the resulting best.pt weights to the Jetson at /opt/ranchhand/ranchhand_v1.pt

Requirements:
  pip install ultralytics roboflow
"""

from roboflow import Roboflow
from ultralytics import YOLO

# ── Step 1: Download a dataset from Roboflow ─────────────────────────────────
# Search roboflow.com/universe for:
#   - "cattle detection"
#   - "livestock computer vision"
#   - "coyote detection"
# Then grab your API key from roboflow.com

rf = Roboflow(api_key="YOUR_ROBOFLOW_API_KEY")

# Example -- replace with your chosen dataset workspace/project/version
project = rf.workspace("livestock-ai").project("cattle-detection")
dataset  = project.version(3).download("yolov8")

# ── Step 2: Fine-tune from YOLOv8m pretrained weights ───────────────────────
model = YOLO("yolov8m.pt")   # Medium model -- good balance for Jetson

results = model.train(
    data=f"{dataset.location}/data.yaml",
    epochs=80,
    imgsz=640,
    batch=16,
    name="ranchhand_v1",
    patience=20,         # Early stopping
    augment=True,
    degrees=15.0,        # Rotation augmentation for pasture angles
    fliplr=0.5,
    mosaic=1.0,
    device=0,            # GPU 0
)

print("Training complete. Best weights:", results.save_dir)

# ── Step 3: Validate ─────────────────────────────────────────────────────────
metrics = model.val()
print(f"mAP50:    {metrics.box.map50:.3f}")
print(f"mAP50-95: {metrics.box.map:.3f}")

# ── Step 4: Export for Jetson (TensorRT) ────────────────────────────────────
# Run this ON the Jetson for best results (TRT engine is device-specific)
# model = YOLO("runs/detect/ranchhand_v1/weights/best.pt")
# model.export(format="engine", half=True, device=0)
# Then load with: model = YOLO("best.engine")

# ── Custom classes to target ─────────────────────────────────────────────────
# Edit your dataset's data.yaml to include:
#
# names:
#   0: cow_healthy
#   1: cow_down
#   2: cow_limping
#   3: coyote
#   4: dog_unknown
#   5: fence_breach
#   6: cattle_group
#
# The more labeled images per class the better.
# Aim for 300+ images per class minimum.
# Roboflow's annotation tool makes labeling fast.
`,
  },
];

// ── Syntax highlight (minimal, color-coded by token type) ───────────────────
function highlight(code, lang) {
  if (lang === "bash") {
    return code
      .replace(/(#[^\n]*)/g, '<span style="color:#6B7E58">$1</span>')
      .replace(/("([^"\\]|\\.)*")/g, '<span style="color:#F5A623">$1</span>')
      .replace(/\b(sudo|systemctl|tee|journalctl|echo)\b/g, '<span style="color:#4A9EFF">$1</span>');
  }
  return code
    .replace(/(#[^\n]*)/g, '<span style="color:#6B7E58;font-style:italic">$1</span>')
    .replace(/("""[\s\S]*?""")/g, '<span style="color:#6B7E58;font-style:italic">$1</span>')
    .replace(/\b(import|from|def|class|if|else|while|for|return|True|False|None|in|not|and|or|with|as|try|except|threading|print)\b/g,
      '<span style="color:#A78BFA">$1</span>')
    .replace(/("([^"\\]|\\.)*"|\'([^\'\\]|\\.)*\')/g, '<span style="color:#F5A623">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#F87171">$1</span>');
}

// ── Diagram ──────────────────────────────────────────────────────────────────
function Diagram() {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ overflowX: "auto", padding: "8px 0" }}>
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ fontFamily: "'IBM Plex Mono', monospace", display: "block", margin: "0 auto" }}>

        {/* Grid dots */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill={colors.border} />
          </pattern>
          {/* Arrow markers */}
          {["power","poe","data","wireless"].map(s => {
            const st = EDGE_STYLES[s];
            return (
              <marker key={s} id={`arrow-${s}`} markerWidth="8" markerHeight="8"
                refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={st.stroke} opacity="0.8" />
              </marker>
            );
          })}
        </defs>
        <rect width={SVG_W} height={SVG_H} fill="url(#grid)" />

        {/* Edges */}
        {EDGES.map((e, i) => {
          const st = EDGE_STYLES[e.style];
          const isHov = hovered === e.from || hovered === e.to;
          return (
            <path key={i}
              d={edgePath(e.from, e.to)}
              fill="none"
              stroke={st.stroke}
              strokeWidth={isHov ? st.width + 1 : st.width}
              strokeDasharray={st.dash}
              opacity={hovered && !isHov ? 0.18 : 0.75}
              markerEnd={`url(#arrow-${e.style})`}
              style={{ transition: "opacity 0.2s" }}
            />
          );
        })}

        {/* Nodes */}
        {Object.values(NODE_DEFS).map(n => {
          const isHov = hovered === n.id;
          return (
            <g key={n.id}
              transform={`translate(${n.x},${n.y})`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}>
              <rect width={NODE_W} height={NODE_H} rx={6}
                fill={colors.panel}
                stroke={isHov ? n.color : colors.border}
                strokeWidth={isHov ? 2 : 1}
                style={{ transition: "stroke 0.15s" }}
              />
              <rect width={4} height={NODE_H} rx={2} fill={n.color} />
              <text x={14} y={20} fill={n.color}
                fontSize={10} fontWeight="700" letterSpacing="0.03em">
                {n.label}
              </text>
              <text x={14} y={36} fill={colors.muted} fontSize={8.5}>
                {n.sub}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(14, ${SVG_H - 70})`}>
          <rect width={260} height={60} rx={6} fill={colors.panel} stroke={colors.border} />
          {LEGEND.map((l, i) => {
            const st = EDGE_STYLES[l.style];
            const row = Math.floor(i / 2);
            const col = i % 2;
            const lx = 12 + col * 126;
            const ly = 16 + row * 22;
            return (
              <g key={l.style} transform={`translate(${lx},${ly})`}>
                <line x1={0} y1={0} x2={22} y2={0}
                  stroke={st.stroke} strokeWidth={1.5}
                  strokeDasharray={st.dash} />
                <text x={28} y={4} fill={colors.muted} fontSize={8.5}>{l.label}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("diagram");
  const [codeTab, setCodeTab] = useState("jetson");
  const [copied, setCopied] = useState(false);

  const currentCode = CODE_TABS.find(t => t.id === codeTab);

  function copy() {
    navigator.clipboard.writeText(currentCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div style={{
      background: colors.bg, minHeight: "100vh", color: colors.text,
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      padding: "0 0 40px",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${colors.border}`,
        padding: "18px 28px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: colors.green, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>🐄</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: colors.white, letterSpacing: "0.05em" }}>
            RANCHHAND AI
          </div>
          <div style={{ fontSize: 10, color: colors.muted }}>System Architecture &amp; Starter Code</div>
        </div>
        {/* Tab switcher */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {[{ id: "diagram", label: "Diagram" }, { id: "code", label: "Code" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? colors.green : "transparent",
              color: tab === t.id ? colors.bg : colors.muted,
              border: `1px solid ${tab === t.id ? colors.green : colors.border}`,
              borderRadius: 4, padding: "5px 14px", fontSize: 11, cursor: "pointer",
              fontFamily: "inherit", fontWeight: 600, letterSpacing: "0.04em",
              transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Diagram tab */}
      {tab === "diagram" && (
        <div style={{ padding: "24px 20px 0" }}>
          <div style={{
            fontSize: 10, color: colors.muted, marginBottom: 12,
            display: "flex", gap: 20,
          }}>
            <span>Hover nodes to highlight connections</span>
          </div>
          <div style={{
            border: `1px solid ${colors.border}`, borderRadius: 8,
            background: colors.panel, overflow: "hidden",
          }}>
            <Diagram />
          </div>
          {/* Component quick-ref */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 8, marginTop: 16,
          }}>
            {[
              { label: "AI Inference", items: ["Jetson Orin NX 16GB"], color: colors.green },
              { label: "Orchestration", items: ["Raspberry Pi 5 8GB"], color: colors.green },
              { label: "Vision", items: ["4x 4K PoE Cameras", "PoE Switch"], color: colors.blue },
              { label: "Power", items: ["100W Solar", "100Ah LiFePO4", "MPPT + Buck"], color: colors.amber },
              { label: "Connectivity", items: ["SIM7600G LTE HAT", "Twilio SMS"], color: colors.purple },
              { label: "Sensors", items: ["BME280 (Temp/Hum)", "PIR Motion x2"], color: colors.red },
            ].map(g => (
              <div key={g.label} style={{
                border: `1px solid ${colors.border}`, borderRadius: 6,
                padding: "10px 12px", background: colors.panel,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: g.color,
                  letterSpacing: "0.07em", marginBottom: 6 }}>{g.label}</div>
                {g.items.map(it => (
                  <div key={it} style={{ fontSize: 9, color: colors.muted, lineHeight: 1.7 }}>· {it}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code tab */}
      {tab === "code" && (
        <div style={{ padding: "20px 20px 0" }}>
          {/* Code sub-tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
            {CODE_TABS.map(t => (
              <button key={t.id} onClick={() => setCodeTab(t.id)} style={{
                background: codeTab === t.id ? colors.greenDim : "transparent",
                color: codeTab === t.id ? colors.white : colors.muted,
                border: `1px solid ${codeTab === t.id ? colors.green : colors.border}`,
                borderRadius: 4, padding: "5px 12px", fontSize: 10, cursor: "pointer",
                fontFamily: "inherit", fontWeight: 600, transition: "all 0.15s",
              }}>{t.label}</button>
            ))}
            <button onClick={copy} style={{
              marginLeft: "auto", background: "transparent",
              color: copied ? colors.green : colors.muted,
              border: `1px solid ${copied ? colors.green : colors.border}`,
              borderRadius: 4, padding: "5px 14px", fontSize: 10, cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.2s",
            }}>{copied ? "✓ Copied" : "Copy"}</button>
          </div>
          <div style={{
            border: `1px solid ${colors.border}`, borderRadius: 8,
            background: "#0A0F07", overflow: "hidden",
          }}>
            <div style={{
              padding: "8px 14px", borderBottom: `1px solid ${colors.border}`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {["#F87171","#F5A623","#7EC845"].map(c => (
                <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
              ))}
              <span style={{ fontSize: 9, color: colors.muted, marginLeft: 4 }}>
                {currentCode.id === "jetson" ? "ranchhand_jetson.py" :
                 currentCode.id === "rpi"    ? "ranchhand_rpi.py" :
                 currentCode.id === "systemd"? "setup.sh" : "train_ranchhand.py"}
              </span>
            </div>
            <pre style={{
              margin: 0, padding: "16px 18px",
              fontSize: 10.5, lineHeight: 1.7, color: colors.text,
              overflowX: "auto", maxHeight: 520, overflowY: "auto",
            }}
              dangerouslySetInnerHTML={{
                __html: highlight(currentCode.code, currentCode.lang)
              }}
            />
          </div>
          <div style={{
            marginTop: 10, fontSize: 9, color: colors.muted, lineHeight: 1.8,
          }}>
            {codeTab === "jetson" && "Run on Jetson Orin NX · Requires JetPack 6 + ultralytics"}
            {codeTab === "rpi"    && "Run on Raspberry Pi 5 · pip install twilio flask smbus2 RPi.GPIO"}
            {codeTab === "systemd"&& "Run once on each board to configure auto-start + static IPs"}
            {codeTab === "train"  && "Run on GPU workstation or Colab · Transfer best.pt to Jetson"}
          </div>
        </div>
      )}
    </div>
  );
}
