import { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { OrderError, serializable } from './orders';

export const movementSchema = z.object({
  clave: z.string().uuid(),
  pedidoId: z.string().max(100).default(''),
  tipo: z.enum(['COBRO', 'GASTO', 'DEVOLUCION']),
  monto: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'Usa un importe positivo con hasta dos decimales.').refine(v => new Prisma.Decimal(v).gt(0), 'El importe debe ser mayor a cero.'),
  concepto: z.string().trim().min(3).max(200),
  medio: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'YAPE', 'PLIN', 'OTRO']),
  referencia: z.string().trim().max(100).default(''),
});
export const dispatchSchema = z.object({
  id: z.string().min(1).max(100),
  previous: z.enum(['PREPARACION', 'EN_CAMINO']),
  despacho: z.enum(['PREPARACION', 'EN_CAMINO']),
  direccion: z.string().trim().max(300),
  transportista: z.string().trim().max(100),
  seguimiento: z.string().trim().max(100),
});
export const dispatchLabels = { PREPARACION: 'En preparación', EN_CAMINO: 'En camino', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado' };
export const movementLabels = { COBRO: 'Cobro', GASTO: 'Gasto', DEVOLUCION: 'Devolución' };

export function netCollected(rows: { tipo: string; monto: Prisma.Decimal }[]) {
  return rows.reduce((sum, r) => r.tipo === 'COBRO' ? sum.plus(r.monto) : r.tipo === 'DEVOLUCION' ? sum.minus(r.monto) : sum, new Prisma.Decimal(0));
}

export async function recordMovement(db: PrismaClient, input: unknown, actor: string): Promise<Prisma.MovimientoCajaGetPayload<object>> {
  const parsed = movementSchema.safeParse(input);
  if (!parsed.success) throw new OrderError(parsed.error.issues[0]?.message ?? 'Revisa los datos.');
  const data = parsed.data;
  if ((data.tipo === 'GASTO') === Boolean(data.pedidoId)) throw new OrderError('Los cobros y devoluciones requieren un pedido; los gastos se registran sin pedido.');
  try { return await serializable(db, async tx => {
    // La clave identifica un único envío de formulario, incluso al reintentarlo.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${data.clave}))`;
    const previous = await tx.movimientoCaja.findUnique({ where: { clave: data.clave } });
    if (previous) {
      if (previous.tipo !== data.tipo || previous.pedidoId !== (data.pedidoId || null) || !previous.monto.eq(data.monto) || previous.concepto !== data.concepto || previous.medio !== data.medio || previous.referencia !== data.referencia)
        throw new OrderError('Este formulario ya fue registrado con otros datos. Recarga la página.');
      return previous;
    }
    if (data.pedidoId) {
      const order = await tx.pedido.findUnique({ where: { id: data.pedidoId }, include: { movimientos: true } });
      if (!order) throw new OrderError('Pedido no encontrado.');
      const collected = netCollected(order.movimientos);
      const amount = new Prisma.Decimal(data.monto);
      if (data.tipo === 'COBRO') {
        if (!['CONFIRMADO', 'ENTREGADO'].includes(order.estado)) throw new OrderError('Confirma el pedido antes de registrar un cobro.');
        if (collected.plus(amount).gt(order.total)) throw new OrderError('El cobro supera el saldo pendiente del pedido.');
      } else if (amount.gt(collected)) throw new OrderError('La devolución supera lo cobrado.');
    }
    return tx.movimientoCaja.create({ data: { ...data, pedidoId: data.pedidoId || null, registradoPor: actor } });
  }); } catch (error) {
    // Una solicitud simultánea pudo confirmar la misma clave después de la instantánea.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return recordMovement(db, input, actor);
    }
    throw error;
  }
}

export async function updateDispatch(db: PrismaClient, input: unknown) {
  const parsed = dispatchSchema.safeParse(input);
  if (!parsed.success) throw new OrderError('Revisa los datos del despacho.');
  const { id, previous, ...data } = parsed.data;
  if (data.despacho === 'EN_CAMINO' && (!data.direccion || !data.transportista))
    throw new OrderError('Completa dirección y transportista antes de despachar.');
  return serializable(db, async tx => {
    const order = await tx.pedido.findUnique({ where: { id } });
    if (!order || order.estado !== 'CONFIRMADO') throw new OrderError('Solo se despachan pedidos confirmados.');
    if (order.despacho !== previous) throw new OrderError('El despacho cambió. Recarga la página.');
    const updated = await tx.pedido.updateMany({
      where: { id, estado: 'CONFIRMADO', despacho: previous, updatedAt: order.updatedAt },
      data: { ...data, enviadoAt: data.despacho === 'EN_CAMINO' ? (order.enviadoAt ?? new Date()) : null },
    });
    if (!updated.count) throw new OrderError('El pedido cambió. Recarga la página.');
    return updated;
  });
}
