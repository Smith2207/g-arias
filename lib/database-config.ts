export type DatabaseConfigStatus = 'missing' | 'example' | 'invalid' | 'ready';

/** Clasifica la configuración sin registrar ni devolver credenciales. */
export function databaseConfigStatus(value: string | undefined): DatabaseConfigStatus {
  if (!value?.trim()) return 'missing';
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) return 'invalid';
    const username = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    if (
      ['HOST', 'YOUR_HOST'].includes(url.hostname.toUpperCase()) ||
      ['USER', 'YOUR_USER'].includes(username.toUpperCase()) ||
      ['PASSWORD', 'YOUR_PASSWORD'].includes(password.toUpperCase())
    ) return 'example';
    if (!url.hostname || !url.username || !url.pathname || url.pathname === '/') return 'invalid';
    return 'ready';
  } catch {
    return 'invalid';
  }
}
