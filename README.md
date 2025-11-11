# 🌐 Latency Topology Visualizer

A **Next.js 16 + TypeScript** application that visualizes **real-time and historical latency** between **cloud co-location regions** (AWS, GCP, Azure, Equinix) and **major cryptocurrency exchange servers** using a **3D interactive world map**.

Built for the **GoQuant recruitment assignment**, this project showcases skills in full-stack development, real-time visualization, WebGL rendering, and performance optimization.

---
## 🔗 Live demo
Try the live app: **https://latency-topology-visualizer-pi.vercel.app**

## 🚀 Features

### 🗺️ 3D Global Map
- Built using **Three.js** and **react-globe.gl**
- Smooth camera transitions, zoom, and rotation
- Real-time animated arcs connecting cloud probe servers and crypto exchange servers
- Color-coded latency visualization:
  - 🟢 `< 30 ms`
  - 🟠 `30–50 ms`
  - 🔴 `> 50 ms`

### ⚡ Real-Time Data Streaming
- **Server-Sent Events (SSE)** API (`/api/latency-stream`) streams live latency data every few seconds
- Integrates with:
  - **Pingdom API** → Probe server locations
  - **Cloudflare Radar IQI API** → Real-time latency metrics (p25, p50, p75)
- Each probe connects dynamically to multiple exchange servers with distance-aware latency selection

### 🧠 Smart State Management
- Single global **Zustand store (`useArcStore`)** handles:
  - Real-time arc updates
  - Provider / region / latency filters
  - Filtered view synchronization
- In-place arc updates to avoid flicker and maintain 3D object stability

### 🧩 Filtering & Sidebar UI
- Sidebar allows filtering by:
  - Cloud Provider (`AWS`, `Azure`, `GCP`, `Equinix`)
  - Region (`Americas`, `EMEA`, `APAC`)
  - Latency range (custom min/max)
- Filters instantly apply to the globe in real-time
- “Apply” and “Clear” buttons reset or update global state

### 🛰️ Latency Legend Overlay
Displays latency color mapping and provider markers:
- 🟢 **Low latency (<30ms)**
- 🟠 **Medium (30–50ms)**
- 🔴 **High (>50ms)**
- 🟣 **Probe servers:**
  - 🟠 AWS `#FF9900`
  - 🔵 Azure `#0078D4`
  - 🟢 GCP `#34A853`
  - ⚫ Equinix `#aaaaaa`
- 🟡 **Exchange servers** – Gold marker

### 🕒 Historical Data (Backend Ready)
- Historical snapshots stored in JSON format
- APIs ready for `/api/history?range=1h|24h|7d|30d` endpoints
- Designed for future integration with TimescaleDB or InfluxDB

### 🧩 Responsive & Optimized
- Fully responsive (desktop, tablet, mobile)
- Optimized 3D rendering (stable object refs)
- Low-latency state updates with throttled streaming

---

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|--------|-------------|----------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS | UI + React app |
| **3D Rendering** | Three.js + react-globe.gl | Interactive world map |
| **State Management** | Zustand | Global real-time state |
| **Real-Time Data** | Server-Sent Events (SSE) | Live latency stream |
| **Data Sources** | Cloudflare Radar API, Pingdom API | Latency + probe data |
| **Charts (future)** | Recharts | Historical trend graph |
| **Styling** | TailwindCSS + custom components | Responsive UI |

---
---


## 🔑 Environment Variables

### Get your API tokens

- **Pingdom API Token** → [my.pingdom.com/account/appkeys](https://my.pingdom.com/account/appkeys)  
- **Cloudflare API Token** → [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)

#### Required Permissions:
- `Radar:Read`
- `User Details:Read`

> 🟢 If no tokens are provided, the app automatically falls back to mock data for demo purposes.

---

## ⚙️ How It Works

### 🔄 1. Backend (Streaming)

The **streaming backend** runs through `/api/latency-stream` which:

1. Fetches **active Pingdom probe locations**
2. For each probe, it queries **Cloudflare Radar IQI API** for:
   - Metric: `LATENCY`
   - Aggregation: `1h`
   - Range: `7d`
3. Calculates **nearest crypto exchange servers** using geographic distance (Haversine formula)
4. Streams latency and connection data incrementally to the frontend using **SSE (Server-Sent Events)**

---

### 🔁 2. Frontend (Real-time Visualization)

The **frontend** connects to the streaming API and renders the latency arcs dynamically:

```ts
const es = new EventSource("/api/latency-stream");

es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  addOrUpdateArcs(data); // merges new latency data into the global Zustand store
};


