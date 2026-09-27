'use server';
import { z } from 'zod';
import { EstadoPedido } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { OrderError, updateOrderStatus } from '@/lib/orders';
export type Result = { error?: string; success?: string };
function refresh() {
  revalidatePath('/', 'layout');
}
export async function saveStock(_: Result, form: FormData): Promise<Result> {
  await requireAdmin();
  const number = z.coerce.number().int().min(0).max(10000000);
  const nullable = z.preprocess(
    (v) => (v === '' ? null : v),
    number.nullable(),
  );
  const parsed = z
    .object({
      id: z.string().min(1),
      kind: z.enum(['producto', 'variante']),
      stock: nullable,
      stockMinimo: number,
      previous: nullable,
      previousMin: number,
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: 'Introduce cantidades enteras positivas o deja el stock vacío.',
    };
  const { id, kind, stock, stockMinimo, previous, previousMin } = parsed.data;
  try {
    const where = { id, stock: previous, stockMinimo: previousMin };
    const data = { stock, stockMinimo };
    const result =
      kind === 'producto'
        ? await db.producto.updateMany({ where, data })
        : await db.variante.updateMany({ where, data });
    if (!result.count)
      return {
        error: 'El inventario cambió. Recarga la página antes de ajustar.',
      };
    refresh();
    return { success: 'Inventario actualizado.' };
  } catch {
    return { error: 'No se pudo guardar el inventario.' };
  }
}
export async function changeOrder(_: Result, form: FormData): Promise<Result> {
  await requireAdmin();
  const status = z.nativeEnum(EstadoPedido).safeParse(form.get('estado'));
  if (!status.success) return { error: 'Estado inválido.' };
  try {
    await updateOrderStatus(db, String(form.get('id')), status.data);
    refresh();
    return { success: 'Pedido actualizado.' };
  } catch (e) {
    return {
      error:
        e instanceof OrderError
          ? e.message
          : 'No se pudo actualizar el pedido. Inténtalo nuevamente.',
    };
  }
}
export async function saveSettings(_: Result, form: FormData): Promise<Result> {
  await requireAdmin();
  const parsed = z
    .object({
      nombre: z.string().trim().min(2).max(60),
      whatsapp: z
        .string()
        .trim()
        .regex(/^[1-9]\d{7,14}$/),
      contacto: z.string().trim().max(200),
      condicionesEnvio: z.string().trim().min(1).max(1000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error:
        'Revisa los campos. WhatsApp debe incluir el código de país, solo dígitos.',
    };
  try {
    await db.configuracion.upsert({
      where: { id: 'tienda' },
      create: { id: 'tienda', ...parsed.data },
      update: parsed.data,
    });
    refresh();
    return { success: 'Configuración guardada.' };
  } catch {
    return { error: 'No se pudo guardar la configuración.' };
  }
}
