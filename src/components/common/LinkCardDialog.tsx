import React, { useEffect, useState } from 'react';
import { CreditCard, Nfc, Search, Trash, X } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { queueService } from '../../services';
import { ApiError, errorMessage } from '../../services/api';
import { PatientCard } from '../../types';
import { normalizeCardId } from '../../hooks/useCardReader';
import { Avatar } from './Avatar';

interface Props {
  /** Link a card to this patient: their cards are listed and the next tap is captured. */
  patient?: { uhid: string; name: string };
  /** A card tapped at the desk that nobody has: choose the patient to give it to. */
  cardId?: string;
  onClose: () => void;
  onLinked?: (card: PatientCard, patientName: string) => void;
}

const cardHint = (cardId: string) => `…${cardId.slice(-4)}`;

/**
 * Links hospital cards to patients. With a patient chosen, the card number field
 * has focus, so tapping the card on the USB reader types its number and submits.
 */
export const LinkCardDialog: React.FC<Props> = ({ patient: initialPatient, cardId: tappedCard, onClose, onLinked }) => {
  const { patients, showToast } = useApp();
  const [patient, setPatient] = useState(initialPatient ?? null);
  const [cardNumber, setCardNumber] = useState(tappedCard ?? '');
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<PatientCard[]>([]);
  const [conflict, setConflict] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const uhid = patient?.uhid;
  useEffect(() => {
    if (!uhid) return;
    let current = true;
    queueService
      .getCards(uhid)
      .then((list) => current && setCards(list))
      .catch((err) => current && showToast(errorMessage(err), 'error'));
    return () => {
      current = false;
    };
  }, [uhid, showToast]);

  const q = query.trim().toLowerCase();
  const matches = q.length < 2 ? [] : patients.filter((p) => p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q) || p.phone.includes(q)).slice(0, 6);

  const link = async (reassign = false) => {
    const cardId = normalizeCardId(cardNumber);
    if (!patient || cardId.length < 4 || busy) return;
    setBusy(true);
    try {
      const card = await queueService.linkCard(cardId, patient.uhid, reassign);
      showToast(`Card ${cardHint(card.cardId)} linked to ${patient.name}`, 'success');
      onLinked?.(card, patient.name);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setConflict(err.message);
      else showToast(errorMessage(err), 'error');
      setBusy(false);
    }
  };

  const unlink = async (card: PatientCard) => {
    if (!window.confirm(`Unlink card ${cardHint(card.cardId)}? It will no longer check ${patient?.name} in.`)) return;
    try {
      await queueService.unlinkCard(card.id);
      setCards((list) => list.filter((c) => c.id !== card.id));
      showToast(`Card ${cardHint(card.cardId)} unlinked`, 'info');
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} color="var(--blue-text)" />
            {tappedCard && !initialPatient ? 'New card' : 'Patient cards'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            link();
          }}
        >
          <div className="modal-body">
            {tappedCard && !initialPatient && (
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Card <strong style={{ fontFamily: 'var(--font-mono)' }}>{cardHint(tappedCard)}</strong> is not linked to anyone. Choose the patient it belongs to.
              </p>
            )}

            {patient ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={patient.name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--fs-body)' }}>{patient.name}</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{patient.uhid}</div>
                </div>
                {!initialPatient && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => setPatient(null)}>
                    Change
                  </button>
                )}
              </div>
            ) : (
              <div>
                <label className="form-label" htmlFor="card-patient">
                  Patient
                </label>
                <div style={{ display: 'flex', alignItems: 'center', height: 36, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 10px', gap: 8 }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    id="card-patient"
                    autoFocus
                    autoComplete="off"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name, UHID or phone"
                    style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--fs-sm)' }}
                  />
                </div>
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {matches.map((p) => (
                    <button
                      key={p.uhid}
                      type="button"
                      onClick={() => setPatient({ uhid: p.uhid, name: p.name })}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', borderRadius: 'var(--radius-sm)', background: 'transparent', textAlign: 'left' }}
                    >
                      <Avatar name={p.name} size={28} />
                      <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>{p.uhid}</span>
                    </button>
                  ))}
                  {q.length >= 2 && !matches.length && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>No registered patient matches. Register them first.</p>}
                </div>
              </div>
            )}

            {patient && cards.length > 0 && (
              <div>
                <div className="form-label">Linked cards</div>
                {cards.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 'var(--fs-sm)' }}>
                    <CreditCard size={15} color="var(--text-muted)" />
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{c.cardId}</span>
                    <span style={{ flex: 1, fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                      {c.lastUsedAt ? `last tapped ${new Date(c.lastUsedAt).toLocaleDateString()}` : 'not tapped yet'}
                    </span>
                    <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => unlink(c)} title="Unlink (lost or handed back)" aria-label={`Unlink card ${c.cardId}`}>
                      <Trash size={13} color="var(--red-dark)" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {patient && (
              <div>
                <label className="form-label" htmlFor="card-number">
                  {tappedCard ? 'Card' : 'New card'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', height: 40, border: '1px solid var(--blue-border)', borderRadius: 'var(--radius-sm)', padding: '0 10px', gap: 8, background: 'var(--blue-light)' }}>
                  <Nfc size={16} color="var(--blue-text)" />
                  <input
                    id="card-number"
                    autoFocus={!tappedCard}
                    readOnly={!!tappedCard}
                    autoComplete="off"
                    value={cardNumber}
                    onChange={(e) => {
                      setCardNumber(e.target.value);
                      setConflict(null);
                    }}
                    placeholder="Tap the card on the reader now"
                    style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-body)' }}
                  />
                </div>
                {!tappedCard && <p style={{ marginTop: 4, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Or type the number printed on the card.</p>}
              </div>
            )}

            {conflict && (
              <div style={{ padding: '9px 11px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--orange-light)', color: 'var(--orange-dark)', fontSize: 'var(--fs-sm)', lineHeight: 1.45 }}>
                {conflict}{' '}
                <button type="button" className="btn-outline-blue btn-sm" style={{ marginTop: 6 }} onClick={() => link(true)} disabled={busy}>
                  Move it to {patient?.name}
                </button>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {tappedCard ? 'Cancel' : 'Done'}
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '0 18px' }} disabled={!patient || normalizeCardId(cardNumber).length < 4 || busy || !!conflict}>
              Link card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
