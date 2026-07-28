# ResQNet Phase 4: Disaster Command Center (Admin Dashboard)

A professional, wall-display friendly Disaster Command Center built with Next.js 15, React 19, TypeScript, and Tailwind CSS. The application connects directly to the Phase 3 FastAPI Backend (`http://localhost:8000/api/v1` and `ws://localhost:8000/api/v1/ws/incidents`), providing rescue dispatchers with zero-latency situational awareness.

## Features & Core Capabilities
- **Real-Time WebSocket Ingest & Alerting:** Automatically injects new distress packets and cryptographic ACK confirmations onto the map without page reloads.
- **Interactive Layered Geospatial Canvas:** Vector-rendered SVG grid mapping critical incidents, online responder fleets, edge gateways, trauma hospitals, and civilian shelters with real-time toggle filtering.
- **Role-Based Security:** Features an authentic operator login system supporting 4 distinct tactical clearances (`Administrator`, `Dispatcher`, `Responder`, `Viewer`). Only Admins and Dispatchers are permitted to assign ambulance units or resolve field alerts.
- **Forensic Medical Vault & Route Interrogation:** Deep drill-down view (`/incidents/[id]`) presenting decrypted Ed25519 clinical health vault profiles, severe allergy warnings, emergency contact hotlinks, and multi-hop Bluetooth Mesh relay paths.

## Running Locally
Navigate to the `dashboard/` root directory, install modern dependencies, and start the developmental server:
```bash
cd dashboard
npm install
npm run dev
```
The Disaster Command Center will immediately become accessible in your browser at **`http://localhost:3000`**.

## Architecture & Integration Notes
- **Zero Regression Guaranteed:** Operates as a completely standalone web workspace without altering or depending on modifications to existing mobile client code or backend routers.
- **Resilient Fallback Mode:** If the Phase 3 FastAPI PostgreSQL server is temporarily offline during testing, the dashboard transparently switches to an in-memory simulation repository without interrupting interface evaluation!
