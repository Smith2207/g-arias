import { test } from 'node:test';
import assert from 'node:assert/strict';
import { databaseConfigStatus } from '../lib/database-config';

test('Detecta conexión ausente, ejemplo e inválida antes de consultar Prisma', () => {
  assert.equal(databaseConfigStatus(undefined), 'missing');
  assert.equal(databaseConfigStatus('  '), 'missing');
  assert.equal(databaseConfigStatus('postgresql://USER:PASSWORD@HOST/neondb?sslmode=require'), 'example');
  assert.equal(databaseConfigStatus('https://user:secret@example.com/db'), 'invalid');
  assert.equal(databaseConfigStatus('postgresql://owner:secret@localhost/'), 'invalid');
  assert.equal(databaseConfigStatus('postgresql://owner:%ZZ@localhost/db'), 'invalid');
  assert.equal(databaseConfigStatus('postgresql://owner:encoded%40secret@ep-example.neon.tech/neondb?sslmode=require'), 'ready');
  assert.equal(databaseConfigStatus('postgresql://postgres@localhost/catalog'), 'ready');
});
