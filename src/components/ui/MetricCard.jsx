import { ArrowUpRight } from 'lucide-react';

export default function MetricCard({ title, value, description, icon: Icon = ArrowUpRight }) {
  return (
    <div className="app-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-ink-500">{title}</p>
          <strong className="mt-2 block text-2xl font-semibold tracking-tight text-ink-900">{value}</strong>
        </div>
        <span className="shrink-0 rounded-lg bg-coral-50 p-2.5 text-coral-600">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {description ? <p className="mt-4 text-sm leading-6 text-ink-500">{description}</p> : null}
    </div>
  );
}
