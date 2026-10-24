import { useEffect, useRef, useState } from 'react';
import { CircleAlert, MousePointerClick, Nfc, Printer, Star } from 'lucide-react';
import { KioskTapResult } from '../types';
import { useCardReader } from '../hooks/useCardReader';
import { printTokenSlip } from '../utils/queue';
import { KioskError, KioskState, kioskApi } from './kioskApi';
import './kiosk.css';

// The self-service check-in point at /kiosk#key=…, run full screen on the computer
// the USB card reader is plugged into. A patient taps their card; the kiosk shows
// their token and how many people are ahead, and prints a slip if set to.

/** How long a result stays up before the kiosk is ready for the next patient. */
const RESULT_MS = 10_000;
const MESSAGE_MS = 7_000;
/** A repeated tap reprints a slip only after this long (no paper wasted on double taps). */
const REPRINT_AFTER_MS = 60_000;
const OFFLINE_RETRY_MS = 10_000;

type Phase =
  | { kind: 'loading' }
  | { kind: 'offline'; message: string }
  | { kind: 'revoked'; message: string }
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'done'; result: KioskTapResult; printed: boolean }
  | { kind: 'unknown' }
  | { kind: 'error'; message: string };

const params = () => new URLSearchParams(window.location.hash.slice(1));
const pad = (n: number) => String(n).padStart(2, '0');

