import React from 'react';
import { AGENT_LIST, type AgentStatus } from '../../types';
import { MeterBar } from '../beds/charts/MeterBar';

/** All nine agents in the client's order: online dot, how much work each holds, and how often it is on time. */
export const AgentStatusTable: React.FC<{ agents: AgentStatus[] | null; error: string | null }> = ({ agents, error }) => {
  const byKey = new Map((agents ?? []).map((a) => [a.key, a]));
  return (
    <section className="medios-card bagent-card co-card" aria-label="Agent status">
      <div className="card-header-row">
        <h3 className="card-title">Agent status</h3>
      </div>
      {!agents ? (
        <p className="data-empty" role={error ? 'alert' : undefined}>
          {error ?? 'Loading agents…'}
        </p>
      ) : (
        <ul className="co-agents">
          {AGENT_LIST.map((info) => {
            const a = byKey.get(info.key);
            const built = a?.built ?? info.built;
            const online = !!a?.online;
            return (
              <li key={info.key} className={`co-agent${built ? '' : ' is-dim'}`}>
                <span className="co-agent-name">
                  <span className={`co-dot${online ? ' is-on' : ''}`} role="img" aria-label={online ? 'Online' : 'Offline'} data-tip={online ? 'Online' : 'Offline'} />
                  <span className="co-agent-label">{info.name}</span>
                </span>
                {built && a ? (
                  <>
                    <span className="co-agent-load">
                      <MeterBar value={a.open} max={a.capacity} label={`${info.name}: ${a.open} open of ${a.capacity}`} />
                      <span className="co-agent-count">
                        {a.open}/{a.capacity}
                      </span>
                    </span>
                    <span className="co-agent-pct" data-tip="Share of work finished on time">
                      {a.onTimePct === null ? '–' : `${a.onTimePct}%`}
                    </span>
                  </>
                ) : (
                  <span className="co-agent-soon">Not built yet</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
