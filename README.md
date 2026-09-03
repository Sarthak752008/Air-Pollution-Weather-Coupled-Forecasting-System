# AeroSense

**A physics-guided AI system for coupled air pollution and weather forecasting for Delhi NCR.**

AeroSense provides real-time air quality monitoring and machine-learning-based forecasting for the Delhi National Capital Region (NCR). 

## Architecture
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **Frontend**: Next.js, React, Tailwind CSS
- **ML**: XGBoost, Scikit-Learn, Pandas

## Modes
- **DEMO**: Uses synthetically generated, realistic data for demonstration purposes without requiring external API keys.
- **LIVE**: Connects to the real CPCB API (data.gov.in) to fetch actual sensor readings.

## Getting Started

### Backend
1. Copy `.env.example` to `.env`
2. Run `start_backend.bat` (Windows) or `./start_backend.sh` (Linux/Mac)

### Frontend
1. Run `start_frontend.bat` (Windows) or `./start_frontend.sh` (Linux/Mac)

### Docker (Optional)
Run `docker-compose up` in the `docker/` directory to spin up the whole system.

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `APP_MODE` | `DEMO` or `LIVE` |
| `DATABASE_URL` | Database connection string (e.g., `sqlite:///./data/aerosense.db`) |
| `CPCB_API_KEY` | API key from data.gov.in (Required for LIVE mode) |
| `LOG_LEVEL` | Logging level (e.g., `INFO`, `DEBUG`) |

## Roadmap
- Phase 1: MVP with XGBoost baseline (Current)
- Phase 2: Graph Neural Networks (GNN) integration
- Phase 3: WRF-Chem atmospheric modeling integration
- Phase 4: Satellite fire transport inclusion

## License
MIT
