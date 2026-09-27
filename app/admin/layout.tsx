import Link from 'next/link';
import { ArrowUpRight, LogOut } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { logout } from '@/app/login/actions';
import { AdminNav } from '@/components/admin-nav';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administración', robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <div className="min-h-screen bg-[#f5f5f3] lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
    <aside className="bg-ink px-3 py-3 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-5">
      <Link href="/admin" aria-label="Arias, inicio del panel" className="mb-5 hidden px-3 pt-3 lg:block"><span className="text-3xl font-bold tracking-tight">Arias</span><span className="mt-2 block text-xs text-white/50">Administración</span></Link>
      <AdminNav />
      <p className="mt-auto hidden px-3 pb-2 text-xs text-white/40 lg:block">Tu tienda, en un solo lugar.</p>
    </aside>
    <div className="min-w-0">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 bg-white px-4 py-3 sm:px-7">
        <div className="min-w-0"><p className="text-sm font-semibold">Panel de administración</p><p className="mt-1 max-w-48 truncate text-xs text-stone-500">{admin.usuario}</p></div>
        <div className="flex items-center gap-1 sm:gap-3"><Link href="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs text-stone-600 hover:bg-stone-50">Ver tienda <ArrowUpRight size={15} /></Link><form action={logout}><button aria-label="Cerrar sesión" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs text-stone-600 hover:bg-stone-50"><LogOut size={16} /><span className="hidden sm:inline">Cerrar sesión</span></button></form></div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 lg:py-9">{children}</main>
    </div>
  </div>;
}
