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

/** "2026-09-26" — appointments and day queries use ISO days. */
export const isoDay = (d: Date = clinicNow()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "26 Sep 2026" — the format clinical records store. */
export const displayDate = (d: Date = clinicNow()) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** "09:30 AM" */
export const displayTime = (d: Date = clinicNow()) =>
  `${pad(d.getHours() % 12 || 12)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;

/** "26 Sep 2026, 09:30 AM" */
export const displayDateTime = (d: Date = clinicNow()) => `${displayDate(d)}, ${displayTime(d)}`;
