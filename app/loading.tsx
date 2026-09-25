export default function Loading() {
  return (
    <div className="container-page" role="status" aria-label="Cargando colección">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5 py-10"><div className="h-3 w-40 rounded bg-stone-200" /><div className="h-20 w-4/5 rounded bg-stone-200" /><div className="h-20 w-3/5 rounded bg-stone-200" /><div className="h-12 w-48 rounded-full bg-stone-200" /></div>
        <div className="min-h-96 rounded-lg bg-stone-200 motion-safe:animate-pulse" />
      </div>
      <span className="sr-only">Cargando colección…</span>
    </div>
  );
}
