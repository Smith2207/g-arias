'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { SESSION_COOKIE, signSession } from '@/lib/session';
import { productSchema, FormState } from '@/lib/validation';

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const usuario = String(form.get('usuario') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!usuario || usuario.length > 100 || !password || Buffer.byteLength(password, 'utf8') > 72) return { error: 'Usuario o contraseña incorrectos.' };
  try {
    const admin = await db.admin.findUnique({ where: { usuario } });
    // Un hash real evita una respuesta inmediata para usuarios inexistentes.
    const dummy = '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';
    const valid = await bcrypt.compare(password, admin?.passwordHash ?? dummy);
    if (!admin || !valid) return { error: 'Usuario o contraseña incorrectos.' };
    (await cookies()).set(SESSION_COOKIE, await signSession(admin.id), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 8 * 60 * 60, path: '/' });
  } catch { return { error: 'No se pudo iniciar sesión. Revisa la configuración o inténtalo más tarde.' }; }
  redirect('/admin/productos');
}
export async function logout() { (await cookies()).delete(SESSION_COOKIE); redirect('/admin/login'); }
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
