import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const usuario = process.env.ADMIN_USER;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!usuario || !passwordHash || !/^\$2[aby]\$\d{2}\$.{53}$/.test(passwordHash)) throw new Error('Configura ADMIN_USER y ADMIN_PASSWORD_HASH (bcrypt) en .env.');
  // ID fijo: volver a ejecutar actualiza el único administrador.
  await db.admin.upsert({ where: { id: 'owner' }, create: { id: 'owner', usuario, passwordHash }, update: { usuario, passwordHash } });
  console.log('Administrador configurado.');
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
