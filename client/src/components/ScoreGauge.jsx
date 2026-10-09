export default function ScoreGauge({ score = 0, color = '#6366f1' }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`Reliability score ${score} out of 100`}>
      <circle cx="70" cy="70" r={r} fill="none" strokeWidth="12" className="stroke-line" />
      <circle
        cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 70 70)"
        className="transition-all duration-700"
      />
      <text x="70" y="78" textAnchor="middle" fontSize="30" fontWeight="700" className="fill-white">{Math.round(score)}</text>
    </svg>
  );
}