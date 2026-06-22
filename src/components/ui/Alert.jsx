import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../utils/classNames.js';

const variants = {
  info: {
    icon: Info,
    className: 'border-blue-100 bg-blue-50 text-blue-800',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-coral-100 bg-coral-50 text-coral-800',
  },
  error: {
    icon: AlertTriangle,
    className: 'border-red-100 bg-red-50 text-red-800',
  },
};

export default function Alert({ variant = 'info', title, children }) {
  const selected = variants[variant] ?? variants.info;
  const Icon = selected.icon;

  return (
    <div className={cn('flex gap-3 rounded-xl border p-4 text-sm', selected.className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="mt-1 leading-6 opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}
