import { Search } from 'lucide-react';

export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
        <Search size={17} strokeWidth={2.6} />
      </span>
      TruthLens
    </span>
  );
}