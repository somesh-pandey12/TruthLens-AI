import { Link } from 'react-router-dom';

const features = [
  ['🧠', 'LLM-powered analysis', 'Llama 3.3 70B on Groq judges credibility from wording, tone and plausibility.'],
  ['📊', 'Reliability score', 'A 0–100 score with confidence, explanation and the exact red flags it found.'],
  ['🔍', 'NLP insights', 'Sentiment and subjectivity are measured with TextBlob and fed to the model.'],
  ['🗂️', 'History & stats', 'Sign in to keep every analysis and see your verdict breakdown.'],
];

export default function Home() {
  return (
    <>
      <section className="pb-5 pt-14 text-center">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
          Is that news{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">real</span> or{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">fake</span>?
        </h1>
        <p className="mx-auto mb-7 mt-4 max-w-xl text-lg text-muted">
          Paste any headline, article or social post and get an AI credibility check in seconds.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/analyze" className="btn btn-primary px-6 py-3 text-base hover:text-white">Analyze now</Link>
          <Link to="/register" className="btn btn-ghost px-6 py-3 text-base hover:text-white">Create free account</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(([icon, title, text]) => (
          <div className="card" key={title}>
            <div className="text-3xl">{icon}</div>
            <h3 className="mb-1 mt-2 font-semibold">{title}</h3>
            <p className="text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>
    </>
  );
}