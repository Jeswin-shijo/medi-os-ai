# Deploying the web app (Vercel)

The full guide covers the database, the API on Render, first accounts and the call agent. It lives with the API: [medios-ai-backend/DEPLOY.md](https://github.com/Jeswin-shijo/medios-ai-backend/blob/main/DEPLOY.md).

For this repository:

1. In Vercel, import this repository. [`vercel.json`](vercel.json) sets the build and serves the app for every path, so `/display` and `/kiosk` load too.
2. Set `VITE_API_URL` to the API address including `/api`, e.g. `https://medios-api.onrender.com/api`. Builds on Vercel fail with a message when it is missing; see [`vite.config.ts`](vite.config.ts).
3. Put the Vercel address in the API's `CORS_ORIGIN`, otherwise the browser blocks every request.

Don't set `VITE_CLINIC_DATE` in production: it pins the app's "today" to the demo day.
