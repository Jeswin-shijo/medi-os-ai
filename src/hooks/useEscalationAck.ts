import { useState } from 'react';
import { useApp } from '../context/appContextCore';
import { coordinatorService } from '../services';
import { errorMessage } from '../services/api';
import type { TaskAlertItem } from '../types';

/**
 * Acknowledge for escalation alerts, shared by Tasks & Alerts and the Coordinator page. Any role may press it;
 * the server decides, and a refusal (403) shows the server's own message under the alert and in a toast.
 */
export function useEscalationAck(onDone: () => void | Promise<void>) {
  const { showToast } = useApp();
  const [acking, setAcking] = useState<string | null>(null);
  const [ackErrors, setAckErrors] = useState<Record<string, string>>({});

  const acknowledge = async (task: TaskAlertItem) => {
    const esc = task.escalation;
    if (!esc || acking) return;
    setAcking(task.id);
    setAckErrors((e) => ({ ...e, [task.id]: '' }));
    try {
      await coordinatorService.acknowledge(esc.id);
      showToast('Escalation acknowledged', 'success');
      await onDone();
    } catch (err) {
      const message = errorMessage(err);
      setAckErrors((e) => ({ ...e, [task.id]: message }));
      showToast(message, 'error');
    } finally {
      setAcking(null);
    }
  };

  return { acking, ackErrors, acknowledge };
}
