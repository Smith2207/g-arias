'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { OrderError } from '@/lib/orders';
import { recordMovement, updateDispatch } from '@/lib/operations';
import type { Result } from './gestion-actions';
export async function saveMovement(_: Result, form: FormData): Promise<Result> {
  const admin = await requireAdmin();
  try {
    await recordMovement(db, Object.fromEntries(form), admin.usuario);
    revalidatePath('/', 'layout');
    return { success: 'Movimiento registrado. Para otro movimiento, abre un nuevo formulario.' };
  } catch (error) {
    return { error: error instanceof OrderError ? error.message : 'No se pudo registrar el movimiento. Reintenta con el mismo formulario.' };
  }
}
export async function saveDispatch(_: Result, form: FormData): Promise<Result> {
  await requireAdmin();
  try {
    await updateDispatch(db, Object.fromEntries(form));
    revalidatePath('/', 'layout');
    return { success: 'Despacho actualizado.' };
  } catch (error) {
    return { error: error instanceof OrderError ? error.message : 'No se pudo actualizar el despacho.' };
  }
}
