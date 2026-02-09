# VetAI Consultant - Docker Deployment Guide

This guide explains how to deploy VetAI Consultant using Docker and Docker Compose.

## Prerequisites

- **Docker** (version 20.10 or higher) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (comes with Docker Desktop) - [Install Docker Compose](https://docs.docker.com/compose/install/)
- **Google Gemini API Key** - Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Quick Start

### 1. Clone or Download the Repository

```bash
git clone https://github.com/viroforyou-cpu/vetai-consultant.git
cd vetai-consultant
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.docker.example .env

# Edit .env and add your Gemini API key
# Required: API_KEY=your_actual_api_key_here
nano .env  # or use your preferred editor
```

### 3. Start the Application

```bash
# Build and start all services (frontend, backend, Qdrant)
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Access the Application

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8000
- **Qdrant Dashboard**: http://localhost:6333/dashboard

## Services Overview

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 80 | React SPA served by nginx |
| **Backend** | 8000 | Python FastAPI for file I/O and graph operations |
| **Qdrant** | 6333, 6334 | Vector database for semantic search |

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f qdrant
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes all data!)
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart frontend
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build frontend
```

## Data Persistence

Data is stored in Docker volumes and persists across container restarts:

- **consultation_data**: Patient consultation records
- **qdrant_data**: Vector embeddings for semantic search

To backup your data:

```bash
# Backup consultation data
docker run --rm -v vetai-consultant_consultation_data:/data -v $(pwd):/backup alpine tar czf /backup/consultation_data_backup.tar.gz -C /data .

# Backup Qdrant data
docker run --rm -v vetai-consultant_qdrant_data:/data -v $(pwd):/backup alpine tar czf /backup/qdrant_data_backup.tar.gz -C /data .
```

## Troubleshooting

### Port Already in Use

If port 80, 8000, or 6333 is already in use:

1. Edit the `docker-compose.yml` file
2. Change the port mapping (e.g., `8080:80` instead of `80:80`)
3. Restart: `docker-compose up -d`

### API Key Not Working

1. Verify your `.env` file has the correct `API_KEY` value
2. Restart services: `docker-compose restart`
3. Check logs: `docker-compose logs backend`

### Containers Not Starting

```bash
# Check detailed logs
docker-compose logs

# Check container status
docker-compose ps -a

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Out of Disk Space

```bash
# Remove unused Docker resources
docker system prune -a

# Remove only unused images
docker image prune -a
```

## Production Deployment

### Security Considerations

1. **API Key**: Never commit `.env` to version control
2. **HTTPS**: Use a reverse proxy (nginx, Traefik) for SSL termination
3. **Firewall**: Restrict port access (only 80/443 needed for users)

### Using a Reverse Proxy (Example with nginx)

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Resource Limits

To limit resource usage in `docker-compose.yml`:

```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## Uninstall

To completely remove VetAI Consultant:

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove the project directory
cd ..
rm -rf vetai-consultant
```

## Support

- **Issues**: https://github.com/viroforyou-cpu/vetai-consultant/issues
- **Documentation**: https://github.com/viroforyou-cpu/vetai-consultant

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │   nginx      │◄─────┤  Frontend    │                 │
│  │   (port 80)  │      │  (React SPA) │                 │
│  └──────────────┘      └──────────────┘                 │
│         ▲                                                │
│         │ API calls                                      │
│         ▼                                                │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │   Backend    │─────►│   Qdrant     │                 │
│  │  (FastAPI)   │      │  (vector DB) │                 │
│  │  (port 8000) │      │  (port 6333) │                 │
│  └──────────────┘      └──────────────┘                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
```
