'use client';
import { useState } from 'react';
import { ManagementForm } from './management-form';
import { saveMovement } from '@/app/admin/operaciones-actions';
export function MovementForm({ pedidoId = '', allowCollection = false, allowRefund = false, initialKey }: { pedidoId?: string; allowCollection?: boolean; allowRefund?: boolean; initialKey: string }) {
  const [key, setKey] = useState(initialKey);
  return <div>
    <ManagementForm key={key} action={saveMovement} label="Registrar movimiento" lockOnSuccess>
      <input type="hidden" name="clave" value={key} />
      <input type="hidden" name="pedidoId" value={pedidoId} />
      <label className="block text-sm">Tipo<select className="field mt-1" name="tipo">{!pedidoId && <option value="GASTO">Gasto</option>}{allowCollection && <option value="COBRO">Cobro</option>}{allowRefund && <option value="DEVOLUCION">Devolución al cliente</option>}</select></label>
      <label className="block text-sm">Importe (S/)<input className="field mt-1" name="monto" type="number" min="0.01" max="9999999999.99" step="0.01" required /></label>
      <label className="block text-sm">Concepto<input className="field mt-1" name="concepto" minLength={3} maxLength={200} required /></label>
      <label className="block text-sm">Medio<select className="field mt-1" name="medio">{['EFECTIVO', 'TRANSFERENCIA', 'YAPE', 'PLIN', 'OTRO'].map(m => <option key={m}>{m}</option>)}</select></label>
      <label className="block text-sm">Referencia / comprobante<input className="field mt-1" name="referencia" maxLength={100} /></label>
    </ManagementForm>
    <button type="button" onClick={() => setKey(crypto.randomUUID())} className="mt-4 text-sm underline">Nuevo formulario</button>
  </div>;
}
