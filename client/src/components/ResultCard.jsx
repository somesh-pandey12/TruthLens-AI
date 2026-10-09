import { useState } from 'react';
import ScoreGauge from './ScoreGauge.jsx';

export const VERDICTS = {
  REAL: { label: 'Likely Real', color: '#22c55e', icon: '✅' },
  FAKE: { label: 'Likely Fake', color: '#ef4444', icon: '🚫' },
  UNCERTAIN: { label: 'Uncertain', color: '#f59e0b', icon: '⚠️' },
};

export default function ResultCard({ result }) {
  const [copied, setCopied] = useState(false);
  const v = VERDICTS[result.verdict] || VERDICTS.UNCERTAIN;

  const copy = async () => {
    const text = `VerifyAI: ${v.label} | Score ${result.reliabilityScore}/100 | ${result.explanation}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  return (
    <section className="card">
      <div className="flex flex-wrap items-center gap-6">
        <ScoreGauge score={result.reliabilityScore} color={v.color} />
        <div className="min-w-0 flex-1">
          <span className="badge" style={{ background: v.color }}>{v.icon} {v.label}</span>
          <p className="mb-1.5 mt-2.5 text-lg">{result.explanation}</p>
          <p className="text-sm text-muted">
            Confidence {result.confidence}% · Sentiment {result.sentiment} · Subjectivity {result.subjectivity}%
            {result.cached && ' · cached'}
          </p>
        </div>
      </div>

      {result.redFlags?.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <h4 className="mb-1 font-semibold">Red flags</h4>
          <ul className="list-disc space-y-0.5 pl-5 text-red-300">
            {result.redFlags.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button className="btn btn-ghost" onClick={copy}>{copied ? 'Copied ✓' : 'Copy result'}</button>
        {result.saved && <span className="text-sm text-muted">Saved to your history</span>}
      </div>
      <p className="mt-3 text-xs text-muted">
        AI assessment based on writing patterns — it cannot browse the web. Always verify with trusted sources.
      </p>
    </section>
  );
}