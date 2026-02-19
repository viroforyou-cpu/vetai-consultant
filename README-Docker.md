# VetAI Consultant - Docker Deployment Guide

## Quick Start

1. **Get the application**
   ```bash
   git clone https://github.com/viroforyou-cpu/vetai-consultant.git
   cd vetai-consultant
   ```

2. **Get a GLM API Key**
   - Go to https://open.bigmodel.cn/
   - Sign up for a free account
   - Get your API key

3. **Configure environment**
   ```bash
   cp .env.docker.example .env
   # Edit .env and replace 'your_glm_api_key_here' with your actual API key
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

The Docker container includes:

- **Frontend**: React SPA with nginx (port 8080)
  - VetAI consultation interface
  - Upload, search, analytics, and graph views
  - Dark mode support
  - Responsive design

- **Database**: PostgreSQL 16 with pgvector extension (port 54324)
  - Stores consultation records
  - Vector similarity search using pgvector
  - Automatic database migrations on startup
  - Persistent data storage

- **AI Integration**: GLM 4.7 via ZhipuAI (Z.ai)
  - Transcription of audio consultations
  - Data extraction (administrative + clinical)
  - Semantic search with embeddings
  - Direct client-side API calls

## System Requirements

- Docker Engine 20.10+ or Docker Desktop
- 2 GB RAM minimum (4 GB recommended)
- 5 GB disk space minimum

## Port Usage

By default, the following ports are used:

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 8080 | Web application |
| PostgreSQL | 54324 | Database |

To change ports, edit `.env`:
```bash
FRONTEND_PORT=3000    # Change frontend to port 3000
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
3. Verify API key is set correctly in `.env`

### Can't save consultations
1. Check database is healthy: `docker-compose ps`
2. Check frontend can reach database: `docker-compose logs frontend`
3. Ensure migrations ran successfully: `docker exec -it vetai-consultant-postgres psql -U vetai -c "\dt"`

### AI features not working
1. Verify API key is valid: Check at https://open.bigmodel.cn/
2. Check browser console for API errors (F12)
3. Verify network connectivity from your browser to Z.ai

## Data Backup

Your data persists in Docker volumes. To backup:

### Export database
```bash
# Export to SQL file
docker exec vetai-consultant-postgres pg_dump -U vetai vetai > backup_$(date +%Y%m%d).sql
```

### Import database
```bash
# Import from SQL file
cat backup_20250219.sql | docker exec -i vetai-consultant-postgres psql -U vetai -d vetai
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

1. **API Key**: Never share your `.env` file or commit it to version control
2. **Default Password**: Change `POSTGRES_PASSWORD` in `.env` for production
3. **Firewall**: Consider running behind a firewall for production
4. **HTTPS**: For production deployment, add a reverse proxy with SSL

## Production Deployment

For production use, consider:

1. **Change default passwords** in `.env`
2. **Add SSL/TLS** using a reverse proxy (Traefik, nginx, Caddy)
3. **Set up backups** for the PostgreSQL volume
4. **Monitor resources** (CPU, RAM, disk)
5. **Use separate API keys** for development and production

## Getting Help

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Review this README
3. Check GitHub issues: https://github.com/viroforyou-cpu/vetai-consultant/issues
4. Create a new issue with details

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                            │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Frontend Container                      │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  nginx:alpine                               │  │   │
│  │  │  ├── React SPA (Vite build)                 │  │   │
│  │  │  ├── Static assets                          │  │   │
│  │  │  └── Port 8080 (nginx)                      │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │          PostgreSQL Container                     │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  PostgreSQL 16 + pgvector                  │  │   │
│  │  │  ├── consultations table                    │  │   │
│  │  │  ├── attachments table                       │  │   │
│  │  │  ├── HNSW vector index                      │  │   │
│  │  │  └── Port 54324                             │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  Docker Network: vetai-network                         │
│  Volumes: postgres_data (persistent)                   │
└─────────────────────────────────────────────────────────┘
         │
         │ Client-side API calls to Z.ai
         ▼
    ┌─────────────┐
    │  Z.ai /      │
    │  ZhipuAI    │
    │  GLM 4.7    │
    └─────────────┘
```

## License

This project is licensed under the MIT License.

## Credits

- AI Model: GLM 4.7 by ZhipuAI (Z.ai)
- Database: PostgreSQL with pgvector extension
- Frontend: React + Vite + Tailwind CSS
- Web Server: nginx

---

**Last Updated:** 2026-02-19
**Version:** 1.0.0
