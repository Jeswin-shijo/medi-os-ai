import { QueueToken, TokenStatus } from '../types';
import { displayDate, displayTime } from './clinicDate';

/**
 * The link a display screen opens. The key rides in the URL fragment, which the
 * browser never sends to any server; the display page reads it and sends it to the
 * API in a header.
 */
export const displayLink = (key: string) => `${window.location.origin}/display#key=${encodeURIComponent(key)}`;

/** The link a check-in kiosk opens, on the computer the USB card reader is plugged into. */
export const kioskLink = (key: string) => `${window.location.origin}/kiosk#key=${encodeURIComponent(key)}`;

export const TOKEN_STATUS_META: Record<TokenStatus, { label: string; pill: string }> = {
  waiting: { label: 'Waiting', pill: 'waiting' },
  called: { label: 'With doctor', pill: 'in-consultation' },
  skipped: { label: 'Skipped', pill: 'red' },
  completed: { label: 'Seen', pill: 'completed' },
  cancelled: { label: 'Cancelled', pill: 'gray' }
};

const MINUTE = 60_000;

/** "12 min" since `iso`; null past a working day (a stale or seeded record). */
export function minutesSince(iso: string | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const minutes = Math.floor((now - new Date(iso).getTime()) / MINUTE);
  if (minutes < 0 || minutes > 12 * 60) return null;
  return minutes < 1 ? 'just now' : minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** "09:05 AM" in the browser's time zone. */
export const clockOf = (iso: string | undefined) => (iso ? displayTime(new Date(iso)) : '—');

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** What a token slip shows. */
export interface TokenSlip {
  hospitalName: string;
  label: string;
  name: string;
  /** "Appointment 10:30 AM" or "Walk-in". */
  visit: string;
  issuedAt: string;
  /** People ahead when it was issued. */
  ahead?: number;
}

export const slipFor = (token: QueueToken, hospitalName: string): TokenSlip => ({
  hospitalName,
  label: token.label,
  name: token.patientName,
  visit: token.appointmentTime ? `Appointment ${token.appointmentTime}` : 'Walk-in',
  issuedAt: token.createdAt
});

/**
 * Prints a token slip sized for an 80 mm receipt printer from a hidden frame, so
 * no pop-up is needed. On a kiosk started with Chrome's --kiosk-printing flag it
 * goes straight to the default printer; elsewhere the print dialog opens.
 */
export function printTokenSlip(slip: TokenSlip) {
  const issued = new Date(slip.issuedAt);
  const ahead = slip.ahead === undefined ? '' : slip.ahead === 0 ? 'You are next in line' : `${slip.ahead} ${slip.ahead === 1 ? 'person' : 'people'} ahead of you`;
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Token ${escapeHtml(slip.label)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  body { font-family: 'IBM Plex Sans', Arial, sans-serif; text-align: center; color: #000; margin: 0; padding: 8px; }
  .h { font-size: 14px; font-weight: 700; }
  .l { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; margin-top: 12px; }
  .n { font-size: 72px; font-weight: 700; line-height: 1; margin: 6px 0 10px; }
  .p { font-size: 14px; font-weight: 600; }
  .m { font-size: 12px; margin-top: 4px; }
  .f { font-size: 11px; margin-top: 14px; border-top: 1px dashed #000; padding-top: 8px; line-height: 1.5; }
</style></head><body>
  <div class="h">${escapeHtml(slip.hospitalName || 'MediOS')}</div>
  <div class="l">Your token</div>
  <div class="n">${escapeHtml(slip.label)}</div>
  <div class="p">${escapeHtml(slip.name)}</div>
  <div class="m">${escapeHtml(slip.visit)}</div>
  ${ahead ? `<div class="m">${escapeHtml(ahead)}</div>` : ''}
  <div class="m">Issued ${escapeHtml(`${displayDate(issued)}, ${displayTime(issued)}`)}</div>
  <div class="f">Please wait until your number is shown on the screen and go to the room it names.</div>
</body></html>`);
  doc.close();
  const win = frame.contentWindow!;
  // The page keeps keyboard focus: a kiosk's card reader types into it.
  const remove = () => {
    frame.remove();
    window.focus();
  };
  win.addEventListener('afterprint', () => window.setTimeout(remove, 100));
  window.setTimeout(() => win.print(), 50);
  window.setTimeout(remove, 60_000);
}
