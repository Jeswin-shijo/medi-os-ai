// "Today" for the workstation. The seeded demo data describes one clinic day,
// 26 Sep 2026, so development pins VITE_CLINIC_DATE to it (.env.development) and
// schedules, ranges and new records line up with the seed. Unset, it is the real date.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

const pinned = /^(\d{4})-(\d{2})-(\d{2})$/.exec(import.meta.env.VITE_CLINIC_DATE ?? '');

/** The clinic's current day at the real time of day. */
export const clinicNow = (): Date => {
  const now = new Date();
  if (pinned) now.setFullYear(Number(pinned[1]), Number(pinned[2]) - 1, Number(pinned[3]));
  return now;
};

/** Whole calendar days from the real date to the clinic's date: 0 when VITE_CLINIC_DATE is unset. */
const clinicDayShift = (): number => {
  if (!pinned) return 0;
  const real = new Date();
  real.setHours(12, 0, 0, 0);
  const clinic = clinicNow();
  clinic.setHours(12, 0, 0, 0);
  return Math.round((clinic.getTime() - real.getTime()) / 86_400_000);
};

/**
 * A real-clock time (agent messages, clocks, escalations, approvals) moved onto the clinic's calendar by
 * whole days, keeping the time of day, so a pinned demo reads "Today" for what happened today. As ISO.
 */
export const toClinicClock = (iso: string): string => {
  const shift = clinicDayShift();
  const d = new Date(iso);
  if (!shift || Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + shift);
  return d.toISOString();
};

/** "2026-09-26" — appointments and day queries use ISO days. */
export const isoDay = (d: Date = clinicNow()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "26 Sep 2026" — the format clinical records store. */
export const displayDate = (d: Date = clinicNow()) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** "09:30 AM" */
export const displayTime = (d: Date = clinicNow()) =>
  `${pad(d.getHours() % 12 || 12)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;

/** "26 Sep 2026, 09:30 AM" */
export const displayDateTime = (d: Date = clinicNow()) => `${displayDate(d)}, ${displayTime(d)}`;

/** Minutes since midnight for "09:30 AM", for sorting by the clock; 0 when unparseable. */
export const clockMinutes = (time: string) => {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
};
