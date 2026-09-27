'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { changeProduct } from '@/app/admin/actions';
export function ProductControls({ id, active }: { id: string; active: boolean }) {
  const [state, action, pending] = useActionState(changeProduct, {});
  return <div><form action={action} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={id}/><Link href={`/admin/productos/${id}/editar`} className="btn-secondary min-h-11 px-4 py-2 text-xs">Editar</Link><button disabled={pending} className="btn-secondary min-h-11 px-4 py-2 text-xs" name="action" value={active ? 'deactivate' : 'activate'}>{active ? 'Desactivar' : 'Activar'}</button><button disabled={pending} onClick={e => { if (!confirm('¿Eliminar este producto de forma permanente?')) e.preventDefault(); }} className="inline-flex min-h-11 items-center px-3 text-xs text-red-700 transition hover:underline" name="action" value="delete">Eliminar</button></form>{state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}</div>;
}
