'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="container-page text-center"><h1 className="text-2xl">No pudimos cargar esta página</h1><p className="my-5">Inténtalo nuevamente en unos momentos.</p><button onClick={reset} className="btn">Reintentar</button></div>; }
