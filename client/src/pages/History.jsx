import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHistory, getStats, deleteAnalysis, errorMessage } from '../api/client.js';

const FILTERS = ['ALL', 'REAL', 'FAKE', 'UNCERTAIN'];
const COLORS = { REAL: '#22c55e', FAKE: '#ef4444', UNCERTAIN: '#f59e0b' };

function Stat({ label, value, color }) {
  return (
    <div className="card text-center">
      <b className="block text-3xl" style={color ? { color } : undefined}>{value}</b>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

export default function History() {
  const [stats, setStats] = useState(null);
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 8, ...(filter !== 'ALL' && { verdict: filter }) };
      const [h, s] = await Promise.all([getHistory(params), getStats()]);
      setData(h.data);
      setStats(s.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this analysis?')) return;
    try { await deleteAnalysis(id); load(); } catch (err) { setError(errorMessage(err)); }
  };

  return (
    <>
      <h1 className="text-3xl font-bold">Your history</h1>

      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Total" value={stats.total} />
          <Stat label="Real" value={stats.REAL} color={COLORS.REAL} />
          <Stat label="Fake" value={stats.FAKE} color={COLORS.FAKE} />
          <Stat label="Avg score" value={stats.avgScore} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              filter === f ? 'border-brand bg-brand text-white' : 'border-line text-muted hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="error-box">{error}</p>}

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-center text-muted">Loading…</p>
        ) : data.items.length === 0 ? (
          <p className="text-center text-muted">Nothing here yet. <Link to="/analyze">Analyze something</Link>.</p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-xs uppercase text-muted">
                <th className="p-2">Content</th><th className="p-2">Verdict</th>
                <th className="p-2">Score</th><th className="p-2">Date</th><th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a._id} className="border-t border-line">
                  <td className="p-2" title={a.inputText}>{a.inputText.slice(0, 70)}{a.inputText.length > 70 && '…'}</td>
                  <td className="p-2"><span className="badge" style={{ background: COLORS[a.verdict] }}>{a.verdict}</span></td>
                  <td className="p-2">{a.reliabilityScore}</td>
                  <td className="p-2 text-sm text-muted">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="p-2"><button className="btn btn-ghost !px-3 !py-1" onClick={() => remove(a._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="text-muted">Page {data.page} / {data.pages}</span>
          <button className="btn btn-ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}