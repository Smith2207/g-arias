import { AccountShell } from '@/components/account-shell';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { currentAccount } from '@/lib/auth';
export const metadata = { title: 'Iniciar sesión', robots: { index: false, follow: false } };
export default async function LoginPage() {
  let account = null;
  try { account = await currentAccount(); } catch { /* El formulario permite reintentar el acceso. */ }
  if (account) redirect(account.role === 'admin' ? '/admin/productos' : '/cuenta');
  return <AccountShell><p className="eyebrow text-accent">Tu espacio en Arias</p><h1 className="mt-4 text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Qué bueno<br />tenerte de vuelta.</h1><p className="mb-8 mt-4 text-sm leading-6 text-stone-500">Ingresa a tu cuenta y continúa donde lo dejaste.</p><LoginForm /><p className="mt-7 text-center text-sm text-stone-600">¿Aún no tienes cuenta? <Link href="/registro" className="font-semibold text-ink underline underline-offset-4">Crear cuenta</Link></p><div className="mt-7 border-t border-stone-200 pt-6 text-center"><Link href="/#catalogo" className="inline-flex min-h-11 items-center text-xs text-stone-500 hover:text-ink">Seguir comprando sin registrarme →</Link></div></AccountShell>;
}
