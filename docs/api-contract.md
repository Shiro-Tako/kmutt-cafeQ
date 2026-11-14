# Provisional API contract

The team will agree on feature endpoints and payloads before implementation. During local development, the browser calls relative `/api` URLs and Vite forwards them to Express. When features need persistence, Express controllers will use the backend's mysql2 connection pool to query MySQL.

## GET /api/health

Returns HTTP 200 with JSON:

```json
{"status":"ok"}
```

This endpoint checks whether Express is responding and works independently of MySQL.
