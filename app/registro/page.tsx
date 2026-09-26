import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentAccount } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
export const metadata = { title: 'Crear cuenta', robots: { index: false, follow: false } };
export default async function RegisterPage() {
  let account = null;
  try { account = await currentAccount(); } catch { /* Permitir reintentar desde el formulario. */ }
  if (account) redirect(account.role === 'admin' ? '/admin/productos' : '/cuenta');
  return <div className="container-page"><div className="card mx-auto max-w-md p-6 sm:p-8"><p className="eyebrow">Bienvenido a Arias</p><h1 className="mt-3 font-serif text-4xl">Crea tu cuenta</h1><p className="mb-7 mt-3 text-sm leading-6 text-stone-500">Tu cuenta es opcional. También puedes armar tu pedido y enviarlo por WhatsApp sin registrarte.</p><LoginForm registration /><p className="mt-6 text-center text-sm">¿Ya tienes cuenta? <Link href="/login" className="font-semibold underline">Iniciar sesión</Link></p><Link href="/#catalogo" className="mt-5 block text-center text-sm text-stone-500 underline">Volver al catálogo</Link></div></div>;
}
