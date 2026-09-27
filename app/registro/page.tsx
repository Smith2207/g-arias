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
  return <AccountShell><h1 className="text-3xl font-medium tracking-tight">Crear cuenta</h1><p className="mb-7 mt-3 text-sm leading-6 text-stone-500">El registro es opcional para comprar.</p><LoginForm registration /><p className="mt-6 text-center text-sm text-stone-600">¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-ink underline underline-offset-4">Iniciar sesión</Link></p></AccountShell>;
}
