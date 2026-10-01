import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { SESSION_COOKIE, signSession } from '../../lib/session';
let adminId: string;
test.beforeAll(async () => {
  if (!process.env.DATABASE_URL || !process.env.ADMIN_USER)
    throw new Error(
      'Ejecuta test:admin con .env y un administrador existente. Estas pruebas solo leen la base.',
    );
  const db = new PrismaClient();
  try {
    const admin = await db.admin.findUnique({
      where: { usuario: process.env.ADMIN_USER },
      select: { id: true },
    });
    if (!admin) throw new Error('No se encontró el administrador de prueba.');
    adminId = admin.id;
  } finally {
    await db.$disconnect();
  }
});
test('Panel independiente, navegación y formulario adaptables', async ({
  page,
  context,
}, testInfo) => {
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: await signSession(adminId),
      url: 'http://127.0.0.1:3202',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  await page.goto('/login');
  await expect(page).toHaveURL(/\/admin$/);
  for (const [path, heading] of [
    ['/admin', 'Inicio'],
    ['/admin/productos', 'Productos'],
    ['/admin/productos/nuevo', 'Nuevo producto'],
    ['/admin/inventario', 'Inventario'],
    ['/admin/pedidos', 'Pedidos'],
    ['/admin/configuracion', 'Configuración'],
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Administración', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Navegación principal' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('navigation', { name: 'Enlaces de ayuda' }),
    ).toHaveCount(0);
    await expect(page.locator('a[href="/carrito"]')).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      path,
    ).toBe(true);
    if (path === '/admin/productos/nuevo') {
      await expect(
        page.getByRole('button', { name: 'Guardar producto' }),
      ).toBeInViewport();
      if ((page.viewportSize()?.width ?? 0) >= 1280) {
        await expect(
          page.getByRole('heading', { name: 'Fotografías' }),
        ).toBeInViewport();
        await expect(page.getByLabel('Unidades por caja')).toBeInViewport();
      }
      await page
        .locator('summary')
        .filter({ hasText: 'Colores y tallas' })
        .click();
      await page
        .getByRole('button', { name: 'Agregar variante', exact: true })
        .click();
      await expect(page.getByLabel('Color 1', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Quitar variante 1' }).click();
      await page
        .locator('summary')
        .filter({ hasText: 'Colores y tallas' })
        .click();
    }
    await page.screenshot({
      path: testInfo.outputPath(`${heading}.png`),
      fullPage: true,
    });
  }
  await page
    .getByRole('navigation', { name: 'Administración', exact: true })
    .getByRole('link', { name: 'Inicio', exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
  await page
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login$/);
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: await signSession('test-client', 'cliente'),
      url: 'http://127.0.0.1:3202',
    },
  ]);
  await page.goto('/admin/productos');
  await expect(page).toHaveURL(/\/login$/);
});
