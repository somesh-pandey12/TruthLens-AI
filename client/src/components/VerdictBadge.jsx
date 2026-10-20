import { verdictOf } from '../lib/verdict.js';

export default function VerdictBadge({ verdict }) {
  const v = verdictOf(verdict);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${v.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
      {v.label}
    </span>
  );
}