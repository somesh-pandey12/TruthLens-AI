export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} TruthLens</span>
        <span>Automated assessments can be wrong. Always verify with primary sources.</span>
      </div>
    </footer>
  );
}