export default function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">

        <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink-900">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
