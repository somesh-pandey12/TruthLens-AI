import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Search, Trash2 } from 'lucide-react';
import { getHistory, deleteAnalysis, exportHistory, errorMessage } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import VerdictBadge from '../components/VerdictBadge.jsx';
import ResultPanel from '../components/ResultPanel.jsx';
import Modal from '../components/Modal.jsx';

const FILTERS = [['ALL', 'All'], ['REAL', 'Credible'], ['FAKE', 'Likely false'], ['UNCERTAIN', 'Unverified']];
const PAGE_SIZE = 10;
const fmt = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function History() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setQ(query.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: PAGE_SIZE, ...(filter !== 'ALL' && { verdict: filter }), ...(q && { q }) };
      const res = await getHistory(params);
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, filter, q]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this analysis? This cannot be undone.')) return;
    try {
      await deleteAnalysis(id);
      setSelected(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const download = async () => {
    setExporting(true);
    try {
      const res = await exportHistory();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'truthlens-history.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const from = data.total ? (data.page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(data.page * PAGE_SIZE, data.total);

  return (
    <>
      <PageHeader
        title="History"
        description="Every analysis you ran while signed in."
        actions={<button className="btn btn-secondary" onClick={download} disabled={exporting || !data.total}><Download size={16} />{exporting ? 'Preparing…' : 'Export CSV'}</button>}
      />

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search content…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search history" />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by verdict">
            {FILTERS.map(([key, label]) => (
              <button
                key={key} onClick={() => { setFilter(key); setPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filter === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="alert-error m-4">{error}</p>}

        {loading ? (
          <p className="px-6 py-16 text-center text-sm text-slate-500">Loading…</p>
        ) : data.items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-slate-600">{q || filter !== 'ALL' ? 'No analyses match these filters.' : 'You have not run any analyses yet.'}</p>
            {!q && filter === 'ALL' && <Link to="/analyze" className="btn btn-primary mt-4">Analyze something</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3 font-medium">Content</th>
                  <th className="px-3 py-3 font-medium">Verdict</th>
                  <th className="px-3 py-3 font-medium">Score</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((a) => (
                  <tr key={a._id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelected(a)}>
                    <td className="max-w-md truncate px-6 py-3.5 text-slate-800" title={a.inputText}>{a.inputText}</td>
                    <td className="px-3 py-3.5"><VerdictBadge verdict={a.verdict} size="sm" /></td>
                    <td className="px-3 py-3.5 tabular-nums text-slate-700">{a.reliabilityScore}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-slate-500">{fmt(a.createdAt)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => { e.stopPropagation(); remove(a._id); }} aria-label="Delete analysis" title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 text-sm text-slate-500">
            <span>Showing {from}–{to} of {data.total}</span>
            <div className="flex gap-2">
              <button className="btn btn-secondary !py-1.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="btn btn-secondary !py-1.5" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Analysis details">
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="section-title">Submitted text</p>
              <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">{selected.inputText}</p>
              <p className="mt-2 text-xs text-slate-500">
                Analyzed {fmt(selected.createdAt)}
                {selected.sourceUrl && <> · Source: <span className="break-all">{selected.sourceUrl}</span></>}
              </p>
            </div>
            <ResultPanel result={selected} />
            <div className="flex justify-end">
              <button className="btn btn-danger" onClick={() => remove(selected._id)}><Trash2 size={15} />Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}