const short = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function ActivityChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const ticks = [max, Math.round(max / 2), 0];
  return (
    <div className="flex gap-3">
      <div className="flex h-44 flex-col justify-between pb-0.5 text-right text-[11px] text-slate-400">
        {ticks.map((t, i) => <span key={i}>{t}</span>)}
      </div>
      <div className="flex-1">
        <div className="flex h-44 items-end gap-1.5 border-b border-slate-200">
          {data.map((d) => (
            <div key={d.date} className="group relative flex h-full flex-1 items-end" title={`${short(d.date)}: ${d.count}`}>
              <div
                className={`w-full rounded-t ${d.count ? 'bg-brand-600 group-hover:bg-brand-700' : 'bg-slate-100'}`}
                style={{ height: d.count ? `${(d.count / max) * 100}%` : '3px' }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-slate-400">
          <span>{short(data[0].date)}</span>
          <span>{short(data[data.length - 1].date)}</span>
        </div>
      </div>
    </div>
  );
}