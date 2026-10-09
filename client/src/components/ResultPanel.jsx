import { useState } from 'react';
import { Check, Copy, ExternalLink, Globe, BookOpen, AlertTriangle } from 'lucide-react';
import ScoreRing from './ScoreRing.jsx';
import VerdictBadge, { verdictOf } from './VerdictBadge.jsx';

function Signal({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{children}</span>
    </div>
  );
}

export default function ResultPanel({ result }) {
  const [copied, setCopied] = useState(false);
  const v = verdictOf(result.verdict);
  const truth = result.truth;
  const needsFacts = result.verdict !== 'REAL';

  const copy = async () => {
    const lines = [`TruthLens: ${v.label} (score ${result.reliabilityScore}/100)`, result.explanation];
    if (truth?.summary) lines.push(`What the facts say: ${truth.summary}`);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  return (
    <section className="card overflow-hidden">
      <div className={`flex flex-wrap items-center gap-6 border-b border-slate-200 p-6 ${v.bg}`}>
        <ScoreRing score={result.reliabilityScore} color={v.hex} />
        <div className="min-w-0 flex-1">
          <VerdictBadge verdict={result.verdict} />
          <p className="mt-3 text-base leading-relaxed text-slate-800">{result.explanation}</p>
          <p className="mt-2 text-sm text-slate-500">Model confidence: {result.confidence}%{result.cached && ' · served from cache'}</p>
        </div>
      </div>

      <div className="grid gap-8 p-6 md:grid-cols-2">
        <div>
          <h3 className="section-title">Language signals</h3>
          <div className="mt-2 divide-y divide-slate-100">
            <Signal label="Sentiment"><span className="capitalize">{String(result.sentiment || 'neutral').toLowerCase()}</span></Signal>
            <Signal label="Subjectivity">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-slate-500" style={{ width: `${Math.min(100, result.subjectivity || 0)}%` }} />
                </span>
                {Math.round(result.subjectivity || 0)}%
              </span>
            </Signal>
          </div>
        </div>
        <div>
          <h3 className="section-title">Red flags</h3>
          {result.redFlags?.length ? (
            <ul className="mt-3 space-y-2">
              {result.redFlags.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
                  {f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No red flags detected in the wording.</p>
          )}
        </div>
      </div>

      {needsFacts && (
        <div className="border-t border-slate-200 bg-slate-50/60 p-6">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-brand-700" />
            <h3 className="text-sm font-semibold text-slate-900">What the facts say</h3>
          </div>

          {truth ? (
            <>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-800">{truth.summary}</p>
              {truth.facts?.length > 0 && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                  {truth.facts.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}
              {truth.sources?.length > 0 && (
                <div className="mt-4">
                  <p className="section-title">Sources</p>
                  <ul className="mt-2 space-y-1.5">
                    {truth.sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5 text-sm">
                          <ExternalLink size={13} className="shrink-0" />
                          <span className="break-all">{s.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
                <Globe size={14} className="mt-0.5 shrink-0" />
                {truth.grounded
                  ? 'Compiled from a live web search. Open the sources to confirm before sharing.'
                  : 'Based on the AI model’s general knowledge, not a live web search. It may be incomplete or out of date — verify with trusted outlets.'}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">A fact-check could not be generated for this item. Check it against trusted news outlets.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
        <p className="max-w-xl text-xs text-slate-500">
          This is an automated assessment of wording and plausibility, not a final ruling. Confirm important claims with primary sources.
        </p>
        <div className="flex items-center gap-3">
          {result.saved && <span className="text-xs text-slate-500">Saved to history</span>}
          <button className="btn btn-secondary" onClick={copy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy summary'}
          </button>
        </div>
      </div>
    </section>
  );
}