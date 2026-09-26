import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { SESSION_COOKIE, verifySession, readSession } from './session';
export async function currentAdmin() {
  const id = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  return id ? db.admin.findUnique({ where: { id } }) : null;
}
export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect('/login');
  return admin;
}

export async function currentAccount() {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  if (session.role === 'admin') {
    const admin = await db.admin.findUnique({ where: { id: session.id }, select: { id: true, usuario: true } });
    return admin ? { ...admin, nombre: admin.usuario, role: 'admin' as const } : null;
  }
  const cliente = await db.cliente.findUnique({ where: { id: session.id }, select: { id: true, usuario: true, nombre: true } });
  return cliente ? { ...cliente, role: 'cliente' as const } : null;
}
