import bcrypt from 'bcryptjs';
// Recibe la contraseña por stdin; nunca se incluye como argumento del proceso.
const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const password = Buffer.concat(chunks).toString().replace(/\r?\n$/, '');
if (Buffer.byteLength(password) < 12 || Buffer.byteLength(password) > 72) {
  console.error('Usa una contraseña de entre 12 y 72 bytes.'); process.exit(1);
}
console.log(await bcrypt.hash(password, 12));
