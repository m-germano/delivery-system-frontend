export default function InputField({ label, id, hint, error, ...props }) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label className="app-label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input id={id} className="app-input" {...props} />
      {hint ? <p className="text-xs text-ink-400">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
