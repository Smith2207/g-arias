import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { currentAccount } from '@/lib/auth';
export const metadata = { title: 'Iniciar sesión', robots: { index: false, follow: false } };
export default async function LoginPage() {
  let account = null;
  try { account = await currentAccount(); } catch { /* El formulario permite reintentar el acceso. */ }
  if (account) redirect(account.role === 'admin' ? '/admin/productos' : '/cuenta');
  return <div className="container-page"><div className="card mx-auto max-w-md p-6 sm:p-8"><p className="eyebrow">Tu espacio en Arias</p><h1 className="mt-3 font-serif text-4xl">Bienvenido de nuevo</h1><p className="mb-7 mt-3 text-sm leading-6 text-stone-500">Ingresa con tu cuenta para continuar.</p><LoginForm /><p className="mt-6 text-center text-sm text-stone-600">¿Aún no tienes cuenta? <Link href="/registro" className="font-semibold text-ink underline">Crear cuenta</Link></p><div className="mt-6 border-t border-stone-200 pt-5 text-center"><Link href="/#catalogo" className="text-sm underline">Seguir comprando sin registrarme</Link></div></div></div>;
}
