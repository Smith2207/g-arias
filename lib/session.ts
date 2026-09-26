import { SignJWT, jwtVerify } from 'jose';
export const SESSION_COOKIE = 'arias_session';
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET requiere al menos 32 caracteres.');
  return new TextEncoder().encode(value);
}
export async function signSession(id: string, role: 'admin' | 'cliente' = 'admin') {
  return new SignJWT({ role }).setProtectedHeader({ alg: 'HS256' }).setSubject(id).setIssuer('arias').setAudience('arias-admin').setIssuedAt().setExpirationTime('8h').sign(secret());
}
export async function readSession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'], issuer: 'arias', audience: 'arias-admin' });
    return (payload.role === 'admin' || payload.role === 'cliente') && payload.sub
      ? { id: payload.sub, role: payload.role } : null;
  } catch { return null; }
}

export async function verifySession(token?: string) {
  const session = await readSession(token);
  return session?.role === 'admin' ? session.id : null;
}
