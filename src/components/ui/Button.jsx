import { cn } from '../../utils/classNames.js';

const variants = {
  primary: 'app-button-primary',
  secondary: 'app-button-secondary',
  ghost: 'app-button-ghost',
  danger: 'inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
};

export default function Button({ variant = 'primary', className = '', type = 'button', ...props }) {
  return <button type={type} className={cn(variants[variant], className)} {...props} />;
}
