export default function Logo({ size = 28, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight text-slate-900 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#0f766e" />
        <circle cx="15" cy="15" r="7" fill="none" stroke="#fff" strokeWidth="2.4" />
        <path d="M11.8 15.2l2.4 2.4 4.2-4.6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.4 20.4L25 25" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      TruthLens
    </span>
  );
}