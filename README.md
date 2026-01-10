# GoDam Inventory Platform (v1.2)
This repository keeps the GoDam stack together in one place so each component can be found under its own directory while transitional notes are quarantined for later review.

## Overview
- **`backend-java/`**: Spring Boot API that now includes JWT authentication, user seeding, and supporting deployment scripts.
- **`flutter/`**: Mobile workspace with Android/iOS clients, redesign plans, and automation scripts for building and deploying APKs.
- **`web-admin/`**: React + Vite admin panel with the new login flow, protected routes, and deployment helpers.
- **`godam-app-from-vps/`**: Snapshot of the VPS database manager, migrations, and companion web/mobile assets that were rolled into the VPS build.
- **`test reports/`**: QA reports, deployment logs, and server automation scripts used for validation and operations.

## Repository Layout
- `README.md` (this summary)
- `godam_backend_restart.sh` / `login_ssh.sh` — helper scripts used during VPS restarts or SSH access.
- `schema_sqlserver_final.sql` — final SQL Server schema reference.
- `index.html` — front-facing landing page that mirrors the admin stub.
- `delete/` — legacy analysis/plan artifacts moved out of the working tree. Keep them only temporarily for audit; they can be removed once reviewed.

## Dockerized workflow
1. Build and run everything via Docker Compose at the repo root:
   ```bash
   docker compose up --build
   ```
   - `backend` listens on `localhost:8081` and now connects to the new `postgres` service (`jdbc:postgresql://postgres:5432/godam`); the schema is applied automatically via Hibernate.
   - `postgres` keeps the single `admin` account (username: `admin`, password: `admin`, role: `ADMIN`). The command-line runner now purges any existing data and recreates that user each time you recreate the database.
   - `web-admin` is a static Nginx site on `localhost:8082` that proxies `/api` to the backend service so browsers never see the internal host.
   - The Docker build argument `VITE_API_BASE_URL` defaults to `/api`; change it only when your frontend must hit a different backend host.
2. The stack can also be deployed individually:
   - `backend-java/docker-compose.yml` still builds the API alone.
   - `web-admin/Dockerfile` + `nginx.conf` produce a production-ready static image.
3. After Docker runs cleanly, commit and push the code; no need to start services manually.
