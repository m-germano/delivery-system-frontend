import { PackageOpen } from 'lucide-react';
import Button from './Button.jsx';

export default function EmptyState({ icon: Icon = PackageOpen, title, description, actionLabel, onAction }) {
  return (
    <div className="app-card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 rounded-xl bg-coral-50 p-3 text-coral-600">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-ink-500">{description}</p>
      {actionLabel ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
