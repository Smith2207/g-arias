'use client';
import { useActionState } from 'react';
import type { Result } from '@/app/admin/gestion-actions';
export function ManagementForm({
  action,
  children,
  label = 'Guardar',
  lockOnSuccess = false,
}: {
  action: (state: Result, form: FormData) => Promise<Result>;
  children: React.ReactNode;
  label?: string;
  lockOnSuccess?: boolean;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className="space-y-4">
      <fieldset disabled={pending || (lockOnSuccess && Boolean(state.success))} className="min-w-0 space-y-4">
        {children}
        <button className="btn" disabled={pending || (lockOnSuccess && Boolean(state.success))}>
          {pending ? 'Guardando…' : label}
        </button>
      </fieldset>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-emerald-700">
          {state.success}
        </p>
      )}
    </form>
  );
}
