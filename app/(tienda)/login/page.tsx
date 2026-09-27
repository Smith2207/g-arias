import { AccountShell } from '@/components/account-shell';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { currentAccount } from '@/lib/auth';
export const metadata = { title: 'Iniciar sesión', robots: { index: false, follow: false } };
export default async function LoginPage() {
  let account = null;
  try { account = await currentAccount(); } catch { /* El formulario permite reintentar el acceso. */ }
  if (account) redirect(account.role === 'admin' ? '/admin' : '/cuenta');
  return <AccountShell><h1 className="text-3xl font-medium tracking-tight">Iniciar sesión</h1><p className="mb-7 mt-3 text-sm text-stone-500">Ingresa con tu usuario y contraseña.</p><LoginForm /><p className="mt-6 text-center text-sm text-stone-600">¿No tienes cuenta? <Link href="/registro" className="font-semibold text-ink underline underline-offset-4">Crear cuenta</Link></p></AccountShell>;
}
