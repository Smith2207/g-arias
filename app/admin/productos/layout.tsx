import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { logout } from '@/app/login/actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administrar productos', robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) { await requireAdmin(); return <div className="container-page"><div className="mb-8 flex items-center justify-between gap-4 border-b border-stone-200 pb-5"><Link href="/admin/productos" className="font-semibold">Panel de productos</Link><form action={logout}><button className="btn-secondary">Cerrar sesión</button></form></div>{children}</div>; }