/** Short tones on success and on an unknown card. */
function useTones() {
  const audio = useRef<AudioContext | null>(null);
  return {
    /** Call during the reader's keystrokes (a user gesture) so later sounds may play. */
    unlock() {
      audio.current ??= new AudioContext();
      audio.current.resume().catch(() => undefined);
    },
    play(kind: 'ok' | 'no') {
      const ctx = audio.current;
      if (!ctx || ctx.state !== 'running') return;
      const notes = kind === 'ok' ? [659.25, 987.77] : [220, 196];
      notes.forEach((frequency, i) => {
        const start = ctx.currentTime + i * 0.16;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = kind === 'ok' ? 'sine' : 'triangle';
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    }
  };
}

export default function KioskPage() {
  const [key] = useState(() => params().get('key')?.trim() ?? '');
  const [testMode] = useState(() => params().get('test') === '1');
  const [kiosk, setKiosk] = useState<KioskState | null>(null);
  const [phase, setPhase] = useState<Phase>(() => (key ? { kind: 'loading' } : { kind: 'revoked', message: '' }));
  const [focused, setFocused] = useState(() => document.hasFocus());
  const [now, setNow] = useState(() => new Date());
  const [testCard, setTestCard] = useState('');
  const lastPrinted = useRef(new Map<string, number>());
  const tones = useTones();

  // Read this kiosk's settings; retry while the server cannot be reached.
  useEffect(() => {
    if (!key) return;
    let timer: number | undefined;
    let current = true;
    const load = () =>
      kioskApi.state(key).then(
        (state) => {
          if (!current) return;
          setKiosk(state);
          setPhase((p) => (p.kind === 'loading' || p.kind === 'offline' ? { kind: 'idle' } : p));
        },
        (err: KioskError) => {
          if (!current) return;
          if (err.status === 401) return setPhase({ kind: 'revoked', message: err.message });
          setPhase({ kind: 'offline', message: err.message });
          timer = window.setTimeout(load, OFFLINE_RETRY_MS);
        }
      );
    load();
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [key]);

  // A result or message clears itself, ready for the next patient.
  useEffect(() => {
    if (phase.kind !== 'done' && phase.kind !== 'unknown' && phase.kind !== 'error') return;
    const timer = window.setTimeout(() => setPhase({ kind: 'idle' }), phase.kind === 'done' ? RESULT_MS : MESSAGE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    document.title = kiosk?.hospitalName ? `Check-in · ${kiosk.hospitalName}` : 'Check-in kiosk';
  }, [kiosk?.hospitalName]);

  const tap = async (cardId: string) => {
    if (!kiosk) return;
    tones.unlock();
    setPhase({ kind: 'checking' });
    try {
      const result = await kioskApi.tap(key, cardId);
      let printed = false;
      const last = lastPrinted.current.get(result.label) ?? 0;
      if (result.printSlips && result.status === 'waiting' && (!result.existing || Date.now() - last > REPRINT_AFTER_MS)) {
        printTokenSlip({
          hospitalName: kiosk.hospitalName,
          label: result.label,
          name: result.name,
          visit: result.appointmentTime ? `Appointment ${result.appointmentTime}` : 'Walk-in',
          issuedAt: result.issuedAt,
          ahead: result.ahead
        });
        lastPrinted.current.set(result.label, Date.now());
        printed = true;
      }
      tones.play('ok');
      setPhase({ kind: 'done', result, printed });
    } catch (err) {
      const error = err as KioskError;
      tones.play('no');
      if (error.status === 404) setPhase({ kind: 'unknown' });
      else if (error.status === 401) setPhase({ kind: 'revoked', message: error.message });
      else setPhase({ kind: 'error', message: error.message });
    }
  };
  const ready = phase.kind === 'idle' || phase.kind === 'done' || phase.kind === 'unknown' || phase.kind === 'error';
  useCardReader(tap, ready);

  if (phase.kind === 'revoked') {
    return (
      <div className="kq-root kq-message-screen">
        <img src="/logo.svg" alt="" width={72} height={72} />
        <h1>{key ? 'This kiosk link no longer works' : 'This screen needs a kiosk link'}</h1>
        <p>{key ? phase.message : 'An administrator can create one in MediOS: Token Queue → Displays & Settings → Check-in kiosk. Open that link here.'}</p>
      </div>
    );
  }

  return (
    <div className="kq-root" onClick={() => tones.unlock()} role="presentation">
      <header className="kq-header">
        <div className="kq-brand">
          <img src="/logo.svg" alt="" />
          <span>{kiosk?.hospitalName || 'MediOS'}</span>
        </div>
        <span className="kq-clock">
          {pad(now.getHours() % 12 || 12)}:{pad(now.getMinutes())} <small>{now.getHours() < 12 ? 'AM' : 'PM'}</small>
        </span>
      </header>

      <main className="kq-main" aria-live="assertive">
        {(phase.kind === 'idle' || phase.kind === 'loading' || phase.kind === 'offline') && (
          <div className="kq-idle">
            <div className="kq-reader">
              <span className="kq-ring" />
              <span className="kq-ring kq-ring-2" />
              <Nfc className="kq-reader-icon" strokeWidth={1.6} />
            </div>
            <h1>Tap your card here</h1>
            <p>Hold your hospital card on the reader to get your token.</p>
            <p className="kq-small">No card yet? Please go to the front desk.</p>
          </div>
        )}

        {phase.kind === 'checking' && (
          <div className="kq-idle">
            <div className="kq-spinner" />
            <h1>Checking you in…</h1>
          </div>
        )}

        {phase.kind === 'done' && <Result result={phase.result} printed={phase.printed} />}

        {phase.kind === 'unknown' && (
          <div className="kq-notice">
            <CircleAlert className="kq-notice-icon" />
            <h1>We don't recognise this card</h1>
            <p>Please go to the front desk. They will link the card to your record.</p>
          </div>
        )}

        {phase.kind === 'error' && (
          <div className="kq-notice">
            <CircleAlert className="kq-notice-icon" />
            <h1>Could not check you in</h1>
            <p>Please tap again, or go to the front desk.</p>
            <p className="kq-small">{phase.message}</p>
          </div>
        )}
      </main>

      <footer className="kq-footer">
        <span>{kiosk ? kiosk.name : ''}</span>
        {phase.kind === 'offline' && <span className="kq-warn">Not connected: {phase.message} Retrying…</span>}
        {phase.kind !== 'offline' && !focused && (
          <span className="kq-warn">
            <MousePointerClick size={18} /> Click anywhere on this screen so the card reader can be used
          </span>
        )}
        {testMode && (
          <form
            className="kq-test"
            onSubmit={(e) => {
              e.preventDefault();
              if (testCard.trim()) tap(testCard.trim());
              setTestCard('');
            }}
          >
            <input value={testCard} onChange={(e) => setTestCard(e.target.value)} placeholder="Test: card number" aria-label="Test card number" />
          </form>
        )}
      </footer>
    </div>
  );
}

function Result({ result, printed }: { result: KioskTapResult; printed: boolean }) {
  const called = result.status === 'called';
  const line = called
    ? `Please go to ${result.counter} now`
    : result.ahead === 0
      ? 'You are next in line'
      : `${result.ahead} ${result.ahead === 1 ? 'person' : 'people'} ahead of you`;
  return (
    <div className="kq-result">
      <p className="kq-welcome">{result.existing ? 'Welcome back' : 'Welcome'}, {result.name}</p>
      <p className="kq-label">Your token</p>
      <p className="kq-token">{result.label}</p>
      <p className={`kq-line ${called ? 'kq-line-called' : ''}`}>{line}</p>
      <p className="kq-detail">
        {result.appointmentTime ? `Appointment ${result.appointmentTime}` : 'Walk-in'}
        {result.existing && ' · You already had this token today'}
      </p>
      {printed && (
        <p className="kq-print">
          <Printer size={22} /> Take your token slip from the printer
        </p>
      )}
      {!called && (
        <p className="kq-small">
          <Star size={16} className="kq-inline-icon" /> Please take a seat. Your number will appear on the screen when it is your turn.
        </p>
      )}
    </div>
  );
}
