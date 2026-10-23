import { useCallback, useEffect, useRef } from 'react';
import { useApp } from '../context/appContextCore';
import { callAgentService } from '../services';
import { errorMessage } from '../services/api';
import { AgentCall } from '../types';
import { OUTCOME_META, callTime } from '../utils/callAgent';

const POLL_MS = 1500;
const GIVE_UP_MS = 3 * 60_000;

/**
 * Starts an AI call and follows it to the end, reporting with toasts: placed, queued
 * for calling hours, refused, and finally what the agent achieved. `onSettled` gets
 * the final call (e.g. to reload appointments the outcome changed).
 */
export function useCallRunner(onSettled?: (call: AgentCall) => void) {
  const { showToast } = useApp();
  const latest = useRef({ showToast, onSettled });
  const mounted = useRef(true);

  useEffect(() => {
    latest.current = { showToast, onSettled };
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return useCallback(async (start: () => Promise<AgentCall>): Promise<AgentCall | null> => {
    const toast = (message: string, type?: 'success' | 'error' | 'info' | 'warning') => latest.current.showToast(message, type);
    let call: AgentCall;
    try {
      call = await start();
    } catch (err) {
      toast(errorMessage(err), 'error');
      return null;
    }

    const who = call.patientName;
    if (call.status === 'scheduled') {
      toast(`Outside calling hours: the call to ${who} is queued for ${callTime(call.scheduledFor)}.`, 'info');
      latest.current.onSettled?.(call);
      return call;
    }
    if (call.status !== 'calling') {
      toast(call.error || call.actionTaken || `The call to ${who} was not placed.`, 'error');
      latest.current.onSettled?.(call);
      return call;
    }

    toast(`Calling ${who}…`, 'info');
    const deadline = Date.now() + GIVE_UP_MS;
    while (Date.now() < deadline && mounted.current) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      try {
        call = await callAgentService.getCall(call.id);
      } catch {
        continue;
      }
      if (call.status !== 'calling') break;
    }
    if (!mounted.current) return call;
    if (call.status === 'calling') {
      toast(`Still on the call with ${who}. The result will appear in the AI Call Agent log.`, 'info');
      return call;
    }

    const meta = call.outcome ? OUTCOME_META[call.outcome] : undefined;
    const good = call.outcome === 'confirmed' || call.outcome === 'rescheduled' || call.outcome === 'booked';
    const urgent = call.outcome === 'escalated' || call.status === 'failed';
    toast(`${who}: ${meta?.label ?? call.status}. ${call.actionTaken}`, good ? 'success' : urgent ? 'error' : 'info');
    latest.current.onSettled?.(call);
    return call;
  }, []);
}
