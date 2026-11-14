# Project instructions

## Ownership

- Member 1 owns `frontend/` and the backend café and menu modules.
- Member 2 owns the backend auth, checkout, order, and favorites modules, plus `backend/src/server.js` and shared backend configuration.
- The database developer owns `database/`, including schema and development seed data.
- The team coordinates shared changes in `docs/`, the root README, and this file. Agree on API and schema changes before relying on them across folders.
- See [the team plan](docs/team-plan.md) for the full file assignments.

## Coding conventions

- Use JavaScript ES modules and two-space indentation. Use PascalCase for React components and camelCase for functions and variables.
- Put page components in `frontend/src/pages/` and shared API calls in `frontend/src/services/`. Use relative `/api` URLs in the frontend.
- Keep HTTP routing in `backend/src/routes/`, request handling in `backend/src/controllers/`, and shared connection configuration in `backend/src/config/`.
- Use mysql2 parameterized queries when adding database access. Keep local credentials in ignored `.env` files and document variables in `.env.example`.
- Keep changes focused. Coordinate the Figma implementation, authentication, and payments as separate work.

## Verification

From the repository root in PowerShell, build the frontend with `npm.cmd --prefix frontend run build`. Start the backend with `npm.cmd --prefix backend run dev` and the frontend with `npm.cmd --prefix frontend run dev` in separate terminals. Use `Invoke-RestMethod http://127.0.0.1:3000/api/health` and `Invoke-RestMethod http://localhost:5173/api/health` to check Express and the Vite proxy. Open the frontend in a browser to check rendering and routing.
