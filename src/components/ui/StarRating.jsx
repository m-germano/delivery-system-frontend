import { Star } from 'lucide-react';
import { cn } from '../../utils/classNames.js';

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export default function StarRating({ rating = 0, onChange, readOnly = false, size = 'md', showValue = false, count = null }) {
  const numericRating = Number(rating ?? 0);
  const roundedRating = Math.round(numericRating);
  const iconSize = sizeClasses[size] ?? sizeClasses.md;

  return (
    <div className="inline-flex items-center gap-2">
      <div className="inline-flex items-center gap-0.5" role={readOnly ? 'img' : 'radiogroup'} aria-label="Avaliação">
        {[1, 2, 3, 4, 5].map((value) => {
          const active = value <= roundedRating;
          const icon = (
            <Star
              className={cn(
                iconSize,
                active ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-ink-300',
              )}
            />
          );

          if (readOnly || !onChange) {
            return <span key={value}>{icon}</span>;
          }

          return (
            <button
              key={value}
              type="button"
              className="rounded-md p-0.5 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-200"
              aria-label={`Avaliar com ${value} estrela${value > 1 ? 's' : ''}`}
              aria-checked={Number(rating) === value}
              role="radio"
              onClick={() => onChange(value)}
            >
              {icon}
            </button>
          );
        })}
      </div>
      {showValue ? (
        <span className="text-sm font-semibold text-ink-700">
          {numericRating > 0 ? numericRating.toFixed(1).replace('.', ',') : 'Sem avaliações'}
          {count !== null ? ` (${count})` : ''}
        </span>
      ) : null}
    </div>
  );
}
