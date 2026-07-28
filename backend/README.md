# ResQNet Phase 3: Central Cloud & Triage FastAPI Backend

Production-grade asynchronous FastAPI backend engineered to receive, validate, store, and stream Emergency Packets transmitted by ResQNet mobile edge nodes and wireless gateways.

## Features & Subsystems
- **Packet Validation & Processing Firewall:** Inspects coordinate boundaries, expiration TTLs, and Emergency Confidence Scores ($0 \le \text{ECS} \le 100$), immediately halting transmission storms with cryptographic delivery receipts (`RQ-ACK-*`).
- **Real-Time WebSocket Broadcasts:** Low-latency streaming (`/api/v1/ws/incidents`) publishing active disaster alerts directly to rescue command center operations dashboards.
- **Relational PostgreSQL Repository:** Acid-compliant SQLAlchemy schema mapping 9 normalized tables including `incident_timeline`, `packet_log`, and `communication_log`.
- **Security & Middleware:** Structured JSON logging with tracing headers (`X-Request-ID`, `X-Packet-ID`, `X-Gateway-ID`), IP rate limiting, JWT token verification, and Ed25519 cryptographic interfaces.

## API Endpoints Reference
| HTTP Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/incidents/ingest` | Ingest and validate mobile SOS packet; return signed ACK |
| `POST` | `/api/v1/incidents/ack` | Explicitly register delivery receipt from secondary mesh gateway |
| `GET` | `/api/v1/incidents` | List active emergency incident reports ordered by timestamp |
| `GET` | `/api/v1/incidents/{id}` | Retrieve exhaustive incident telemetry and chronological timeline |
| `GET` | `/api/v1/health` | System health check monitoring database and active WebSocket sessions |
| `POST` | `/api/v1/users/register` | Register responder identity and clinical medical profile vault |
| `GET` | `/api/v1/users/{id}` | Lookup verified user identity and blood group triage records |
| `WS` | `/api/v1/ws/incidents` | Real-time bidirectional WebSocket live stream |

## Quickstart Testing & Docker Deployment
### 1. Run Unit Tests (In-Memory SQLite)
```bash
pip install -r requirements.txt
pytest tests/ -v
```

### 2. Launch Production Network (Docker Compose + PostgreSQL)
```bash
docker-compose up --build -d
```
The FastAPI documentation interactive UI will be live at `http://localhost:8000/docs`.
