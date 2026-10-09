import { Link } from 'react-router-dom';
import { ScanSearch, BookOpenCheck, BarChart3 } from 'lucide-react';

const FEATURES = [
  {
    Icon: ScanSearch,
    title: 'Credibility check',
    text: 'Paste a headline, article or social post. TruthLens scores how reliable it looks and lists the specific red flags in the wording.',
  },
  {
    Icon: BookOpenCheck,
    title: 'What the facts say',
    text: 'When something looks false or unverified, you get a short explanation of what is actually known, with sources when available.',
  },
  {
    Icon: BarChart3,
    title: 'Your own record',
    text: 'Signed-in users keep a searchable history and a dashboard showing how much of what they check holds up.',
  },
];

const STEPS = [
  ['Paste the text', 'Copy the headline or message you are unsure about.'],
  ['Read the assessment', 'See the verdict, score and what triggered it.'],
  ['Check the facts', 'Review the correction and open the sources yourself.'],
];

export default function Landing() {
  return (
    <>
      <section className="mx-auto max-w-3xl py-14 text-center sm:py-20">
        <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
          Know what you are reading before you share it.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          TruthLens assesses the credibility of news and posts, and when a claim does not hold up, shows what the facts actually say.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/analyze" className="btn btn-primary px-5 py-2.5 text-[15px]">Analyze a claim</Link>
          <Link to="/register" className="btn btn-secondary px-5 py-2.5 text-[15px]">Create an account</Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">No account needed to try it.</p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {FEATURES.map(({ Icon, title, text }) => (
          <div key={title} className="card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-semibold text-slate-900">How it works</h2>
        <ol className="mt-5 grid gap-5 md:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700">{i + 1}</span>
              <div>
                <p className="font-medium text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">What it can and cannot do</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          TruthLens reads wording, tone and plausibility, and where available looks up supporting sources. It is a screening tool, not a final ruling: it can be wrong, and
          very recent events may not be covered. Treat the result as a starting point and confirm important claims with primary sources.
        </p>
      </section>
    </>
  );
}