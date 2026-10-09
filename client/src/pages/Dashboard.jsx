import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, ShieldX, Gauge, ScanSearch } from 'lucide-react';
import { getStats, errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import Donut from '../components/Donut.jsx';
import ActivityChart from '../components/ActivityChart.jsx';
import VerdictBadge, { VERDICT } from '../components/VerdictBadge.jsx';

const pct = (n, total) => (total ? `${Math.round((n / total) * 100)}% of all checks` : 'No checks yet');
const fmt = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-slate-200/70" />)}
      </div>
      <div className="h-64 rounded-xl bg-slate-200/70" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    getStats()
      .then((res) => alive && setStats(res.data))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => { alive = false; };
  }, []);

  const newBtn = <Link to="/analyze" className="btn btn-primary"><ScanSearch size={16} />New analysis</Link>;

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${user.name.split(' ')[0]}. Here is a summary of your checks.`} actions={newBtn} />

      {error && <p className="alert-error mb-4">{error}</p>}
      {!stats && !error && <Skeleton />}

      {stats && stats.total === 0 && (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><ScanSearch size={22} /></div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">No analyses yet</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">Run your first check and the results will build up here.</p>
          <Link to="/analyze" className="btn btn-primary mt-5">Analyze something</Link>
        </div>
      )}

      {stats && stats.total > 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total analyses" value={stats.total} hint="All time" Icon={Activity} />
            <StatCard label="Likely false" value={stats.FAKE} hint={pct(stats.FAKE, stats.total)} Icon={ShieldX} tone="text-red-600" />
            <StatCard label="Credible" value={stats.REAL} hint={pct(stats.REAL, stats.total)} Icon={ShieldCheck} tone="text-emerald-600" />
            <StatCard label="Average score" value={`${stats.avgScore}`} hint="Out of 100" Icon={Gauge} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="card p-6 lg:col-span-2">
              <h2 className="text-base font-semibold text-slate-900">Activity</h2>
              <p className="mb-5 text-sm text-slate-500">Analyses per day, last 14 days</p>
              <ActivityChart data={stats.daily} />
            </section>

            <section className="card p-6">
              <h2 className="text-base font-semibold text-slate-900">Verdict mix</h2>
              <p className="mb-5 text-sm text-slate-500">How your checks turned out</p>
              <div className="flex flex-col items-center gap-5">
                <Donut
                  centerValue={stats.total} centerLabel="checks"
                  segments={['REAL', 'FAKE', 'UNCERTAIN'].map((k) => ({ label: k, value: stats[k], color: VERDICT[k].hex }))}
                />
                <ul className="w-full space-y-2 text-sm">
                  {['REAL', 'FAKE', 'UNCERTAIN'].map((k) => (
                    <li key={k} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: VERDICT[k].hex }} />
                        {VERDICT[k].label}
                      </span>
                      <span className="font-medium text-slate-900">{stats[k]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          <section className="card">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Recent analyses</h2>
              <Link to="/history" className="link text-sm">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3 font-medium">Content</th>
                    <th className="px-3 py-3 font-medium">Verdict</th>
                    <th className="px-3 py-3 font-medium">Score</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recent.map((a) => (
                    <tr key={a._id}>
                      <td className="max-w-xs truncate px-6 py-3 text-slate-700" title={a.inputText}>{a.inputText}</td>
                      <td className="px-3 py-3"><VerdictBadge verdict={a.verdict} size="sm" /></td>
                      <td className="px-3 py-3 tabular-nums text-slate-700">{a.reliabilityScore}</td>
                      <td className="whitespace-nowrap px-6 py-3 text-slate-500">{fmt(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}