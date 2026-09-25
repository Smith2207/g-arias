import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import { signSession, verifySession } from '../lib/session';
test('La sesión acepta firma válida y rechaza manipulación, expiración y rol ajeno', async () => {
  process.env.SESSION_SECRET = 'test-only-secret-with-at-least-32-characters';
  const token = await signSession('owner');
  assert.equal(await verifySession(token),'owner');
  assert.equal(await verifySession(token.slice(0,-8)+'tampered'),null);
  assert.equal(await verifySession(),null);
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
  const expired = await new SignJWT({ role:'admin' }).setProtectedHeader({ alg:'HS256' }).setIssuer('arias').setAudience('arias-admin').setSubject('owner').setExpirationTime(1).sign(secret);
  assert.equal(await verifySession(expired),null);
  const wrongRole = await new SignJWT({ role:'viewer' }).setProtectedHeader({ alg:'HS256' }).setIssuer('arias').setAudience('arias-admin').setSubject('owner').setExpirationTime('1h').sign(secret);
  assert.equal(await verifySession(wrongRole),null);
});
