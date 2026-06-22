export default function LoadingScreen({ message = 'Carregando...' }) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-4">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-ink-200/70 bg-white p-8 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-coral-100 border-t-coral-500" />
        <p className="text-sm font-medium text-ink-600">{message}</p>
      </div>
    </div>
  );
}
