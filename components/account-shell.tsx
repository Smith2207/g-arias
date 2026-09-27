import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function AccountShell({ children }: { children: React.ReactNode }) {
  return <div className="container-page max-w-lg py-8 sm:py-12">
    <Link href="/#catalogo" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-stone-600 hover:text-ink"><ArrowLeft size={16} />Volver al catálogo</Link>
    <div className="card px-5 py-7 sm:p-8">{children}</div>
  </div>;
}
