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
- **Beds & Rooms** (sidebar; admin, doctor, nurse and front desk) has two tabs and a **LIVE** badge that follows the API's `/beds/stream`. **Overview** shows five cards (total, occupied, available, cleaning, blocked) with a trend and sparkline, an occupancy ring, unit cards, a floor plan, rooms, the movement log, the cleaning list, a trend chart and bed suggestions. **Bed map** is the tile board of every ward and bed (free, occupied, cleaning, held, blocked), with a floor filter and a details panel.
- **Bed Agent** (same roles) has five tabs: **Overview** (queue, discharge and admission outlook, availability by unit), **Requests** (every request with its decision detail and actions), **Discharge planning**, **Utilization** and **Settings** (admin).
- **Admit patient** (admin and doctor) is one short form: patient, needs, notes and a priority, then **Find a bed**. The Bed Agent picks the bed on its own within the fixed rules; a toast follows the request. Oxygen or fall risk found in the notes is added automatically. Needs that change the ward (isolation, ventilator, pregnancy, monitor) hold the request as **Needs attention**: a doctor confirms or dismisses them. When no bed fits, the request waits, raises an alert (header bell, Tasks & Alerts with **Open request** for roles with bed pages) and retries as beds free up. Anyone on Beds & Rooms or Bed Agent sees a toast when that happens, and the bell re-counts every minute. Each request shows who decided and why: AI, AI (sample), Rules or Staff.
- **Assign by hand** (admin and doctor), from a request, opens the choose-a-bed and confirm steps. A bed is held for 5 minutes with a countdown, and choosing a bed outside the rules needs a reason.
- **Nurses and front desk** cannot admit. They discharge, **Mark cleaned**, **Block** and **Unblock** from the bed panel. Admins have the **Allocate beds automatically** switch in Settings; when it is off, new requests wait for someone to assign a bed by hand.
- **AI** wording shows a **SAMPLE** label while the API runs in sample mode; if the AI is off or slow, the rule-based choice is used with no error. Settings → AI Assistant has the on/off switch and **Check connection** (admin).

AI Agents and the Coordinator:
- **AI Agents** is a group in the sidebar (admin, doctor, nurse and front desk; not pharmacist or lab). It lists the Coordinator Agent, ER, Bed, Lab, Pharmacy, Discharge, Scheduling, Revenue and Patient Support. Only the Coordinator and Bed Agent are built. The other seven open a placeholder page that says which agent is coming. The group can be collapsed.
- **Coordinator Agent** page, live through the API's `/coordinator/stream` (a **LIVE** badge; it reloads every 30 seconds if the stream drops):
  - four cards: active workflows, agents coordinated, tasks routed today, escalations, with a 24-hour or 7-day range;
  - **Coordination queue**: the latest requests between agents, filtered by priority. **New request** (roles that may raise one) opens a short form;
  - **Workflow diagram**: the agents and the links between them. A link pulses when a message passes;
  - **Agent status** and **Coordination rules**. Admins switch rules on and off. Two are locked on (emergency first, escalate overdue). Rules for agents not built yet show "Coming with the … Agent";
  - **Decisions log**: what each agent decided and why;
  - **Approvals**: things that need a person (for example, a ward-changing need the Bed Agent could not decide). Only the roles an approval names can act or reassign it. **Open** goes to the request itself;
  - **Case view**: pick any row to see one patient's case: its number, steps, messages, clocks and approvals, until every agent's close check passes. Opening and closing times also appear on the patient's **Timeline**.
- **Ask box** at the foot of the page answers questions about the hospital's activity ("Pending approvals", "Show agent workload"). It only answers: it never creates, changes or sends anything. Names, UHIDs, phones and database ids are replaced on the server before any text goes to the AI, and are put back only in the answer you see. With the AI off or slow, a plain rule-based answer is shown.
- **Settings → Coordinator** (admin only): escalation ladders (which duty title is told, step by step, and how many minutes to wait), duty titles and who holds each one, and the rules. A title nobody holds goes to every admin.
- **Acknowledge** on escalation alerts: when a clock runs out (for example a bed request waiting too long) the alert goes to the holders of the ladder's duty title, else to admins, and shows in the header bell and **Tasks & Alerts**. **Acknowledge** stops the ladder from moving up. If nobody does, it goes to the next step.
- **Who sees what:** admin, doctor, nurse and front desk see the Coordinator page, cases and the Ask box. Admin only: Settings → Coordinator. Pharmacist and lab have no access.

Conventions:
- Patient-scoped records are always fetched by UHID. A screen never shows one patient's data under another patient's name; panels show an empty state instead.
- Missing clinical values render as "—", never as a typical reading.
- Writes go through the services and update local state from the server's response.

## Not connected yet

- **AI.** The Bed Agent is the only AI feature wired to the API (sample until the host has an Anthropic key). Panels marked **SAMPLE** (Consultation and EMR assistants, Voice to Notes) show canned demo text. Other "AI" answers summarise the open patient's record and say that AI is not connected.
- **Messaging providers.** WhatsApp/SMS sending and follow-up reminders report that nothing was sent.
- **Not built yet:** creating invoices, tasks and follow-ups; file upload for documents; lab and pharmacy ordering. These buttons say so when clicked.
- The guideline and knowledge libraries are bundled in `src/mock`, though the backend has `/api/knowledge` endpoints.
