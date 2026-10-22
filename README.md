# MediOS AI — Clinical Workstation (web)

React 19 + TypeScript + Vite web app for doctors: patients, appointments, consultation and EMR notes, labs, imaging, prescriptions, medications, billing, follow-ups, tasks, messages and settings. All records come from the MediOS backend in `../hospital backend`.

## Run it

```bash
# 1. Backend (see ../hospital backend/README.md)
cd "../hospital backend"
docker compose up -d mongodb
npm run seed          # demo hospital; login doctor@medios.ai / Admin@123
npm run start:dev     # API on http://localhost:4000/api

# 2. This app
cd "../hospital saas"
npm install
npm run dev           # http://localhost:5173, sign in with "Use demo account"
```

```bash
npm run build         # typecheck + production build
npm run lint          # oxlint
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000/api` | Backend base URL, including `/api` |
| `VITE_CLINIC_DATE` | real date | Pins the clinic's "today" (`YYYY-MM-DD`) |

`.env.development` sets `VITE_CLINIC_DATE=2026-09-26` because the seeded demo data is one clinic day on 26 Sep 2026; schedules, ranges and new records line up with it. Production builds use the real date.

## How it is wired

```
src/
├── services/api.ts        fetch client: in-memory access token, cookie refresh + retry on 401, unwraps { data }, ApiError
├── services/index.ts      one service per backend module (patients, appointments, consultations, …)
├── context/AppContext.tsx session (restore, sign in/out, idle sign-out), shared patient list, active patient, toasts
├── hooks/useLoader.ts     load a screen's records when deps change; errors become toasts
├── hooks/usePatientChart.ts  a patient's meds, labs, imaging, timeline and visits for summary panels
├── utils/clinicDate.ts    the clinic's "today" and the record date formats
├── components/screens/    one screen per sidebar item (+ Login, Timeline, Vitals, Documents)
└── mock/                  reference content only: templates, guideline/knowledge library, demo AI text
```

Sessions:
- The access token (15 minutes) lives only in memory, never in `localStorage`. The refresh token is an httpOnly cookie the page cannot read. On a page load the app asks `/auth/refresh` whether a session exists. On a `401` it refreshes once (concurrent requests share one refresh) and retries, then signs out.
- The API must list this app's origin in `CORS_ORIGIN`, and the app sends `X-MediOS-Client` on every request (the API's CSRF check).
- Settings → General has a working **Change password** dialog. Settings → Security lists **active sessions** with per-device and all-device sign-out. The **Session Timeout** setting signs out an idle workstation.
- 2FA, login alerts, IP restrictions and audit-log access are shown as "coming soon": the API does not enforce them yet.

Conventions:
- Patient-scoped records are always fetched by UHID. A screen never shows one patient's data under another patient's name; panels show an empty state instead.
- Missing clinical values render as "—", never as a typical reading.
- Writes go through the services and update local state from the server's response.

## Not connected yet

- **AI.** Panels marked **SAMPLE** (Consultation and EMR assistants, Voice to Notes) show canned demo text. Other "AI" answers summarise the open patient's record and say that AI is not connected.
- **Messaging providers.** WhatsApp/SMS sending and follow-up reminders report that nothing was sent.
- **Not built yet:** creating invoices, tasks and follow-ups; file upload for documents; lab and pharmacy ordering. These buttons say so when clicked.
- The guideline and knowledge libraries are bundled in `src/mock`, though the backend has `/api/knowledge` endpoints.
