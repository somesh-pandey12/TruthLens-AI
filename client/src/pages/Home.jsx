import { FileSearch, Globe2, ShieldCheck } from 'lucide-react';
import Analyzer from '../components/Analyzer.jsx';

const HOW = [
  { icon: FileSearch, title: 'Paste or link', text: 'Drop in a headline, a forwarded message or a news link.' },
  { icon: Globe2, title: 'Live web check', text: 'We search trusted sources on the web in real time.' },
  { icon: ShieldCheck, title: 'Clear verdict', text: 'AI weighs the evidence and shows a score with sources.' },
];

export default function Home() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 via-white to-slate-50">
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-14 text-center sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" /> Live web search + AI reasoning
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Check before you <span className="text-brand-600">share</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
            Paste any news, headline or viral post. TruthLens compares it with live sources and tells you how credible it is.
          </p>
        </div>
      </section>

      <section className="mx-auto -mt-2 max-w-3xl px-4 pb-16">
        <Analyzer />

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {HOW.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon size={18} /></span>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}