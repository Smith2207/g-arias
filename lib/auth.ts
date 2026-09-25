import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { SESSION_COOKIE, verifySession } from './session';
export async function currentAdmin() {
  const id = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  return id ? db.admin.findUnique({ where: { id } }) : null;
}
export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}
