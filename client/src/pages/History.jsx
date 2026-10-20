import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { deleteAnalysis, getHistory } from '../lib/api.js';
import VerdictBadge from '../components/VerdictBadge.jsx';
import ResultView from '../components/ResultView.jsx';

export default function History() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      setData(await getHistory(page));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this analysis?')) return;
    try {
      await deleteAnalysis(id);
      load(data.page);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">Your history</h1>
      <p className="text-sm text-slate-500">{data.total} saved {data.total === 1 ? 'analysis' : 'analyses'}</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading && <p className="mt-10 text-center text-sm text-slate-500">Loading…</p>}
      {!loading && !data.items.length && !error && (
        <div className="card mt-6 p-10 text-center text-sm text-slate-500">Nothing here yet. Run an analysis while signed in and it will show up here.</div>
      )}

      <ul className="mt-6 space-y-3">
        {data.items.map((it) => (
          <li key={it._id} className="card overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <button onClick={() => setOpen(open === it._id ? null : it._id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <VerdictBadge verdict={it.verdict} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{it.claim || it.inputText || it.sourceUrl}</span>
                  <span className="text-xs text-slate-500">{new Date(it.createdAt).toLocaleString()} · Score {it.score}</span>
                </span>
                <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${open === it._id ? 'rotate-180' : ''}`} />
              </button>
              <button onClick={() => remove(it._id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
            {open === it._id && (
              <div className="border-t border-slate-200 bg-slate-50 p-3">
                <ResultView result={{ ...it, sources: it.sources || [], redFlags: it.redFlags || [] }} />
              </div>
            )}
          </li>
        ))}
      </ul>

      {data.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <button className="btn-ghost !py-1.5" disabled={data.page <= 1} onClick={() => load(data.page - 1)}>Previous</button>
          <span className="text-slate-500">Page {data.page} of {data.pages}</span>
          <button className="btn-ghost !py-1.5" disabled={data.page >= data.pages} onClick={() => load(data.page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}