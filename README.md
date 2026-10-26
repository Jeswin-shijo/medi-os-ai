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
├── hooks/useCallRunner.ts  start an AI call and report its outcome
├── display/               the waiting-room display (/display): live feed, announcer, full-screen layout
├── kiosk/                 the card check-in kiosk (/kiosk): taps, result screen, slip printing
├── components/screens/    one screen per sidebar item (+ Login, Timeline, Vitals, Documents)
└── mock/                  reference content only: templates, guideline/knowledge library, demo AI text
```

Sessions:
- The access token (15 minutes) lives only in memory, never in `localStorage`. The refresh token is an httpOnly cookie the page cannot read. On a page load the app asks `/auth/refresh` whether a session exists. On a `401` it refreshes once (concurrent requests share one refresh) and retries, then signs out.
- The API must list this app's origin in `CORS_ORIGIN`, and the app sends `X-MediOS-Client` on every request (the API's CSRF check).
- Settings → General has a working **Change password** dialog. Settings → Security lists **active sessions** with per-device and all-device sign-out. The **Session Timeout** setting signs out an idle workstation.
- 2FA, login alerts, IP restrictions and audit-log access are shown as "coming soon": the API does not enforce them yet.

AI Call Agent:
- **AI Call Agent** screen (sidebar):
  - today's call numbers;
  - the call log with each conversation, the slots offered and what the system changed;
  - automation settings (automatic confirmations, calling hours, retries, bookable sessions, closed days);
  - the agent scripts to paste into the voice provider.
- **Appointments**:
  - each scheduled row shows a confirmation icon;
  - the details panel has **Call to confirm** and the latest call's result;
  - **Book by AI Call** in the header.
- **Follow-ups**: **Book by AI Call** in a row's menu. A booked slot updates the follow-up.
- `hooks/useCallRunner.ts` starts a call and follows it to the end with toasts. With the backend's simulated provider no phone rings; the screen says so and lets you pick how the pretend patient answers.

Token queue:
- **Token Queue** screen (sidebar):
  - check patients in: today's expected appointments, or search any registered patient for a walk-in, with priority and a note;
  - the room's current token with **Done, call next**, **Announce again**, **Did not come** and **Done only**;
  - the waiting line, skipped tokens and today's completed ones. Token slips can be printed.
  - Admins and doctors also get **Displays & Settings**: rooms, token prefix, announcements, names on the display, and display links.
- **Appointments**: **Check In** issues the token, and today's rows show their token number.
- **Card taps at the front desk.** A USB NFC reader on the reception computer works on the Token Queue screen:
  - a linked card checks its patient in;
  - an unknown card opens **New card**: pick the patient, link the card, and they are checked in.

  The card icon on a search result lists a patient's cards and links a new one: the reader types into the focused field. `hooks/useCardReader.ts` tells a reader's burst of keystrokes from typing by its speed. It ignores keys typed into text boxes.
- **Check-in kiosk** at `/kiosk#key=…`, on the computer the reader is plugged into:
  - The patient taps their card. The kiosk shows "Welcome, David R.", their token and how many are ahead, then resets after 10 s.
  - If the kiosk is set to print, it prints an 80 mm slip. For printing without a dialog, start Chrome with `--kiosk --kiosk-printing` and make the receipt printer the default.
  - An unknown card is sent to the front desk. A double tap shows the same token and does not reprint.
  - Add `&test=1` to the link for a box to type a card number in, for trying it without a reader.
  - Kiosks are added under **Displays & Settings**, each with a print switch.
- **Waiting-room display** at `/display#key=…`: full screen and without sign-in, made for a TV or monitor. It shows the called tokens with their rooms and who is next, and updates live. After one click it plays a chime and reads each call aloud, and it asks the screen to stay awake.
  - The key stays in the URL fragment, which browsers never send to a server.
  - The host must serve `index.html` for `/display` and `/kiosk`, as for any single-page app.

Beds:
- **Beds** screen (sidebar; admin, doctor, nurse and front desk): a live board of every ward and bed, coloured and iconed by state (free, occupied, cleaning, held, blocked), with totals, a floor filter and a details panel for the selected bed. It follows the API's `/beds/stream` and re-reads the board on each change, and it refreshes the sign-in first if the access token has expired.
- **Admit patient** is a three-step dialog: patient and needs, then choose a bed, then confirm. Fixed rules remove unsuitable beds; the top suggestions come with a short reason. A bed is held for 5 minutes while you confirm, with a countdown. Choosing a bed outside the rules (admin and doctor only) needs a reason.
- The bed panel offers **Admit here**, **Transfer** (same dialog, starting from the patient's current bed), **Discharge**, **Mark cleaned**, **Block** and **Unblock**, depending on the bed's state and your role.
- **AI suggestions** show a **SAMPLE** label while the API runs in sample mode; if the AI is off or slow, the rule-based list shows with no error. Settings → AI Assistant has the on/off switch and **Check connection** (admin).

Conventions:
- Patient-scoped records are always fetched by UHID. A screen never shows one patient's data under another patient's name; panels show an empty state instead.
- Missing clinical values render as "—", never as a typical reading.
- Writes go through the services and update local state from the server's response.

## Not connected yet

- **AI.** The Beds suggestions are the only AI feature wired to the API (sample until the host has an Anthropic key). Panels marked **SAMPLE** (Consultation and EMR assistants, Voice to Notes) show canned demo text. Other "AI" answers summarise the open patient's record and say that AI is not connected.
- **Messaging providers.** WhatsApp/SMS sending and follow-up reminders report that nothing was sent.
- **Not built yet:** creating invoices, tasks and follow-ups; file upload for documents; lab and pharmacy ordering. These buttons say so when clicked.
- The guideline and knowledge libraries are bundled in `src/mock`, though the backend has `/api/knowledge` endpoints.
