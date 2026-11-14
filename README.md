# KMUTT Café Queue System

A university project for managing café queues. The foundation includes a temporary homepage and an Express health endpoint.

| Folder | Responsibility |
| --- | --- |
| `frontend/` | React, Vite, Tailwind CSS v4, and React Router |
| `backend/` | Express API and mysql2 connection configuration |
| `database/` | MySQL schema and seed placeholders |
| `docs/` | Provisional API contract and frontend plan |

## Windows setup

Install Node.js 24 LTS with npm. Open PowerShell in the cloned repository and run:

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix backend ci
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Run the copy commands on first setup. The example values are enough for the homepage and health checks. Edit the backend's `DB_*` values when the team begins connecting to MySQL. If you change the backend's `PORT`, update `API_PROXY_TARGET` in `frontend/.env` to match and restart both servers.

## Local development

From the repository root, start the backend and frontend in separate PowerShell windows:

```powershell
npm.cmd --prefix backend run dev
```

```powershell
npm.cmd --prefix frontend run dev
```

Open [http://localhost:5173](http://localhost:5173) for the homepage. Use the following commands to check Express directly, check the Vite proxy, and build the frontend:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
Invoke-RestMethod http://localhost:5173/api/health
npm.cmd --prefix frontend run build
```

Both health requests return `{"status":"ok"}` and work without MySQL. During development, Vite forwards the frontend's relative `/api` requests to Express. When the team adds data-backed endpoints, Express will query MySQL through mysql2. The SQL files are placeholders until the team agrees on the schema. See the [provisional API contract](docs/api-contract.md) and [frontend plan](docs/frontend-plan.md).
