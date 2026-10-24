import React, { useEffect, useRef, useState } from 'react';
import { Star, Volume2, WifiOff } from 'lucide-react';
import { QueueDisplaySnapshot } from '../types';
import { DisplayRevokedError, fetchSnapshot, streamSnapshots } from './displayFeed';
import { Announcer } from './announcer';
import './display.css';

// The waiting-room screen at /display#key=…, opened on a TV or monitor without a
// staff sign-in. It shows token numbers, the room each called token goes to and
// who is next; with sound on it chimes and reads each call aloud.

/** A call stays highlighted this long. */
const FRESH_MS = 12_000;
const MAX_RETRY_MS = 30_000;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n: number) => String(n).padStart(2, '0');

/** "Saturday, 26 September" for the queue's day (YYYY-MM-DD). */
const longDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  return `${WEEKDAYS[day.getDay()]}, ${d} ${MONTHS[m - 1]}`;
};

const readKey = () => new URLSearchParams(window.location.hash.slice(1)).get('key')?.trim() ?? '';

type Connection = 'connecting' | 'live' | 'reconnecting' | 'revoked';

export default function QueueDisplayPage() {
  const [key] = useState(readKey);
  const [snapshot, setSnapshot] = useState<QueueDisplaySnapshot | null>(null);
  const [connection, setConnection] = useState<Connection>('connecting');
  const [problem, setProblem] = useState('');
  const [soundOn, setSoundOn] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const announcer = useRef(new Announcer());
  /** label → calledAt already announced; null until the first snapshot arrives. */
  const announced = useRef<Map<string, string> | null>(null);
  /** Server clock minus this browser's, so "fresh" does not depend on the TV's clock. */
  const [clockSkew, setClockSkew] = useState(0);

  // Connect, and keep reconnecting with backoff until the key is revoked.
  useEffect(() => {
    if (!key) return;
    const stop = new AbortController();
    const receive = (next: QueueDisplaySnapshot) => {
      setClockSkew(new Date(next.serverTime).getTime() - Date.now());
      const seen = announced.current;
      if (seen && next.announce) {
        // Oldest first, so two rooms calling together are read in order.
        for (const call of [...next.nowServing].reverse()) {
          if (seen.get(call.label) !== call.calledAt) announcer.current.announce(call.label, call.counter);
        }
      }
      announced.current = new Map(next.nowServing.map((c) => [c.label, c.calledAt]));
      setSnapshot(next);
      setConnection('live');
    };

    (async () => {
      let delay = 2000;
      while (!stop.signal.aborted) {
        try {
          await streamSnapshots(key, stop.signal, (s) => {
            delay = 2000;
            receive(s);
          });
        } catch (err) {
          if (stop.signal.aborted) return;
          if (err instanceof DisplayRevokedError) {
            setProblem(err.message);
            setConnection('revoked');
            return;
          }
        }
        if (stop.signal.aborted) return;
        setConnection('reconnecting');
        await new Promise((resolve) => window.setTimeout(resolve, delay));
        delay = Math.min(delay * 2, MAX_RETRY_MS);
        // Catch up while the stream is down (and keep working where streaming is blocked).
        try {
          receive(await fetchSnapshot(key, stop.signal));
          setConnection('reconnecting');
        } catch (err) {
          if (err instanceof DisplayRevokedError) {
            setProblem(err.message);
            setConnection('revoked');
            return;
          }
        }
      }
    })();
    return () => stop.abort();
  }, [key]);

  // Clock, and expiry of the "just called" highlight.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Keep a TV or tablet from dimming while the queue is up.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      if (document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        navigator.wakeLock
          .request('screen')
          .then((l) => (lock = l))
          .catch(() => undefined);
      }
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      document.removeEventListener('visibilitychange', request);
      lock?.release().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    document.title = snapshot?.hospitalName ? `Queue · ${snapshot.hospitalName}` : 'Queue display';
  }, [snapshot?.hospitalName]);

  // The first click or key press turns sound on and goes full screen.
  const start = async () => {
    await announcer.current.unlock();
    setSoundOn(announcer.current.unlocked);
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  if (!key || connection === 'revoked') {
    return (
      <div className="qd-root qd-message">
        <img src="/logo.svg" alt="" width={72} height={72} />
        <h1>{key ? 'This display link no longer works' : 'This screen needs a display link'}</h1>
        <p>{key ? problem : 'An administrator can create one in MediOS: Token Queue → Displays & Settings → Add display. Open that link here.'}</p>
      </div>
    );
  }

  const serverNow = now + clockSkew;
  const serving = snapshot?.nowServing ?? [];
  const fresh = (calledAt: string) => serverNow - new Date(calledAt).getTime() < FRESH_MS;
  const clock = new Date(now);

  return (
    <div className="qd-root" onClick={start} onKeyDown={start} role="presentation">
      <header className="qd-header">
        <div className="qd-brand">
          <img src="/logo.svg" alt="" />
          <span>{snapshot?.hospitalName || 'MediOS'}</span>
        </div>
        <div className="qd-clock">
          <span className="qd-time">
            {pad(clock.getHours() % 12 || 12)}:{pad(clock.getMinutes())}
            <small>{clock.getHours() < 12 ? 'AM' : 'PM'}</small>
          </span>
          {snapshot && <span className="qd-date">{longDay(snapshot.date)}</span>}
        </div>
      </header>

      <main className="qd-main">
        <section className="qd-serving" aria-live="polite">
          <h2>Now serving</h2>
          {serving.length ? (
            <div className={`qd-cards ${serving.length > 2 ? 'many' : ''}`}>
              {serving.slice(0, 6).map((call) => (
                <div key={call.label} className={`qd-card ${fresh(call.calledAt) ? 'fresh' : ''}`}>
                  <span className="qd-card-token">{call.label}</span>
                  <span className="qd-card-room">{call.counter}</span>
                  {call.name && <span className="qd-card-name">{call.name}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="qd-empty">{snapshot ? 'Please take a seat. Your token number will appear here when it is called.' : 'Loading the queue…'}</p>
          )}
        </section>

        <aside className="qd-next">
          <h2>Next</h2>
          <ol>
            {(snapshot?.upcoming ?? []).map((t) => (
              <li key={t.label}>
                <span className="qd-next-token">{t.label}</span>
                {t.priority && <Star size={22} className="qd-star" aria-label="Priority" />}
                {t.name && <span className="qd-next-name">{t.name}</span>}
              </li>
            ))}
          </ol>
          {snapshot && (
            <p className="qd-waiting">
              {snapshot.waitingCount === 0 ? 'No one waiting' : `${snapshot.waitingCount} waiting`}
            </p>
          )}
        </aside>
      </main>

      <footer className="qd-footer">
        <span>Please wait until your token number is shown, then go to the room named with it.</span>
        <span className="qd-status">
          {connection !== 'live' && (
            <>
              <WifiOff size={18} /> Reconnecting…
            </>
          )}
          {connection === 'live' && snapshot?.announce && !soundOn && <span className="qd-hint">Click anywhere to turn on sound</span>}
          {connection === 'live' && soundOn && <Volume2 size={18} aria-label="Sound on" />}
        </span>
      </footer>
    </div>
  );
}
