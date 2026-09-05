 # Mine Subsidence Monitoring Dashboard

## Overview

This is a local three-process demonstration system for monitoring mine subsidence. It replays a synthetic underground sensor dataset, sends each current node reading through machine-learning models, and displays ground truth and AI results in a React dashboard.

It is a CSV replay simulator, not a live sensor ingestion platform. The CSV is the source of readings; the Node.js backend controls replay and broadcasts frames; the optional Python service runs the trained models; and the browser renders the stream through Socket.IO.

There is no root `package.json`, database, authentication, persistent storage, or git history in this workspace. Frontend and backend dependencies are installed separately, and the ML service is a separate Python process.

## Architecture

```text
data/synthetic_mine_subsidence_mesh.csv
									|
									v
			Node.js CsvSimulator
					|             |
					v             v
	 MlService wrapper  REST + Socket.IO
					|             |
					v             v
 FastAPI model API  React/Vite dashboard
					|
					v
	mine_subsidence_models.joblib
```

### Services

- **Frontend**: React + Vite, React Leaflet/Leaflet, Recharts, Lucide icons, and Socket.IO client.
- **Backend**: Node.js + Express + Socket.IO, with Axios, CORS, dotenv, and the CSV simulator.
- **ML service**: FastAPI + Pydantic, pandas, NumPy, scikit-learn, joblib, and Uvicorn.

### URLs and ports

| Service | Code default | Current local expectation |
| --- | --- | --- |
| Frontend | Vite port `5173` | `http://localhost:5173` |
| Backend | port `5000` | `http://localhost:5001` |
| ML service | port `8000` | `http://127.0.0.1:8001` |

The frontend hook defaults to `VITE_BACKEND_URL=http://localhost:5001`. The backend code defaults to ML port `8000`, so the local environment configuration must set `ML_SERVICE_URL` to port `8001` when using the current ML command.

## What Was Implemented

The current code represents this implementation sequence:

1. A synthetic 16-node mine sensor mesh was defined as a CSV dataset.
2. CSV rows were grouped into complete chronological timestamp frames.
3. A Node.js backend was created to load, normalize, replay, pause, reset, seek, and speed-control those frames.
4. Socket.IO was added to stream status and frames to browser clients.
5. An Axios adapter was added for the separate ML service.
6. A FastAPI service was added to load serialized scikit-learn models and expose health and prediction endpoints.
7. The React dashboard was connected to live backend frames instead of depending only on static demo values.
8. Ground-truth labels were kept separate from model predictions.
9. Replay controls, a 4x4 sensor mesh, selected-node metrics, alerts, a local-coordinate deformation map, and live charts were added.
10. Offline ML fallback was added so CSV readings remain visible when the model service is unavailable.
11. Seek behavior was made responsive with optimistic state, a 60 ms debounce, and a 1.5 second confirmation timeout.

There is no commit history to provide: `git log` reports that this folder is not a git repository. The sequence above is reconstructed from the current source, not from commits.

## Repository Structure

```text
project.md
backend/
	package.json
	server.js
	routes/health.js
	services/csvSimulator.js
	services/mlService.js
data/synthetic_mine_subsidence_mesh.csv
frontend/
	index.html
	package.json
	public/data/.gitkeep
	src/App.jsx
	src/main.jsx
	src/styles.css
	src/components/
	src/data/mockData.js
	src/hooks/useSocketSimulation.js
ml-service/
	app.py
	mine_subsidence_models.joblib
	requirements.txt
```

## Backend Details

### Startup

`backend/server.js` loads environment variables, creates Express and an HTTP server, attaches Socket.IO, enables JSON and CORS, constructs `MlService` and `CsvSimulator`, loads the CSV, registers routes, and listens on `PORT`.

The accepted local CORS origins are the configured `FRONTEND_URL` and `http://127.0.0.1:5173`.

### REST API

All simulation routes are in `backend/server.js`; health is in `backend/routes/health.js`.

