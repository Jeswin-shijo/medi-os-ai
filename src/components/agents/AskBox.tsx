import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useApp } from '../../context/appContextCore';
import { coordinatorService } from '../../services';
import { errorMessage } from '../../services/api';
import type { ChatAnswer } from '../../types';

interface AskBoxProps {
  onOpenCase(caseId: string): void;
  onOpenRequestForm(patient: { id: string; uhid: string }): void;
}

/** Ask the Coordinator in plain words. It never acts by itself: an action shows as a button you press. */
export const AskBox: React.FC<AskBoxProps> = ({ onOpenCase, onOpenRequestForm }) => {
  const { openBedRequest } = useApp();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<ChatAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = text.trim();
    if (!question || busy) return;
    setBusy(true);
    setError(null);
    try {
      setAnswer(await coordinatorService.ask(question));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const action = answer?.action;
  const open = () => {
    if (!action) return;
    const p = action.params;
    if (action.screen === 'bed-request-form') onOpenRequestForm({ id: p.patientId, uhid: p.uhid });
    else if (action.screen === 'case') onOpenCase(p.caseId);
    else if (action.screen === 'bed-agent-request') openBedRequest(p.requestId ?? p.id);
  };

  return (
    <section className="medios-card bagent-card co-card co-ask" aria-label="Ask the Coordinator">
      <form className="co-ask-form" onSubmit={(e) => void ask(e)}>
        <input
          className="input-field co-ask-input"
          type="text"
          value={text}
          maxLength={500}
          placeholder="Ask Coordinator Agent…"
          aria-label="Ask Coordinator Agent"
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary co-ask-send" disabled={busy || !text.trim()} aria-label="Ask">
          <Send size={16} aria-hidden="true" />
        </button>
      </form>
      <p className="co-ask-hint">e.g. "Allocate bed for MHK202500323" · "Show agent workload" · "Pending approvals"</p>
      <div className="co-ask-out" aria-live="polite">
        {busy && <p className="co-ask-wait">Thinking…</p>}
        {error && (
          <p className="admit-error" role="alert">
            {error}
          </p>
        )}
        {answer && (
          <div className="co-answer">
            {answer.sample && <span className="status-pill sm gray">SAMPLE</span>}
            <p className="co-answer-text">{answer.answer}</p>
            {action && (
              <button type="button" className="btn-secondary btn-sm" onClick={open}>
                Open
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
