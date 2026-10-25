import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, Info, Loader2, ShieldOff, Sparkles, Star, type LucideIcon } from 'lucide-react';
import type { Need, RankedBedView, SuggestionResult } from '../../types';
import { NEED_OPTIONS, floorLabel, formatRate } from '../../utils/beds';
import { SampleBadge } from '../common/SampleBadge';

/** A bed staff can choose: a suggestion, or (overriding the rules) any free bed on the board. */
export interface BedOption {
  bedId: string;
  label: string;
  wardName: string;
  floor: number;
  ratePerDay: number;
}

/** What the AI has done for the cards on screen. */
export type AiMarker = 'pending' | 'ai' | 'sample' | 'none';

interface AdmitStepBedProps {
  /** One line naming the patient and the request. */
  summary: React.ReactNode;
  suggestion: SuggestionResult;
  /** The cards: the rule order, or the AI's once it answers. */
  top: RankedBedView[];
  ai: AiMarker;
  /** AI-suggested needs still waiting for Add or Ignore. */
  extraNeeds: { need: Need; evidence: string }[];
  onAddNeed: (need: Need) => void;
  onIgnoreNeed: (need: Need) => void;
  /** Why the bed picked on the board is not offered. */
  preselectNotice?: string;
  chosenBedId: string | null;
  onChoose: (bedId: string, ruleOverride: boolean) => void;
  canOverride: boolean;
  /** Free board beds outside the rules; null while the board loads. */
  overrideBeds: BedOption[] | null;
  /** True while the beds are fetched again. */
  busy: boolean;
}

const needLabel = (need: Need) => (NEED_OPTIONS.find((o) => o.need === need)?.label ?? need).toLowerCase();

