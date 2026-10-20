import { useEffect, useState } from 'react';
import { Link2, Loader2, ScanSearch } from 'lucide-react';
import { analyze } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ResultView from './ResultView.jsx';

const SAMPLES = [
  { label: 'Health claim', text: 'Drinking hot lemon water every morning completely cures cancer, doctors are hiding this.' },
  { label: 'Viral forward', text: 'BREAKING: Government will ban all UPI payments from next month. Forward this to everyone before it is deleted!' },
  { label: 'Policy news', text: 'The central government has announced a new education policy that will be applied across all states from next year.' },
];

const STEPS = ['Reading your content…', 'Searching the live web…', 'Comparing trusted sources…', 'Weighing the evidence…'];

export default function Analyzer() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Loading ke time messages badalte rehte hain
  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(t);
  }, [loading]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !url.trim()) return setError('Paste a claim or add a news link first.');
    setError('');
    setResult(null);
    setLoading(true);
    try {
      setResult(await analyze({ text: text.trim(), url: url.trim() }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card p-5 sm:p-6">
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="content" className="text-sm font-semibold text-slate-800">Content to check</label>
          <span className="text-xs text-slate-400">{text.length} / 5000</span>
        </div>
        <textarea
          id="content" rows={5} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Paste a headline, article excerpt or social media post…" className="input resize-y"
        />

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          Try a sample:
          {SAMPLES.map((s) => (
            <button key={s.label} type="button" onClick={() => { setText(s.text); setUrl(''); }}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700">
              {s.label}
            </button>
          ))}
        </div>

        <label htmlFor="url" className="mb-1.5 mt-5 block text-sm font-semibold text-slate-800">
          News link <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <div className="relative">
          <Link2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/news/article" className="input !pl-10" />
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-5 w-full sm:w-auto">
          {loading ? <><Loader2 size={16} className="animate-spin" /> {STEPS[step]}</> : <><ScanSearch size={16} /> Analyze</>}
        </button>
      </form>

      {result && <ResultView result={result} canSave={Boolean(user)} saved={result.saved} />}
    </div>
  );
}