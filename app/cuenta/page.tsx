import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentAccount } from '@/lib/auth';
import { logout } from '@/app/login/actions';
export const metadata = { title: 'Mi cuenta', robots: { index: false, follow: false } };
export default async function AccountPage() {
  const account = await currentAccount();
  if (!account) redirect('/login');
  if (account.role === 'admin') redirect('/admin/productos');
  return <div className="container-page"><div className="card mx-auto max-w-xl p-6 sm:p-9"><p className="eyebrow">Mi cuenta</p><h1 className="mt-3 font-serif text-4xl">Hola, {account.nombre}</h1><p className="mt-3 text-sm text-stone-500">@{account.usuario}</p><p className="my-6 leading-7 text-stone-600">Explora los modelos y precios de Arias, agrega tus favoritos al carrito y envíanos tu selección por WhatsApp.</p><div className="flex flex-wrap gap-3"><Link href="/#catalogo" className="btn">Explorar catálogo</Link><Link href="/carrito" className="btn-secondary">Ver mi pedido</Link></div><p className="mt-5 text-xs leading-6 text-stone-500">Tu carrito se guarda en este navegador. Coordinamos la confirmación de tu pedido por WhatsApp.</p><form action={logout} className="mt-7 border-t border-stone-200 pt-5"><button className="text-sm underline">Cerrar sesión</button></form></div></div>;
}
