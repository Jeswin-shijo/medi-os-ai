import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ScanLine } from 'lucide-react';
import { labAgentService } from '../../services';
import { errorMessage } from '../../services/api';
import { useErAction } from '../er/useErAction';
import type { LabArea, LabCollectionItem } from '../../types';
import { displayTime } from '../../utils/clinicDate';
import { PRIORITY_LABEL, PRIORITY_TONE, locationText, minutesUntil } from '../../utils/lab';

const AREAS: LabArea[] = ['ER', 'Ward', 'OPD'];
const AREA_ORDER: Record<LabArea, number> = { ER: 0, Ward: 1, OPD: 2 };
const SAMPLE_NUMBER = /^S-\d{6}-\d{4}$/;

interface LabCollectionProps {
  collection: LabCollectionItem[] | null;
  error: string | null;
  canCollect: boolean;
  onRetry(): void;
  /** After a sample is collected or a request marked not collected. */
  onChanged(): void;
}

interface Group {
  key: string;
  title: string;
  requests: { requestId: string; requestNumber: string; patientName: string; patientUhid: string; samples: LabCollectionItem[] }[];
}

/** The Collection tab: samples still to be collected, grouped by location, with a scanner field. */
export const LabCollection: React.FC<LabCollectionProps> = ({ collection, error, canCollect, onRetry, onChanged }) => {
  const uid = useId();
  const [area, setArea] = useState<LabArea | ''>('');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const groups = useMemo<Group[]>(() => {
    const byLoc = new Map<string, { area: LabArea; ward: string; items: LabCollectionItem[] }>();
    for (const s of collection ?? []) {
      if (area && s.location.area !== area) continue;
      const key = `${s.location.area}|${s.location.ward ?? ''}`;
      const g = byLoc.get(key) ?? { area: s.location.area, ward: s.location.ward ?? '', items: [] };
      g.items.push(s);
      byLoc.set(key, g);
    }
    return [...byLoc.entries()]
      .sort(([, a], [, b]) => AREA_ORDER[a.area] - AREA_ORDER[b.area] || a.ward.localeCompare(b.ward))
      .map(([key, g]) => {
        const reqs = new Map<string, Group['requests'][number]>();
        for (const s of [...g.items].sort((a, b) => new Date(a.collectBy).getTime() - new Date(b.collectBy).getTime())) {
          const r = reqs.get(s.requestId) ?? { requestId: s.requestId, requestNumber: s.requestNumber, patientName: s.patientName, patientUhid: s.patientUhid, samples: [] };
          r.samples.push(s);
          reqs.set(s.requestId, r);
        }
        return { key, title: locationText({ area: g.area, ward: g.ward || undefined }), requests: [...reqs.values()] };
      });
  }, [collection, area]);

  const total = groups.reduce((n, g) => n + g.requests.reduce((m, r) => m + r.samples.length, 0), 0);

  return (
    <div className="bagent-overview lab-body">
      {canCollect && <ScanField onChanged={onChanged} />}
      <section className="medios-card bagent-card lab-card" aria-label="Samples to collect">
        <div className="card-header-row">
          <div className="bagent-title-group">
            <h3 className="card-title">Samples to collect</h3>
            <span className="bagent-hint">{collection ? `${total} waiting` : ''}</span>
          </div>
          <div className="lab-area">
            <label className="form-label" htmlFor={`${uid}-area`}>Area</label>
            <select id={`${uid}-area`} className="form-select" value={area} onChange={(e) => setArea(e.target.value as LabArea | '')}>
              <option value="">All areas</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
        {!canCollect && <p className="er-hint lab-readonly">You can see this list. Nurses and lab staff collect the samples.</p>}
        {!collection ? (
          error ? (
            <p className="data-empty" role="alert">
              {error}{' '}
              <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
                Try again
              </button>
            </p>
          ) : (
            <p className="data-empty">Loading the collection list…</p>
          )
        ) : groups.length === 0 ? (
          <p className="data-empty">{area ? `No samples are waiting in ${area}.` : 'No samples are waiting to be collected.'}</p>
        ) : (
          groups.map((g) => (
            <section key={g.key} className="lab-loc" aria-label={g.title}>
              <h4 className="lab-loc-title">{g.title}</h4>
              <ul className="lab-coll">
                {g.requests.map((r) => (
                  <RequestRows key={r.requestId} request={r} now={now} canCollect={canCollect} onChanged={onChanged} />
                ))}
              </ul>
            </section>
          ))
        )}
      </section>
    </div>
  );
};

