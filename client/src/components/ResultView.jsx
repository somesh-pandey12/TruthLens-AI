import { useState } from 'react';
import { AlertTriangle, Check, Copy, ExternalLink, Globe2 } from 'lucide-react';
import ScoreRing from './ScoreRing.jsx';
import VerdictBadge from './VerdictBadge.jsx';
import { STANCES, verdictOf } from '../lib/verdict.js';

export default function ResultView({ result, canSave, saved }) {
  const [copied, setCopied] = useState(false);
  const v = verdictOf(result.verdict);

  const copy = async () => {
    const lines = [
      `TruthLens: ${v.label} (credibility ${result.score}/100, confidence ${result.confidence}%)`,
      result.claim && `Claim: ${result.claim}`,
      result.summary,
      ...result.sources.slice(0, 3).map((s) => `• ${s.title} — ${s.url}`),
    ].filter(Boolean);
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="card animate-fadeUp overflow-hidden">
      {/* Verdict */}
      <div className={`flex flex-col gap-5 p-6 sm:flex-row sm:items-center ${v.tint}`}>
        <ScoreRing score={result.score} color={v.stroke} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={result.verdict} />
            <span className="text-xs text-slate-500">Confidence {result.confidence}%</span>
          </div>
          {result.claim && <p className="mt-2 text-sm font-semibold text-slate-900">{result.claim}</p>}
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{result.summary}</p>
        </div>
      </div>

      {/* Red flags + signals */}
      <div className="grid gap-6 border-t border-slate-200 p-6 sm:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Language signals</h4>
          <p className="mt-2 text-sm text-slate-700">
            Tone: <span className="font-semibold capitalize">{result.tone}</span>
          </p>
          {result.usedArticle && <p className="mt-1 text-xs text-slate-500">The linked article was read and checked.</p>}
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Red flags</h4>
          {result.redFlags.length ? (
            <ul className="mt-2 space-y-1.5">
              {result.redFlags.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-500" /> {f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              <Check size={15} className="text-emerald-600" /> None found
            </p>
          )}
        </div>
      </div>

      {/* Sources */}
      <div className="border-t border-slate-200 p-6">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Globe2 size={14} /> Live web sources ({result.sources.length})
        </h4>
        {result.sources.length ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {result.sources.map((s) => {
              const st = STANCES[s.stance] || STANCES.neutral;
              return (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 group-hover:text-brand-700">{s.title}</p>
                      <p className="truncate text-xs text-slate-500">{s.domain}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                    <ExternalLink size={14} className="shrink-0 text-slate-400" />
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No matching web sources were found for this claim.</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Automated assessment based on live web results. Confirm important claims with primary sources.
          {canSave === false && ' Sign in to save results to your history.'}
          {saved && ' Saved to your history.'}
        </p>
        <button onClick={copy} className="btn-ghost shrink-0 !py-2">
          {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy summary</>}
        </button>
      </div>
    </div>
  );
}