'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { productSchema, FormState } from '@/lib/validation';

export async function saveProduct(id: string | null, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  let images: unknown;
  try { images = JSON.parse(String(form.get('imagenes') ?? '[]')); } catch { return { error: 'Lista de imágenes inválida.' }; }
  const parsed = productSchema.safeParse({ ...Object.fromEntries(form), activo: form.get('activo') === 'on', imagenes: images });
  if (!parsed.success) return { error: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' · ') };
  const { imagenes, ...data } = parsed.data;
  try {
    const nestedImages = imagenes.map((url, orden) => ({ url, orden }));
    if (id) await db.producto.update({ where: { id }, data: { ...data, imagenes: { deleteMany: {}, create: nestedImages } } });
    else await db.producto.create({ data: { ...data, imagenes: { create: nestedImages } } });
  } catch { return { error: 'No se pudo guardar el producto. Inténtalo nuevamente.' }; }
  revalidatePath('/'); revalidatePath('/admin/productos');
  if (id) revalidatePath(`/producto/${id}`);
  redirect('/admin/productos');
}
export async function changeProduct(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(form.get('id') ?? '');
  const action = String(form.get('action') ?? '');
  try {
    if (action === 'delete') await db.producto.delete({ where: { id } });
    else if (action === 'activate' || action === 'deactivate') await db.producto.update({ where: { id }, data: { activo: action === 'activate' } });
    else return { error: 'Operación inválida.' };
  } catch { return { error: 'No se pudo actualizar el producto.' }; }
  revalidatePath('/'); revalidatePath('/admin/productos'); revalidatePath(`/producto/${id}`);
  return {};
}