- `GET /api/health`: returns backend status and whether the ML service reports a loaded model.
- `GET /api/simulation/status`: returns running state, speed, current index, frame count, timestamp, and error.
- `POST /api/simulation/start`: starts replay and returns status.
- `POST /api/simulation/pause`: pauses replay and returns status.
- `POST /api/simulation/reset`: returns to frame zero, emits that frame, and returns status.
- `POST /api/simulation/seek` with `{ "index": 100 }`: selects a frame; invalid indices return HTTP 400.
- `POST /api/simulation/speed` with `{ "speed": 10 }`: changes replay pacing; valid speeds are `1`, `5`, `10`, and `30`.

Example status response:

```json
{
	"running": false,
	"speed": 5,
	"currentIndex": 0,
	"totalTimestamps": 6048,
	"timestamp": "2026-08-01T00:00:00",
	"error": ""
}
```

### Socket.IO events

On connection, the backend sends `simulation:status` and the current `simulation:frame` when available.

The browser can emit `simulation:start` (optionally with an index), `simulation:pause`, `simulation:reset`, `simulation:seek`, `simulation:jump-day`, and `simulation:speed`.

The server emits `simulation:status`, `simulation:frame`, and `simulation:error` with a message. Simulator state is process-global, so all connected browsers share one replay position and speed.

### CSV simulator

`backend/services/csvSimulator.js` resolves the dataset relative to the service, reads it synchronously, parses quoted CSV text, groups rows by timestamp, discards incomplete groups, orders nodes `N001` through `N016`, and sorts frames chronologically.

The normalized node contains `node_id`, `x_m`, `y_m`, `panel_id`, `sensor_data`, and `ground_truth`. Numeric conversion returns `null` for non-finite values. `sensor_data` contains:

```text
tilt_roll_deg, tilt_pitch_deg, tilt_magnitude_deg,
tilt_rate_deg_per_min, vibration_rms_g, dominant_frequency_hz,
displacement_mm, displacement_rate_mm_per_min, crack_event,
crack_opening_mm, battery_v, rssi_dbm, packet_loss_rate
```

Default state is `currentIndex=0`, `running=false`, and `speed=5`. Replay delays are 900 ms at 1x, 360 ms at 5x, 220 ms at 10x, and 90 ms at 30x. These are demo timer delays, not real five-minute timing and not exact mathematical speed multipliers.

`start()` emits immediately and schedules later frames. `pause()` clears the timer. `reset()` returns to frame zero and emits it. `seek()` validates an integer index, pauses, emits status and the selected frame, and uses `seekVersion` to prevent stale asynchronous results. `seekToDay()` selects the first frame matching the requested UTC calendar day.

For every frame, `buildFrame()` checks ML health once, requests predictions for all nodes concurrently when healthy, and falls back per node if health or a request fails. The frame includes timestamp, panel, current index, total timestamps, ML connectivity, and nodes.

### ML adapter

`backend/services/mlService.js` uses Axios with a three-second timeout. It posts these eight features for each node:

```text
tilt_magnitude_deg
tilt_rate_deg_per_min
vibration_rms_g
dominant_frequency_hz
displacement_mm
displacement_rate_mm_per_min
crack_event
crack_opening_mm
```

Missing node values become `0`. Offline output is explicit:

```json
{
	"prediction": "AI Service Offline",
	"probabilities": {},
	"anomaly": null,
	"risk_probability": null,
	"risk_threshold": null,
	"final_status": "AI Service Offline"
}
```

## ML Service Details

`ml-service/app.py` loads `mine_subsidence_models.joblib` during FastAPI startup. The expected bundle keys are `isolation_forest`, `three_class_random_forest`, and `binary_risk_random_forest`, plus optional `features` and `risk_threshold` (default `0.5`). A load failure leaves the service available but makes prediction return HTTP 503.

### `GET /health`

Returns `{ "status": "ok", "model_loaded": true|false }`.

### `POST /predict`

Accepts exactly eight float fields. Pydantic rejects extra fields. The service chooses the model feature order from the bundle when available, creates a one-row pandas DataFrame, then runs:

1. Three-class classification.
2. Class probabilities when supported.
3. Isolation Forest anomaly detection, where `-1` means anomaly.
4. Binary risk probability.

