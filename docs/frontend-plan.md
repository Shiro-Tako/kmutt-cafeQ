# Frontend plan

The temporary homepage lives at `/` and uses React Router and Tailwind CSS. React Router also handles unmatched paths with a link back home.

Add approved screens in `frontend/src/pages/`. Put reusable UI in `components/common/`, shared page structure in `components/layout/`, and API calls in `services/`. Use `assets/`, `hooks/`, and `data/` as the screens need them.

Confirm routes and API payloads with the team before connecting feature screens to Express. Use relative `/api` URLs so local requests go through Vite's development proxy.
