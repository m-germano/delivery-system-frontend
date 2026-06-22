import { X } from 'lucide-react';
import { useEffect } from 'react';
import Button from './Button.jsx';

export default function Modal({ open, title, description, children, onClose, footer }) {
  useEffect(() => {
    if (!open) return;
    function handleEscape(event) {
      if (event.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Fechar modal"
        tabIndex={-1}
      />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4 md:px-6">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
            {description ? <p className="mt-1 text-sm leading-6 text-ink-500">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" className="shrink-0 px-2" onClick={onClose} aria-label="Fechar modal">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-5 md:px-6">{children}</div>

        {footer ? <div className="flex flex-wrap justify-end gap-3 border-t border-ink-100 px-5 py-4 md:px-6">{footer}</div> : null}
      </div>
    </div>
  );
}
