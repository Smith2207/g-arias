import Link from 'next/link';
import { ArrowUpRight, LayoutGrid, LogOut } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { logout } from '@/app/login/actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administrar productos', robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <div className="container-page py-8 md:py-10">
    <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
      <Link href="/admin/productos" className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white"><LayoutGrid size={19} /></span><span><span className="block text-sm font-semibold">Panel de productos</span><span className="mt-1 block text-xs text-stone-500">Hola, {admin.usuario}</span></span></Link>
      <div className="flex items-center gap-3"><Link href="/#catalogo" className="inline-flex min-h-11 items-center gap-2 px-2 text-xs font-medium">Ver tienda <ArrowUpRight size={15} /></Link><form action={logout}><button className="btn-secondary min-h-11 px-4 text-xs"><LogOut size={15} />Cerrar sesión</button></form></div>
    </div>{children}
  </div>;
}
