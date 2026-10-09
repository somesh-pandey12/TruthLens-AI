import { ShieldCheck, ShieldX, ShieldQuestion } from 'lucide-react';

export const VERDICT = {
  REAL: { label: 'Credible', hex: '#15803d', text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-600/20', Icon: ShieldCheck },
  FAKE: { label: 'Likely false', hex: '#b91c1c', text: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-600/20', Icon: ShieldX },
  UNCERTAIN: { label: 'Unverified', hex: '#b45309', text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-600/20', Icon: ShieldQuestion },
};

export const verdictOf = (key) => VERDICT[key] || VERDICT.UNCERTAIN;

export default function VerdictBadge({ verdict, size = 'md' }) {
  const v = verdictOf(verdict);
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${pad} ${v.bg} ${v.text} ${v.ring}`}>
      <v.Icon size={14} strokeWidth={2} />
      {v.label}
    </span>
  );
}