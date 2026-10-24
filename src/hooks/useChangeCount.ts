import { useState } from 'react';

/** Counts changes to a value after the first render, so a one-off effect can replay on each change. */
export const useChangeCount = (value: unknown): number => {
  const [seen, setSeen] = useState({ value, count: 0 });
  if (!Object.is(seen.value, value)) setSeen({ value, count: seen.count + 1 });
  return seen.count;
};