/** The scanner field: a USB reader types the sample number and presses Enter. */
const ScanField: React.FC<{ onChanged(): void }> = ({ onChanged }) => {
  const uid = useId();
  const ref = useRef<HTMLInputElement>(null);
  const { busy, error, setError, run } = useErAction();
  const [value, setValue] = useState('');
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sampleNumber = value.trim().toUpperCase();
    if (!sampleNumber) return;
    setDone(null);
    if (!SAMPLE_NUMBER.test(sampleNumber)) {
      setError('That is not a sample number. It looks like S-261026-0001.');
      return;
    }
    const ok = await run('collect', () => labAgentService.collect(sampleNumber));
    if (ok) {
      setDone(`${sampleNumber} collected`);
      setValue('');
      onChanged();
    }
    ref.current?.focus();
  };

  return (
    <section className="medios-card bagent-card lab-card lab-scan" aria-label="Scan a sample">
      <form onSubmit={(e) => void submit(e)}>
        <label className="form-label" htmlFor={`${uid}-scan`}>Scan or type the sample number</label>
        <div className="lab-scan-row">
          <div className="admit-search">
            <ScanLine size={15} aria-hidden="true" />
            <input
              ref={ref}
              id={`${uid}-scan`}
              className="input-field"
              style={{ fontFamily: 'var(--font-mono)' }}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={20}
              placeholder="S-261026-0001"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null); setDone(null); }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={!value.trim() || busy !== null}>
            {busy ? 'Collecting…' : 'Collect'}
          </button>
        </div>
        <div aria-live="polite">
          {done && <p className="lab-ok" role="status">{done}</p>}
          {error && <p className="er-error" role="alert">{error}</p>}
        </div>
      </form>
    </section>
  );
};

const RequestRows: React.FC<{ request: Group['requests'][number]; now: number; canCollect: boolean; onChanged(): void }> = ({ request: r, now, canCollect, onChanged }) => {
  const uid = useId();
  const { busy, error, setError, run } = useErAction();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const [rowError, setRowError] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const collectOne = async (s: LabCollectionItem) => {
    setRowError(null);
    setRowBusy(s.sampleId);
    try {
      await labAgentService.collect(s.sampleNumber);
      onChanged();
    } catch (err) {
      setRowError(errorMessage(err));
    } finally {
      setRowBusy(null);
    }
  };

  const notCollected = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = reason.trim();
    if (!text) return;
    const ok = await run('not-collected', () => labAgentService.notCollected(r.requestId, text));
    if (!ok) return;
    setAsking(false);
    setReason('');
    onChanged();
  };

  return (
    <li className="lab-coll-req">
      <div className="lab-coll-head">
        <span className="lab-num">{r.requestNumber}</span>
        <span className="lab-coll-patient">
          <span className="er-name">{r.patientName}</span> <span className="er-sub">{r.patientUhid}</span>
        </span>
        {canCollect && !asking && (
          <button type="button" className="btn-danger-soft btn-sm" aria-label={`Mark ${r.requestNumber} not collected`} onClick={() => { setAsking(true); setError(null); }}>
            Not collected
          </button>
        )}
      </div>
      {asking && (
        <form className="lab-reason" onSubmit={(e) => void notCollected(e)}>
          <label className="form-label" htmlFor={`${uid}-why`}>Why was {r.requestNumber} not collected?</label>
          <div className="lab-reason-row">
            <input id={`${uid}-why`} className="input-field" maxLength={300} autoFocus autoComplete="off" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button type="submit" className="btn-primary btn-sm" disabled={!reason.trim() || busy !== null}>
              {busy ? 'Saving…' : 'Mark not collected'}
            </button>
            <button type="button" className="btn-secondary btn-sm" disabled={busy !== null} onClick={() => { setAsking(false); setError(null); }}>
              Keep
            </button>
          </div>
          {error && <p className="er-error" role="alert">{error}</p>}
        </form>
      )}
      {rowError && <p className="er-error" role="alert">{rowError}</p>}
      <ul className="lab-samples">
        {r.samples.map((s) => {
          const left = minutesUntil(s.collectBy, now);
          const late = left < 0;
          return (
            <li key={s.sampleId} className={`lab-sample${late ? ' is-late' : ''}`}>
              <span className="lab-num">{s.sampleNumber}</span>
              <span className="lab-sample-tube">{s.tubeLabel}</span>
              <span className="lab-tests lab-sample-tests" data-tip={s.tests.join(', ')}>{s.tests.join(', ')}</span>
              <span className={`status-pill sm ${PRIORITY_TONE[s.priority]}`}>{PRIORITY_LABEL[s.priority]}</span>
              <span className="lab-sample-due">
                <span className="lab-time">{displayTime(new Date(s.collectBy))}</span>{' '}
                {late ? (
                  <span className="status-pill sm red lab-delayed">
                    <AlertTriangle size={12} aria-hidden="true" />
                    {-left} min late
                  </span>
                ) : (
                  <span className="er-hint">{left} min left</span>
                )}
              </span>
              {canCollect && (
                <button type="button" className="btn-primary btn-sm" disabled={rowBusy !== null} aria-label={`Mark ${s.sampleNumber} collected`} onClick={() => void collectOne(s)}>
                  {rowBusy === s.sampleId ? 'Saving…' : 'Collected'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </li>
  );
};
