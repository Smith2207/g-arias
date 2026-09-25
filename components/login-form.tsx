'use client';
import { useActionState } from 'react';
import { login } from '@/app/admin/actions';
export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return <form action={action} className="space-y-5"><label className="block text-sm font-semibold">Usuario<input name="usuario" required maxLength={100} autoComplete="username" className="field mt-2"/></label><label className="block text-sm font-semibold">Contraseña<input name="password" required maxLength={72} type="password" autoComplete="current-password" className="field mt-2"/></label>{state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}<button disabled={pending} className="btn w-full">{pending ? 'Ingresando…' : 'Iniciar sesión'}</button></form>;
}
