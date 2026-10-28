import React from 'react';
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from 'lucide-react';
import type { StatCardData } from '../../types';
import { RollingText } from '../common/RollingText';
import { Sparkline } from './charts/Sparkline';

export type StatTone = 'green' | 'purple' | 'red' | 'amber' | 'blue' | 'slate';

interface StatCardProps {
  icon: LucideIcon;
  tone: StatTone;
  title: string;
  data: StatCardData;
  /** Whether a rise is good news (green). False for occupied and cleaning, where a rise is bad (red). */
  goodWhenUp?: boolean;
}

/**
 * A bed figure: a big tinted icon tile, the number (rolling when it changes) with "/ total", the change against
 * the same hour yesterday, the last 24 hours as a sparkline, and one line underneath.
 */
export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, tone, title, data, goodWhenUp = true }) => {
  const { value, total, trendPct, spark, note } = data;
  const known = spark.filter((p): p is number => p !== null);
  const sparkLabel =
    known.length >= 2 ? `${title}, last 24 hours: from ${known[0]} to ${known[known.length - 1]}` : `${title}, last 24 hours`;

  let trend: React.ReactNode = null;
  if (trendPct !== null) {
    const direction = trendPct > 0 ? 'up' : trendPct < 0 ? 'down' : 'flat';
    const mood = direction === 'flat' ? 'is-flat' : (direction === 'up') === goodWhenUp ? 'is-good' : 'is-bad';
    const Arrow = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : Minus;
    const spoken = direction === 'flat' ? 'No change since yesterday' : `${direction === 'up' ? 'Up' : 'Down'} ${Math.abs(trendPct)}% since yesterday`;
    trend = (
      <span className={`bstat-trend ${mood}`} role="img" aria-label={spoken} data-tip="Change against the same hour yesterday">
        <Arrow size={13} strokeWidth={2.4} aria-hidden="true" />
        <RollingText value={`${Math.abs(trendPct)}%`} />
      </span>
    );
  }

  return (
    <section className={`bstat tone-${tone}`} aria-label={title}>
      <div className="bstat-body">
        <span className="bstat-tile" aria-hidden="true">
          <Icon size={24} strokeWidth={2} />
        </span>
        <h3 className="bstat-title">{title}</h3>
        <p className="bstat-value">
          <span className="bstat-figure">
            <RollingText value={value} className="bstat-number" />
            {total !== null && <span className="bstat-total">/ {total}</span>}
          </span>
          {trend}
        </p>
        <p className="bstat-note">{note}</p>
        <div className="bstat-spark">
          <Sparkline points={spark} tone="var(--bs-line)" label={sparkLabel} />
        </div>
      </div>
    </section>
  );
};
