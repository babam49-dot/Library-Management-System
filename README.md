# Library Management (scaffold)

This workspace contains a minimal fullstack scaffold:

- Backend: `backend/` — Express server and MySQL helper
- Frontend: `frontend/` — Vite + React app

Next steps (run locally):

```bash
# Start MySQL (option A: Docker)
docker compose up -d

# Backend
cd backend
# copy .env.sample to .env and set DB credentials
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

If you don't have Node installed, install it from https://nodejs.org/ or use your package manager.

Want me to also create migration scripts, API routes, or a Dockerfile for the backend? Reply with what you'd like next.
