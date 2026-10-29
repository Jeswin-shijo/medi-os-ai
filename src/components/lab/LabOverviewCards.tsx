import React from 'react';
import { CheckCheck, ClipboardList, FlaskConical, Siren, TestTube } from 'lucide-react';
import type { LabOverview } from '../../types';
import { StatCard } from '../beds/StatCard';

/** The five figures at the top of the Lab page. A figure with no data shows "—", never 0. */
export const LabOverviewCards: React.FC<{ cards: LabOverview['cards'] }> = ({ cards }) => (
  <div className="cols-5 bagent-grid">
    <StatCard icon={ClipboardList} tone="blue" title="Orders today" data={cards.ordersToday} display={cards.ordersToday.value == null ? '—' : undefined} />
    <StatCard icon={TestTube} tone="green" title="Samples collected" data={cards.samplesCollected} display={cards.samplesCollected.value == null ? '—' : undefined} />
    <StatCard icon={FlaskConical} tone="purple" title="In processing" data={cards.inProcessing} display={cards.inProcessing.value == null ? '—' : undefined} />
    <StatCard icon={CheckCheck} tone="green" title="Results completed" data={cards.resultsCompleted} display={cards.resultsCompleted.value == null ? '—' : undefined} />
    <StatCard icon={Siren} tone="red" title="Critical results" data={cards.criticalResults} goodWhenUp={false} display={cards.criticalResults.value == null ? '—' : undefined} />
  </div>
);