/** Step 2: the rules applied, the suggested beds (AI-refined when it answers), every eligible bed and the override. */
export const AdmitStepBed: React.FC<AdmitStepBedProps> = ({
  summary,
  suggestion,
  top,
  ai,
  extraNeeds,
  onAddNeed,
  onIgnoreNeed,
  preselectNotice,
  chosenBedId,
  onChoose,
  canOverride,
  overrideBeds,
  busy
}) => {
  // Open when the bed already chosen (picked on the board) is not one of the cards.
  const [showAll, setShowAll] = useState(() => !!chosenBedId && !top.some((b) => b.bedId === chosenBedId) && suggestion.eligible.some((b) => b.bedId === chosenBedId));
  const [showOverride, setShowOverride] = useState(false);
  const refined = ai === 'ai' || ai === 'sample';
  const eligibleCount = suggestion.eligible.length;

  return (
    <>
      <p className="admit-summary">{summary}</p>

      <div className="admit-rules">
        <span className="admit-rules-label" id="admit-rules-label">Rules applied</span>
        <ul aria-labelledby="admit-rules-label">
          {suggestion.appliedRules.map((rule) => (
            <li key={rule} className="status-pill gray sm">
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {suggestion.classNote && <Notice tone="info">{suggestion.classNote}</Notice>}
      {preselectNotice && <Notice tone="warn">{preselectNotice}</Notice>}
      {extraNeeds.map((extra) => (
        <Notice
          key={extra.need}
          tone="ai"
          live
          actions={
            <>
              <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => onAddNeed(extra.need)}>
                Add
              </button>
              <button type="button" className="btn-secondary btn-sm" disabled={busy} onClick={() => onIgnoreNeed(extra.need)}>
                Ignore
              </button>
            </>
          }
        >
          Notes mention “{extra.evidence}”. Add {needLabel(extra.need)}?
        </Notice>
      ))}

      <section className={`admit-section${busy ? ' admit-busy' : ''}`} aria-labelledby="admit-top-title" aria-busy={busy}>
        <div className="admit-list-head">
          <h4 id="admit-top-title">Suggested beds</h4>
          {busy ? (
            <span className="admit-pending">Updating the beds…</span>
          ) : ai === 'pending' ? (
            <span className="admit-pending">
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              AI is reviewing these
            </span>
          ) : ai === 'ai' ? (
            <span className="status-pill purple sm" title="Order and reasons from the AI, within the bed rules">
              <Sparkles size={11} aria-hidden="true" />
              AI
            </span>
          ) : ai === 'sample' ? (
            <SampleBadge />
          ) : null}
        </div>

        {top.length ? (
          <div key={`${suggestion.suggestionId}-${refined ? 'ai' : 'rules'}`} className="admit-cards swap-in" role="radiogroup" aria-labelledby="admit-top-title">
            {top.map((bed, index) => (
              <BedCard key={bed.bedId} bed={bed} best={index === 0} chosen={bed.bedId === chosenBedId} onChoose={() => onChoose(bed.bedId, false)} />
            ))}
          </div>
        ) : (
          <Notice tone="warn">
            {suggestion.blockedBy.length ? suggestion.blockedBy.join(' ') : 'No free bed passes the rules for this patient.'}{' '}
            {canOverride ? 'Use “Ignore rules” below to choose any free bed, with a reason.' : 'Ask a doctor or admin to choose a bed outside the rules.'}
          </Notice>
        )}
      </section>

      {eligibleCount > top.length && (
        <div className="admit-section">
          <button type="button" className="admit-link" aria-expanded={showAll} aria-controls="admit-all" onClick={() => setShowAll((v) => !v)}>
            See all {eligibleCount} free beds that pass the rules
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {showAll && (
            <BedRows id="admit-all" name="admit-all" label="Free beds that pass the rules" beds={suggestion.eligible} chosenBedId={chosenBedId} onChoose={(id) => onChoose(id, false)} />
          )}
        </div>
      )}

      {canOverride && (
        <div className="admit-section">
          <button type="button" className="admit-link is-quiet" aria-expanded={showOverride} aria-controls="admit-override" onClick={() => setShowOverride((v) => !v)}>
            <ShieldOff size={14} aria-hidden="true" />
            Ignore rules
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {showOverride && (
            <div id="admit-override" className="admit-section">
              <Notice tone="warn" icon={ShieldOff}>
                These free beds don't pass the rules for this patient. Choosing one needs a reason and is logged as a rule override.
              </Notice>
              {overrideBeds === null ? (
                <p className="admit-hint">Loading beds…</p>
              ) : overrideBeds.length ? (
                <BedRows id="admit-override-beds" name="admit-override" label="Free beds outside the rules" beds={overrideBeds} chosenBedId={chosenBedId} onChoose={(id) => onChoose(id, true)} />
              ) : (
                <p className="admit-hint">No other free beds right now.</p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

interface AdmitChoiceBarProps {
  chosen?: BedOption;
  ruleOverride: boolean;
  reasonRequired: boolean;
  reason: string;
  onReason: (reason: string) => void;
}

/** Stays in view under the list: the bed chosen and, when the choice needs one, the reason. */
export const AdmitChoiceBar: React.FC<AdmitChoiceBarProps> = ({ chosen, ruleOverride, reasonRequired, reason, onReason }) => (
  <div className="admit-choice">
    {chosen ? (
      <p className="admit-choice-line">
        <span className="admit-choice-meta">Chosen</span>
        <strong>{chosen.label}</strong>
        <span className="admit-choice-meta">
          {chosen.wardName} · {formatRate(chosen.ratePerDay)}
        </span>
        {ruleOverride && <span className="status-pill red sm">Outside the rules</span>}
      </p>
    ) : (
      <p className="admit-choice-line admit-choice-meta">Choose a bed to continue.</p>
    )}
    {chosen && reasonRequired && (
      <div>
        <label className="form-label" htmlFor="admit-reason">Why this bed? *</label>
        <input
          id="admit-reason"
          className="input-field"
          required
          maxLength={500}
          placeholder={ruleOverride ? 'e.g. No isolation room free; side room until one is' : 'e.g. Family asked for a bed near the window'}
          value={reason}
          onChange={(e) => onReason(e.target.value)}
        />
        <p className="admit-hint">{ruleOverride ? 'Logged as a rule override.' : 'Saved with the admission.'}</p>
      </div>
    )}
  </div>
);

const BedCard: React.FC<{ bed: RankedBedView; best: boolean; chosen: boolean; onChoose: () => void }> = ({ bed, best, chosen, onChoose }) => (
  <label className={`admit-card${chosen ? ' is-chosen' : ''}`}>
    <input type="radio" name="admit-top" checked={chosen} onChange={onChoose} />
    <span className="admit-card-main">
      <span className="admit-card-title">
        {bed.label}
        {best && (
          <span className="status-pill green sm">
            <Star size={10} fill="currentColor" aria-hidden="true" />
            Best match
          </span>
        )}
        {bed.stepUp && <span className="status-pill orange sm">Higher care</span>}
      </span>
      <span className="admit-card-meta">
        {bed.wardName} · {floorLabel(bed.floor)}
      </span>
      <span className="admit-card-reason">{bed.aiReason ?? bed.reason}</span>
    </span>
    <span className="admit-rate">{formatRate(bed.ratePerDay)}</span>
  </label>
);

interface BedRowsProps {
  id: string;
  name: string;
  label: string;
  beds: BedOption[];
  chosenBedId: string | null;
  onChoose: (bedId: string) => void;
}

const BedRows: React.FC<BedRowsProps> = ({ id, name, label, beds, chosenBedId, onChoose }) => (
  <div id={id} className="admit-rows" role="radiogroup" aria-label={label}>
    {beds.map((bed) => (
      <label key={bed.bedId} className={`admit-row${bed.bedId === chosenBedId ? ' is-chosen' : ''}`}>
        <input type="radio" name={name} checked={bed.bedId === chosenBedId} onChange={() => onChoose(bed.bedId)} />
        <span className="admit-row-main">
          <span className="admit-row-label">{bed.label}</span>
          <span className="admit-row-meta">
            {bed.wardName} · {floorLabel(bed.floor)}
          </span>
        </span>
        <span className="admit-rate">{formatRate(bed.ratePerDay)}</span>
      </label>
    ))}
  </div>
);

type Tone = 'info' | 'warn' | 'ai';
const TONE_ICON: Record<Tone, LucideIcon> = { info: Info, warn: AlertTriangle, ai: Sparkles };

const Notice: React.FC<{ tone: Tone; icon?: LucideIcon; live?: boolean; actions?: React.ReactNode; children: React.ReactNode }> = ({ tone, icon, live, actions, children }) => {
  const Icon = icon ?? TONE_ICON[tone];
  return (
    <div className={`admit-notice is-${tone}`} role={live ? 'status' : undefined}>
      <Icon size={15} aria-hidden="true" />
      <div className="admit-notice-body">
        <p>{children}</p>
        {actions && <div className="admit-notice-actions">{actions}</div>}
      </div>
    </div>
  );
};
