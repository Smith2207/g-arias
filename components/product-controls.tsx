'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { changeProduct } from '@/app/admin/actions';
export function ProductControls({ id, active }: { id: string; active: boolean }) {
  const [state, action, pending] = useActionState(changeProduct, {});
  return <div><form action={action} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={id}/><Link href={`/admin/productos/${id}/editar`} className="btn-secondary">Editar</Link><button disabled={pending} className="btn-secondary" name="action" value={active ? 'deactivate' : 'activate'}>{active ? 'Desactivar' : 'Activar'}</button><button disabled={pending} onClick={e => { if (!confirm('¿Eliminar este producto de forma permanente?')) e.preventDefault(); }} className="btn-secondary text-red-700" name="action" value="delete">Eliminar</button></form>{state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}</div>;
}
