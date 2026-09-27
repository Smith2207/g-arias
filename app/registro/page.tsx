import { AccountShell } from '@/components/account-shell';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentAccount } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
export const metadata = { title: 'Crear cuenta', robots: { index: false, follow: false } };
export default async function RegisterPage() {
  let account = null;
  try { account = await currentAccount(); } catch { /* Permitir reintentar desde el formulario. */ }
  if (account) redirect(account.role === 'admin' ? '/admin/productos' : '/cuenta');
  return <AccountShell><p className="eyebrow text-accent">Un nuevo comienzo</p><h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">Tu estilo.<br />Tu espacio.</h1><p className="mb-7 mt-4 text-sm leading-6 text-stone-500">Crea tu cuenta en Arias. También puedes explorar y hacer tu pedido sin registrarte.</p><LoginForm registration /><p className="mt-7 text-center text-sm text-stone-600">¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-ink underline underline-offset-4">Iniciar sesión</Link></p></AccountShell>;
}
