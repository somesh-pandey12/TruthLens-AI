import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ScanSearch } from 'lucide-react';
import { analyzeText, errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ResultPanel from '../components/ResultPanel.jsx';

const SAMPLES = [
  ['Health claim', 'Scientists discover that drinking coffee every morning extends life by 20 years, according to a new Harvard study.'],
  ['Policy news', 'The government announced new tax relief measures for small businesses effective from next month.'],
  ['Viral post', 'BREAKING: Aliens have landed in Times Square and world leaders are meeting secretly. Share before they delete this!'],
];

export default function Analyze() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (e) => {
    e.preventDefault();
    if (inFlight.current || cooldown > 0) return;
    if (text.trim().length < 20) {
      setError('Enter at least 20 characters so there is enough to assess.');
      return;
    }
    inFlight.current = true;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await analyzeText({ text: text.trim(), url: url.trim() });
      setResult(data);
    } catch (err) {
      if (err.response?.status === 429) setCooldown(Number(err.response.data?.retryAfter) || 30);
      setError(errorMessage(err, 'The analysis failed. Please try again.'));
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  };

  const busy = loading || cooldown > 0;

  return (
    <>
      <PageHeader title="New analysis" description="Paste a headline, article excerpt or social media post to assess its credibility." />

      <form onSubmit={submit} className="card p-6">
        <div className="flex items-center justify-between">
          <label htmlFor="content" className="label !mb-0">Content to check</label>
          <span className="text-xs text-slate-400">{text.length} / 5000</span>
        </div>
        <textarea
          id="content" className="input mt-2 min-h-[180px] resize-y leading-relaxed" maxLength={5000}
          value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the text here…"
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>Try a sample:</span>
          {SAMPLES.map(([label, sample]) => (
            <button key={label} type="button" className="link text-xs" onClick={() => { setText(sample); setResult(null); setError(''); }}>{label}</button>
          ))}
        </div>

        <div className="mt-5">
          <label htmlFor="url" className="label">Source link <span className="font-normal text-slate-400">(optional)</span></label>
          <input id="url" className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/article" />
        </div>

        {error && <p className="alert-error mt-4" role="alert">{error}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button className="btn btn-primary px-5 py-2.5" disabled={busy}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ScanSearch size={16} />}
            {loading ? 'Analyzing…' : cooldown > 0 ? `Try again in ${cooldown}s` : 'Analyze'}
          </button>
          {loading && <span className="text-sm text-slate-500">This can take up to 30 seconds while sources are checked.</span>}
        </div>
      </form>

      {result && (
        <div className="mt-6">
          <ResultPanel result={result} />
          {!user && (
            <p className="mt-4 text-sm text-slate-600">
              <Link to="/register" className="link">Create a free account</Link> to keep results in your history.
            </p>
          )}
        </div>
      )}
    </>
  );
}