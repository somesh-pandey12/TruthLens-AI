
export const VERDICTS = {
  TRUE:       { label: 'Likely true',  badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', stroke: '#059669', tint: 'bg-emerald-50/60', dot: 'bg-emerald-500' },
  FALSE:      { label: 'Likely false', badge: 'bg-red-50 text-red-700 ring-red-200',             stroke: '#dc2626', tint: 'bg-red-50/60',     dot: 'bg-red-500' },
  MISLEADING: { label: 'Misleading',   badge: 'bg-amber-50 text-amber-800 ring-amber-200',       stroke: '#d97706', tint: 'bg-amber-50/60',   dot: 'bg-amber-500' },
  UNVERIFIED: { label: 'Unverified',   badge: 'bg-slate-100 text-slate-700 ring-slate-300',      stroke: '#64748b', tint: 'bg-slate-100/70',  dot: 'bg-slate-400' },
};

export const verdictOf = (v) => VERDICTS[v] || VERDICTS.UNVERIFIED;

export const STANCES = {
  supports:    { label: 'Supports',    cls: 'bg-emerald-50 text-emerald-700' },
  contradicts: { label: 'Contradicts', cls: 'bg-red-50 text-red-700' },
  neutral:     { label: 'Related',     cls: 'bg-slate-100 text-slate-600' },
};