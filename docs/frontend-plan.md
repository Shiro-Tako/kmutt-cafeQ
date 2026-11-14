# Frontend plan

The React app has customer and staff screens. The current ordering and staff flows use browser-local demo data. Member 1 owns frontend integration and the café and menu API.

Add approved screens in `frontend/src/pages/`. Put reusable UI in `components/common/`, shared page structure in `components/layout/`, and API calls in `services/`. Use `assets/`, `hooks/`, and `data/` as the screens need them.

Use the [API contract](api-contract.md) mock JSON in services while backend endpoints are in progress. Connect café and menu screens first, then auth, checkout, orders, the staff queue, and favorites. Use relative `/api` URLs so local requests go through Vite's development proxy. Keep cart quantities local and use the server's quote and confirmed order totals.
