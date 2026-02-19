# VetAI Consultant - Docker Deployment Guide

## Quick Start

1. **Get the application**
   ```bash
   git clone https://github.com/viroforyou-cpu/vetai-consultant.git
   cd vetai-consultant
   ```

2. **Get API Keys**
   - **GLM API Key**: Go to https://open.bigmodel.cn/ (for transcription, search)
   - **Gemini API Key**: Go to https://aistudio.google.com/app/apikey (for knowledge graphs)

3. **Configure environment**
   ```bash
   cp .env.docker.example .env
   # Edit .env and add your API keys
   nano .env  # or use your preferred editor
   ```

4. **Start the application**
   ```bash
   docker-compose up -d
   ```

5. **Open your browser**
   - Go to http://localhost:8080
   - The application is ready to use!

## What's Included

The Docker deployment includes **4 services**:

- **Frontend**: React SPA with nginx (port 8080)
  - VetAI consultation interface
  - Upload, search, analytics, and graph views
  - Dark mode support
  - Responsive design

- **Backend**: FastAPI Python server (port 8000)
  - File I/O operations
  - Knowledge graph operations via Graphiti
  - FalkorDB integration
  - API endpoints for graph queries

- **FalkorDB**: Graph database (port 6379)
  - Temporal knowledge graph storage
  - Entity and relationship persistence
  - Multi-date patient tracking
  - Persistent data storage

- **Database**: PostgreSQL 16 with pgvector extension (port 54324)
  - Stores consultation records
  - Vector similarity search using pgvector
  - Automatic database migrations on startup
  - Persistent data storage

- **AI Integration**:
  - **GLM 4.7** (ZhipuAI/Z.ai) - Transcription, semantic search, data extraction
  - **Gemini** (Google AI) - Graphiti knowledge graph LLM client

## Knowledge Graph Features

The application includes a **temporal knowledge graph** powered by Graphiti and FalkorDB:

### What It Does

- **Temporal Entity Extraction**: Automatically extracts entities (patients, owners, veterinarians, diagnoses, treatments, medications) from consultations
- **Multi-Date Patient Tracking**: Visualizes how a patient's condition changes across multiple consultation dates
- **Relationship Mapping**: Shows connections between entities (e.g., patient → diagnosed with → treatment)
- **RAG Question Answering**: Ask questions against the knowledge graph with retrieval-augmented generation
- **D3.js Visualization**: Interactive force-directed graph display

### How to Use

1. **Upload consultations** for a patient on multiple dates
2. **Go to Graph view** and select the patient
3. **Click "Generate Knowledge Graph"** to extract entities and relationships
4. **Explore the graph**:
   - Nodes represent entities (patient, diagnosis, treatment, etc.)
   - Edges represent relationships
   - Color indicates entity type
   - Size indicates importance

### Graph API Endpoints

The backend provides these endpoints (accessible via `/api/`):

- `POST /api/graph/add` - Add consultation to knowledge graph
- `GET /api/graph/patient/{patient_name}` - Get patient's knowledge graph
- `GET /api/graph/search?query=...` - Search knowledge graph
- `GET /api/graph/ask?question=...` - Ask question with RAG

## System Requirements

- Docker Engine 20.10+ or Docker Desktop
- 4 GB RAM minimum (6 GB recommended for knowledge graphs)
- 5 GB disk space minimum

## Port Usage

By default, the following ports are used:

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 8080 | Web application |
| Backend | 8000 | FastAPI server |
| FalkorDB | 6379 | Graph database |
| PostgreSQL | 54324 | Relational database |

To change ports, edit `.env`:
```bash
FRONTEND_PORT=3000    # Change frontend to port 3000
BACKEND_PORT=8001     # Change backend to port 8001
FALKORDB_PORT=6380    # Change FalkorDB to port 6380
POSTGRES_PORT=5433    # Change database to port 5433
```

## Common Commands

### Start the application
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Frontend only
docker-compose logs -f frontend

# Backend only
docker-compose logs -f backend

# FalkorDB only
docker-compose logs -f falkordb

# Database only
docker-compose logs -f postgres
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Access the database directly
```bash
# Connect to PostgreSQL
docker exec -it vetai-consultant-postgres psql -U vetai -d vetai

# List tables
\dt

# View consultations
SELECT id, patient_name, summary, created_at FROM consultations LIMIT 10;

# Exit
\q
```

### Access FalkorDB directly
```bash
# Connect to FalkorDB
docker exec -it vetai-consultant-falkordb redis-cli

# Test connection
PING

# View graph data
GRAPH.QUERY vetai_graph "MATCH (n) RETURN n"

# Exit
EXIT
```

### Reset everything (delete all data)
```bash
docker-compose down -v
docker-compose up -d
```

## Troubleshooting

### Port already in use
If you get an error about ports being in use:
1. Edit `.env` and change the port numbers
2. Or stop the conflicting service
3. Restart: `docker-compose up -d`

