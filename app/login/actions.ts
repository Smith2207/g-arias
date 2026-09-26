'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { SESSION_COOKIE, signSession } from '@/lib/session';
import { FormState } from '@/lib/validation';

async function startSession(id: string, role: 'admin' | 'cliente') {
  (await cookies()).set(SESSION_COOKIE, await signSession(id, role), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 8 * 60 * 60, path: '/',
  });
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const usuario = String(form.get('usuario') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  if (!usuario || usuario.length > 100 || !password || Buffer.byteLength(password, 'utf8') > 72) return { error: 'Usuario o contraseña incorrectos.' };
  let destination = '/cuenta';
  try {
    const admin = await db.admin.findFirst({ where: { usuario: { equals: usuario, mode: 'insensitive' } } });
    const account = admin ?? await db.cliente.findUnique({ where: { usuario } });
    const dummy = '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';
    const valid = await bcrypt.compare(password, account?.passwordHash ?? dummy);
    if (!account || !valid) return { error: 'Usuario o contraseña incorrectos. Comprueba tus datos y vuelve a intentarlo.' };
    await startSession(account.id, admin ? 'admin' : 'cliente');
    if (admin) destination = '/admin/productos';
  } catch {
    console.warn('[Login] No se pudo consultar la cuenta o crear la sesión.');
    return { error: 'No pudimos iniciar sesión en este momento. Inténtalo de nuevo en unos minutos.' };
  }
  redirect(destination);
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const usuario = String(form.get('usuario') ?? '').trim().toLowerCase();
  const nombre = String(form.get('nombre') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (nombre.length < 2 || nombre.length > 100) return { error: 'Escribe tu nombre, entre 2 y 100 caracteres.' };
  if (!/^[a-z0-9._-]{3,40}$/.test(usuario)) return { error: 'Usa entre 3 y 40 letras, números, puntos, guiones o guiones bajos para tu usuario.' };
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) return { error: 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.' };
  if (password !== String(form.get('confirmPassword') ?? '')) return { error: 'Las contraseñas no coinciden.' };
  try {
    const admin = await db.admin.findFirst({ where: { usuario: { equals: usuario, mode: 'insensitive' } }, select: { id: true } });
    if (admin) return { error: 'Ese usuario no está disponible. Elige otro.' };
    // El registro público siempre crea un cliente; nunca acepta un rol del formulario.
    const account = await db.cliente.create({ data: { usuario, nombre, passwordHash: await bcrypt.hash(password, 12) } });
    await startSession(account.id, 'cliente');
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') return { error: 'Ese usuario no está disponible. Elige otro.' };
    return { error: 'No pudimos completar el acceso. Si tu cuenta se creó, puedes intentar iniciar sesión.' };
  }
  redirect('/cuenta');
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}