Final status rules, in order:

1. `active_subsidence` becomes `ACTIVE SUBSIDENCE`.
2. Anomaly plus risk probability at or above the threshold becomes `HIGH RISK / INVESTIGATION REQUIRED`.
3. `early_subsidence` becomes `EARLY SUBSIDENCE`.
4. All other results become `NORMAL`.

The response contains `prediction`, `probabilities`, `anomaly`, `risk_probability`, `risk_threshold`, and `final_status`.

## Frontend Details

`frontend/src/main.jsx` imports Leaflet and application CSS, then renders `App` into `frontend/index.html` under `React.StrictMode`.

`frontend/src/App.jsx` uses `useSocketSimulation()` and renders simulation controls, overview counts, ground-truth and AI status panels, the 4x4 mesh, selected-node inspector, deformation map, alerts, and historical charts.

The counts are derived from ground truth: normal, early subsidence, active subsidence, and sensor faults. Alerts are created for non-normal nodes, crack events, or packet loss above `0.15`, and at most six are shown. Ground truth drives the primary mesh, map, counts, and alert severity; AI output is deliberately displayed separately.

### Socket hook

`frontend/src/hooks/useSocketSimulation.js` opens Socket.IO using websocket and polling, tracks connection/status/errors/frame state, adapts snake_case backend fields to UI aliases, and stores the latest 120 history points per node.

The adapter exposes both canonical and short names, including `id/node_id`, `x/x_m`, `y/y_m`, `groundTruth/ground_truth`, `aiPrediction/ai_prediction`, `displacement/displacement_mm`, `tilt/tilt_magnitude_deg`, `vibration/vibration_rms_g`, `crackOpening/crack_opening_mm`, `battery/battery_v`, `rssi/rssi_dbm`, and `packetLoss/packet_loss_rate`.

Seeking updates the slider optimistically, pauses active replay, debounces the socket request by 60 ms, ignores mismatched frames while waiting, and clears the pending lock after 1.5 seconds if confirmation never arrives.

### Components

- `Header.jsx`: dashboard identity and live connection, sync, AI, and uptime indicators.
- `Sidebar.jsx`: branding and visual-only navigation labels; no routing is implemented.
- `SimulationControls.jsx`: start, pause, reset, range seeking, keyboard navigation, speed selection, progress, and jumps to days 8, 13, 16, and 18.
- `SensorMesh.jsx`: 4x4 coordinate-based grid showing status, readings, coordinates, AI text, battery, RSSI, and non-normal alert icons.
- `SelectedNodePanel.jsx`: all sensor metrics plus separate ground truth and AI prediction, risk, anomaly, and final status. It retains a legacy metric fallback.
- `AlertsPanel.jsx`: current generated incident stream.
- `HistoricalCharts.jsx`: Recharts lines for displacement, vibration, tilt, and crack opening from selected-node history.
- `DeformationMap.jsx`: Leaflet `CRS.Simple` local x/y map with node markers, connecting line, influence circles, selection highlight, and popups.
- `StatusLegend.jsx`: four status categories and colors.
- `StatCard.jsx`: reusable overview statistic card.

## Status Semantics

Defined in `frontend/src/data/mockData.js`:

| Display status | CSV label | Color |
| --- | --- | --- |
| Normal | `normal` | Green |
| Early Subsidence | `early_subsidence` | Amber |
| Active Subsidence | `active_subsidence` | Red |
| Sensor Fault | `sensor_fault` | Orange |

The frontend derives these display labels from the CSV label. The model prediction does not replace them.

## Dataset

`data/synthetic_mine_subsidence_mesh.csv` contains:

- 96,768 data rows.
- 6,048 complete timestamps.
- 16 nodes per timestamp.
- Five-minute readings from `2026-08-01T00:00:00` through `2026-08-21T23:55:00`.
- One panel, `PANEL_A`.
- x and y coordinates at 0, 50, 100, and 150 metres.

Label distribution:

| Label | Rows |
| --- | ---: |
| `normal` | 68,976 |
| `early_subsidence` | 15,204 |
| `active_subsidence` | 12,444 |
| `sensor_fault` | 144 |

