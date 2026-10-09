import { useEffect, useRef, useState } from 'react';
import { analyzeText, errorMessage } from '../api/client.js';
import ResultCard from '../components/ResultCard.jsx';

const EXAMPLES = [
  'Scientists discover that drinking coffee every morning extends life by 20 years, according to a new Harvard study.',
  'The government announced new tax relief measures for small businesses effective from next month.',
  'BREAKING: Aliens have landed in Times Square and world leaders are meeting secretly. Share before they delete this!',
];

export default function Analyze() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async () => {
    if (inFlight.current || cooldown > 0) return;
    if (text.trim().length < 20) return setError('Please enter at least 20 characters.');

    inFlight.current = true;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await analyzeText({ text: text.trim(), url: url.trim() });
      setResult(data);
    } catch (err) {
      if (err.response?.status === 429) setCooldown(Number(err.response.data?.retryAfter) || 30);
      setError(errorMessage(err, 'Analysis failed. Please try again.'));
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  };

  const busy = loading || cooldown > 0;

  return (
    <>
      <h1 className="text-3xl font-bold">Analyze content</h1>
      <p className="text-muted">Paste a news article, headline, or social media post.</p>

      <div className="grid items-start gap-4 md:grid-cols-3">
        <div className="card md:col-span-2">
          <div className="mb-2 flex justify-between">
            <strong>Content</strong>
            <span className="text-sm text-muted">{text.length} / 5000</span>
          </div>
          <textarea
            className="input mb-3 min-h-[200px] resize-y"
            maxLength={5000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here…"
          />
          <label className="text-sm text-muted">Source URL (optional)
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/article" />
          </label>
          {error && <p className="error-box">{error}</p>}
          {loading && <p className="mt-3 text-sm text-muted">⏳ Analyzing… the first request after idle can take up to a minute.</p>}
          <button className="btn btn-primary mt-4 w-full py-3" onClick={submit} disabled={busy}>
            {loading ? 'Analyzing…' : cooldown > 0 ? `Try again in ${cooldown}s` : 'Analyze now'}
          </button>
        </div>

        <div className="card">
          <strong>Try an example</strong>
          <div className="mt-3 flex flex-col gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                className="rounded-xl border border-line bg-ink p-2.5 text-left text-sm hover:border-brand"
                onClick={() => { setText(ex); setResult(null); setError(''); }}
              >
                {ex.slice(0, 80)}…
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && <ResultCard result={result} />}
    </>
  );
}