### Application won't start
1. Check logs: `docker-compose logs`
2. Ensure Docker is running: `docker ps`
3. Verify API keys are set correctly in `.env` (both GLM and Gemini)

### Can't save consultations
1. Check database is healthy: `docker-compose ps`
2. Check backend is running: `docker-compose logs backend`
3. Ensure migrations ran successfully

### AI features not working
1. **GLM (transcription, search)**: Verify GLM API key at https://open.bigmodel.cn/
2. **Knowledge graphs**: Verify Gemini API key at https://aistudio.google.com/
3. Check browser console for API errors (F12)

### Knowledge graph not generating
1. Check FalkorDB is running: `docker-compose logs falkordb`
2. Check backend is running: `docker-compose logs backend`
3. Verify Gemini API key is set in backend environment
4. Try uploading multiple consultations for the same patient on different dates

### Graph visualization appears empty
1. Ensure you have uploaded consultations for the selected patient
2. Check that backend service is healthy: `docker-compose ps`
3. Review backend logs for errors: `docker-compose logs backend`
4. Verify FalkorDB has data: `docker exec -it vetai-consultant-falkordb redis-cli`

## Data Backup

Your data persists in Docker volumes. To backup:

### Export PostgreSQL database
```bash
# Export to SQL file
docker exec vetai-consultant-postgres pg_dump -U vetai vetai > backup_postgres_$(date +%Y%m%d).sql
```

### Export FalkorDB graph data
```bash
# Export graph data to JSON
docker exec vetai-consultant-falkordb redis-cli GRAPH.REQUERY vetai_graph > backup_falkordb_$(date +%Y%m%d).json
```

### Import PostgreSQL database
```bash
# Import from SQL file
cat backup_postgres_20250219.sql | docker exec -i vetai-consultant-postgres psql -U vetai -d vetai
```

## Updates

To update to a new version:

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

Your data will be preserved in the Docker volumes.

## Security Notes

1. **API Keys**: Never share your `.env` file or commit it to version control
2. **Default Passwords**: Change `POSTGRES_PASSWORD` in `.env` for production
3. **Firewall**: Consider running behind a firewall for production
4. **HTTPS**: For production deployment, add a reverse proxy with SSL
5. **FalkorDB**: Not exposed to external network by default

## Production Deployment

For production use, consider:

1. **Change default passwords** in `.env`
2. **Add SSL/TLS** using a reverse proxy (Traefik, nginx, Caddy)
3. **Set up backups** for PostgreSQL and FalkorDB volumes
4. **Monitor resources** (CPU, RAM, disk)
5. **Use separate API keys** for development and production
6. **Configure resource limits** in docker-compose.yml for production

## Getting Help

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Review this README
3. Check GitHub issues: https://github.com/viroforyou-cpu/vetai-consultant/issues
4. Create a new issue with details

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host                               │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Frontend Container (nginx + React)       │    │
│  │  Port: 8080                                        │    │
│  │  - Proxies /api/ to backend                        │    │
│  │  - Serves React SPA                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                         │                                   │
│                         │ /api/ requests                    │
│                         ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Backend Container (FastAPI)              │    │
│  │  Port: 8000                                        │    │
│  │  - Graph operations via Graphiti                    │    │
│  │  - File I/O                                         │    │
│  │  - FalkorDB queries                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                         │                                   │
│         ┌────────────────┴────────────────┐                 │
│         │                                  │                 │
│         ▼                                  ▼                 │
│  ┌──────────────┐                  ┌──────────────┐        │
│  │  FalkorDB    │                  │  PostgreSQL  │        │
│  │  Port: 6379  │                  │  Port: 54324 │        │
│  │  - Graph DB  │                  │  - Relations │        │
│  │  - Entities  │                  │  - Vectors   │        │
│  │  - Episodes  │                  │  - Attachments│       │
│  └──────────────┘                  └──────────────┘        │
│                                                             │
│  Docker Network: vetai-network                              │
│  Volumes: postgres_data, falkordb_data, backend_data       │
└─────────────────────────────────────────────────────────────┘
         │
         │ Client-side API calls (GLM 4.7)
         ▼
    ┌─────────────┐
    │  Z.ai /     │
    │  ZhipuAI    │
    │  GLM 4.7    │
    └─────────────┘

         │ Backend API calls (Gemini)
         ▼
    ┌─────────────┐
    │  Google AI  │
    │  Gemini     │
    └─────────────┘
```

## License

This project is licensed under the MIT License.

## Credits

- **AI Models**: GLM 4.7 by ZhipuAI (Z.ai), Gemini by Google
- **Graph Library**: Graphiti for temporal knowledge graphs
- **Databases**: PostgreSQL with pgvector, FalkorDB
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Visualization**: D3.js
- **Web Server**: nginx

---

**Last Updated:** 2026-02-19
**Version:** 1.1.0 (with Knowledge Graph)
