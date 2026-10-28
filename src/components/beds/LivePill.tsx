import React, { useState } from 'react';

/** LIVE with a pulsing dot while the bed stream is connected; otherwise says it is (re)connecting. */
export const LivePill: React.FC<{ live: boolean }> = ({ live }) => {
  const [everLive, setEverLive] = useState(live);
  if (live && !everLive) setEverLive(true);

  return (
    <span className={`live-pill${live ? ' is-live' : ''}`} role="status">
      {live ? (
        <>
          <span className="live-dot" aria-hidden="true" />
          LIVE
        </>
      ) : everLive ? (
        'Reconnecting…'
      ) : (
        'Connecting…'
      )}
    </span>
  );
};
