import Link from 'next/link';
import { ArrowUpRight, LogOut } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { logout } from '@/app/login/actions';
import { AdminNav } from '@/components/admin-nav';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Administración',
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return (
    <div className="admin-workspace min-h-screen bg-[#f6f7f8] lg:grid lg:grid-cols-[188px_minmax(0,1fr)]">
      <aside className="border-b border-stone-200 bg-[#eeefef] px-2 py-1 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:p-3">
        <Link
          href="/admin"
          aria-label="Arias, inicio del panel"
          className="mb-7 hidden px-3 pt-3 lg:block"
        >
          <span className="text-2xl font-bold tracking-tight">Arias</span>
          <span className="mt-1 block text-[11px] text-stone-400">
            Administración
          </span>
        </Link>
        <AdminNav />
        <p className="mt-auto hidden px-3 pb-2 text-[11px] text-stone-400 lg:block">
          Tu tienda, en un solo lugar.
        </p>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between gap-2 border-b border-stone-200 bg-white px-4 py-1 sm:px-6">
          <div className="min-w-0">
            <p className="max-w-32 truncate text-xs text-stone-500">
              {admin.usuario}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs text-stone-600 hover:bg-stone-50"
            >
              Ver tienda <ArrowUpRight size={15} />
            </Link>
            <form action={logout}>
              <button
                aria-label="Cerrar sesión"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs text-stone-600 hover:bg-stone-50"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </form>
          </div>
        </header>
        <main id="contenido" className="w-full px-4 py-5 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
