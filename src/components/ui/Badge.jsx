import { cn } from '../../utils/classNames.js';

const variantClasses = {
  neutral: 'bg-ink-100 text-ink-700',
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-coral-50 text-coral-700',
  danger: 'bg-red-50 text-red-700',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-1 text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  );
}