Columns are `timestamp`, `node_id`, `x_m`, `y_m`, `panel_id`, the 13 sensor fields listed above, and `label`.

The frontend does not read this file directly. `frontend/public/data/` contains only `.gitkeep`; live readings arrive through Socket.IO.

## Legacy Mock Data

`frontend/src/data/mockData.js` contains status metadata, a static 16-node list, static system status, static alerts, static chart data, and static deformation zones. Only `STATUS_META` and the baseline `systemStatus` are used by the current live dashboard. The other arrays are stale demo fixtures and are not the live source.

## Installation and Running

Run the three services in separate terminals from the project root.

### ML service

```powershell
Set-Location .\ml-service
python -m pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8001
```

Check it with `Invoke-RestMethod http://localhost:8001/health`; `model_loaded` should be true.

### Backend

```powershell
Set-Location .\backend
npm install
npm run dev
```

Production-style start is `npm start`. Check `Invoke-RestMethod http://localhost:5001/api/health` and `Invoke-RestMethod http://localhost:5001/api/simulation/status`.

### Frontend

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Production-style commands are `npm run build` and `npm run preview`.

## End-to-End Flow

1. The ML service loads the joblib model bundle.
2. The backend reads and validates the CSV into chronological complete frames.
3. Vite serves the React application.
4. The browser connects to Socket.IO.
5. The backend sends status and the current frame.
6. The backend enriches each node with ML output when possible.
7. The hook adapts the frame and derives display status from ground truth.
8. The dashboard updates counts, mesh, selected-node values, map, alerts, and charts.
9. Start, pause, reset, seek, day jumps, and speed changes send commands back to the simulator.

## Current Limitations and Risks

- This is replayed CSV data, not live sensor ingestion.
- There is no database or persistence.
- There is no authentication or authorization.
- All connected clients share one simulator state.
- CSV loading is synchronous during startup.
- Incomplete 16-node timestamps are discarded.
- Replay timer pacing does not model actual five-minute time.
- The ML process and model bundle must be started and compatible separately.
- Health is checked once per frame, then up to 16 prediction calls run concurrently.
- A frame may say ML is connected even when one individual prediction falls back offline.
- Ground truth, not AI output, controls primary status visuals and alert severity.
- The map is a local coordinate view, not a geographic mine map.
- Day seeking selects the first matching UTC day only.
- Quick jumps expose only selected dataset days.
- History is capped at 120 readings per node.
- Sidebar navigation is not wired to routes.
- Packet loss is fractional in the CSV, while UI wording does not consistently clarify its scale.
- `SimulationControls.jsx` still logs seek actions to the browser console.
- There are no automated test scripts in either package manifest.
- The frontend build can warn that the JavaScript chunk exceeds Vite's 500 KB recommendation.

## Recommended Next Steps

1. Add automated tests for CSV grouping, frame completeness, seek bounds, speed validation, offline ML, and socket adaptation.
2. Add an example environment file documenting the port contract.
3. Document or reproduce how the joblib model bundle was trained.
4. Remove or label unused mock fixtures.
5. Standardize packet-loss units and formatting.
6. Add persistence and a real ingestion path for production use.
7. Add routing if sidebar navigation is intended to be functional.
8. Add client reconnection/loading tests.
9. Split the frontend bundle if the build-size warning affects deployment.

## Source of Truth by Concern

- Dataset and labels: `data/synthetic_mine_subsidence_mesh.csv`.
- Replay and frame construction: `backend/services/csvSimulator.js`.
- ML HTTP integration: `backend/services/mlService.js`.
- Backend routes and socket wiring: `backend/server.js` and `backend/routes/health.js`.
- Model API and decision rules: `ml-service/app.py`.
- Browser state and field adaptation: `frontend/src/hooks/useSocketSimulation.js`.
- Dashboard composition: `frontend/src/App.jsx`.
- UI components and styling: `frontend/src/components/` and `frontend/src/styles.css`.
- Status metadata and legacy fixtures: `frontend/src/data/mockData.js`.
