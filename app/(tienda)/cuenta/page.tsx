import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, HatGlasses, LogOut, MessageCircle, ShoppingBag } from 'lucide-react';
import { currentAccount } from '@/lib/auth';
import { logout } from '@/app/login/actions';
export const metadata = { title: 'Mi cuenta', robots: { index: false, follow: false } };
export default async function AccountPage() {
  const account = await currentAccount();
  if (!account) redirect('/login');
  if (account.role === 'admin') redirect('/admin');
  return <div className="container-page max-w-3xl">
    <div className="mb-10 flex flex-wrap items-center justify-between gap-6"><div className="flex min-w-0 items-center gap-4"><span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e9e2d5] font-serif text-3xl text-accent">{account.nombre.charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="break-all text-xs text-stone-500">@{account.usuario}</p><h1 className="mt-2 break-words text-3xl font-medium tracking-tight sm:text-4xl">Hola, {account.nombre}<span className="text-accent">.</span></h1></div></div><form action={logout}><button className="inline-flex min-h-11 items-center gap-2 text-xs text-stone-500 hover:text-ink"><LogOut size={16} />Cerrar sesión</button></form></div>
    <div className="grid gap-4 sm:grid-cols-2">{[{href:'/#catalogo',Icon:HatGlasses,title:'Explorar catálogo',text:'Descubre modelos y precios por presentación.'},{href:'/carrito',Icon:ShoppingBag,title:'Ver mi pedido',text:'Revisa tu selección y envíala por WhatsApp.'}].map(({href,Icon,title,text})=><Link key={href} href={href} className="card group p-7 transition hover:border-accent/50 hover:shadow-sm"><div className="mb-4 flex items-center justify-between"><Icon size={26} strokeWidth={1.25} className="text-accent" /><ArrowUpRight size={20} className="transition group-hover:-translate-y-1 group-hover:translate-x-1" /></div><h2 className="text-lg font-medium">{title}</h2><p className="mt-2 text-sm leading-6 text-stone-500">{text}</p></Link>)}</div>
    <p className="mt-7 flex items-start gap-3 text-xs leading-6 text-stone-500"><MessageCircle size={18} className="mt-1 shrink-0 text-accent" />Tu pedido se confirma por WhatsApp.</p>
  </div>;
}
