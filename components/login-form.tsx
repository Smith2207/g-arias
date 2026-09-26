'use client';
import { useActionState, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { login, register } from '@/app/login/actions';

export function LoginForm({ registration = false }: { registration?: boolean }) {
  const [state, action, pending] = useActionState(registration ? register : login, {});
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={action} className="space-y-5" aria-busy={pending}>
      {registration && <label className="block text-sm font-semibold">Nombre<input name="nombre" required minLength={2} maxLength={100} autoComplete="name" className="field mt-2" /></label>}
      <label className="block text-sm font-semibold">Usuario<input name="usuario" required minLength={registration ? 3 : undefined} maxLength={registration ? 40 : 100} pattern={registration ? '[a-zA-Z0-9._\\-]{3,40}' : undefined} autoComplete="username" autoCapitalize="none" spellCheck={false} className="field mt-2" placeholder="Tu nombre de usuario" /></label>
      {registration && <p className="text-xs text-stone-500">Letras, números, puntos y guiones. Sin espacios.</p>}
      <div>
        <label htmlFor="password" className="block text-sm font-semibold">Contraseña</label>
        <div className="relative mt-2">
          <input id="password" name="password" required minLength={registration ? 8 : undefined} maxLength={72} type={showPassword ? 'text' : 'password'} autoComplete={registration ? 'new-password' : 'current-password'} className="field pr-14" aria-describedby={state.error ? 'login-error' : undefined} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-stone-500">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
        </div>
      </div>
      {registration && <label className="block text-sm font-semibold">Repetir contraseña<input name="confirmPassword" required minLength={8} maxLength={72} type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="field mt-2" /></label>}
      {state.error && <p id="login-error" role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn w-full">{pending ? 'Un momento…' : registration ? 'Crear cuenta' : 'Iniciar sesión'}</button>
    </form>
  );
}
