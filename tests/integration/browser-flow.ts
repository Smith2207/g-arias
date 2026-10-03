import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import type { PrismaClient } from '@prisma/client';
import { signSession, SESSION_COOKIE } from '../../lib/session';
export async function browserFlow(db: PrismaClient, databaseUrl: string) {
  const admin = await db.admin.create({
    data: { usuario: 'qa-isolated', passwordHash: 'unused' },
  });
  const origin = 'http://127.0.0.1:3204';
  const server = spawn(
    process.execPath,
    [
      'node_modules/next/dist/bin/next',
      'start',
      '--hostname',
      '127.0.0.1',
      '--port',
      '3204',
    ],
    {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        WHATSAPP_NUMBER: '51999999999',
      },
      stdio: 'ignore',
    },
  );
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    let ready = false;
    for (let i = 0; i < 120; i++) {
      try {
        if ((await fetch(`${origin}/login`)).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(ready, 'Servidor de prueba disponible');
    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addCookies([
      {
        name: SESSION_COOKIE,
        value: await signSession(admin.id),
        url: origin,
        httpOnly: true,
      },
    ]);
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    await page.goto(`${origin}/admin/productos/nuevo`);
    await page.getByLabel('Nombre', { exact: true }).fill('QA Browser');
    await page.getByLabel('Categoría', { exact: true }).fill('QA');
    await page
      .getByLabel('Descripción', { exact: true })
      .fill('Producto aislado de prueba');
    for (const [name, value] of [
      ['precioMediaDocena', '30'],
      ['precioDocena', '60'],
      ['precioCaja', '720'],
    ])
      await page.locator(`[name="${name}"]`).fill(value);
    await page
      .locator('summary')
      .filter({ hasText: 'Colores y tallas' })
      .click();
    await page
      .getByRole('button', { name: 'Agregar variante', exact: true })
      .click();
    await page.getByLabel('Color 1', { exact: true }).fill('Negro');
    await page.getByLabel('Talla 1', { exact: true }).fill('L');
    await page
      .getByRole('button', { name: 'Guardar producto', exact: true })
      .click();
    await expect(page).toHaveURL(/\/admin\/productos$/, { timeout: 25000 });
    const product = await db.producto.findFirstOrThrow({
      where: { nombre: 'QA Browser' },
      include: { variantes: true },
    });
    assert.equal(product.variantes.length, 1);
    await page.goto(`${origin}/admin/inventario?q=QA+Browser`);
    await page.getByLabel('Unidades', { exact: true }).fill('24');
    await page.getByLabel('Avisar desde', { exact: true }).fill('6');
    await page.getByRole('button', { name: 'Actualizar stock' }).click();
    await expect(page.getByText('24 unidades disponibles')).toBeVisible();
    await page.goto(`${origin}/producto/${product.id}`);
    await page.getByRole('button', { name: /Agregar al carrito/ }).click();
    await expect(page.getByText('Agregado a tu pedido')).toBeVisible();
    await page.goto(`${origin}/carrito`);
    await page.getByLabel('Tu nombre').fill('Cliente Browser QA');
    await page.getByLabel('Tu WhatsApp').fill('51900000001');
    await page
      .getByRole('button', { name: 'Guardar pedido y continuar' })
      .click();
    const whatsapp = page.getByRole('link', { name: 'Abrir WhatsApp' });
    await expect(whatsapp).toBeVisible();
    await expect(whatsapp).toHaveAttribute(
      'href',
      /^https:\/\/wa.me\/51999999999\?text=/,
    );
    const order = await db.pedido.findFirstOrThrow({
      where: { nombre: 'Cliente Browser QA' },
    });
    assert.equal(Number(order.total), 30);
    await mkdir('.vercel/qa', { recursive: true });
    await page.screenshot({
      path: '.vercel/qa/checkout-mobile.png',
      fullPage: true,
    });
    await page.goto(`${origin}/admin/pedidos/${order.id}`);
    await page
      .getByRole('button', { name: 'Confirmar y descontar stock' })
      .click();
    await expect(
      page.getByRole('button', { name: 'Marcar como entregado' }),
    ).toBeVisible();
    assert.equal(
      (
        await db.variante.findUniqueOrThrow({
          where: { id: product.variantes[0].id },
        })
      ).stock,
      18,
    );
    await page.getByLabel('Importe (S/)').fill('10');
    await page.getByLabel('Concepto', { exact: true }).fill('Adelanto de pedido');
    await page.getByRole('button', { name: 'Registrar movimiento' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Movimiento registrado' })).toBeVisible();
    assert.equal(await db.movimientoCaja.count({ where: { pedidoId: order.id, tipo: 'COBRO' } }), 1);
    await page.getByLabel('Dirección de entrega').fill('Av. Prueba 100');
    await page.getByLabel('Transportista o responsable').fill('Transporte QA');
    await page.getByLabel('Número de guía / seguimiento').fill('QA-001');
    await page.getByLabel('Estado del despacho').selectOption('EN_CAMINO');
    await page.getByRole('button', { name: 'Guardar despacho' }).click();
    await expect(page.getByText('Despacho actualizado.')).toBeVisible();
    await page.goto(`${origin}/admin/logistica?estado=EN_CAMINO`);
    await expect(page.getByRole('link', { name: order.codigo, exact: true })).toBeVisible();
    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['contabilidad', 'logistica']) {
        await page.goto(`${origin}/admin/${route}`);
        await expect(page.getByRole('heading', { name: route === 'contabilidad' ? 'Contabilidad' : 'Logística', exact: true })).toBeVisible();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: `.vercel/qa/${route}-${width}.png`, fullPage: true });
      }
    }
    await page.goto(`${origin}/admin/pedidos/${order.id}`);
    await page.getByLabel('Estado del despacho').selectOption('PREPARACION');
    await page.getByRole('button', { name: 'Guardar despacho' }).click();
    await expect(page.getByText('Despacho actualizado.')).toBeVisible();
    await page.setViewportSize({ width: 320, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: '.vercel/qa/order-mobile.png',
      fullPage: true,
    });
    await page.getByRole('checkbox').check();
    await page
      .getByRole('button', { name: 'Cancelar pedido', exact: true })
      .click();
    await expect(page.getByText(/^Cancelado ·/)).toBeVisible({
      timeout: 20000,
    });
    assert.equal(
      (
        await db.variante.findUniqueOrThrow({
          where: { id: product.variantes[0].id },
        })
      ).stock,
      24,
    );
    await page.getByLabel('Importe (S/)').fill('10');
    await page.getByRole('combobox', { name: /^Tipo/ }).selectOption('DEVOLUCION');
    await page.getByLabel('Concepto', { exact: true }).fill('Devolución por cancelación');
    await page.getByRole('button', { name: 'Registrar movimiento' }).click();
    await expect(page.getByText('Devolución ·', { exact: false })).toBeVisible();
    assert.equal(await db.movimientoCaja.count({ where: { pedidoId: order.id, tipo: 'DEVOLUCION' } }), 1);
    await page.goto(`${origin}/admin/contabilidad`);
    await page.getByLabel('Importe (S/)').fill('5');
    await page.getByLabel('Concepto', { exact: true }).fill('Gasto de embalaje QA');
    await page.getByRole('button', { name: 'Registrar movimiento' }).click();
    await expect(page.getByRole('heading', { name: 'Gasto · Gasto de embalaje QA' })).toBeVisible();
    await page.goto(`${origin}/admin/configuracion`);
    await page.getByLabel('Nombre del negocio').fill('Tienda QA');
    await page.getByLabel('WhatsApp de pedidos').fill('51999999999');
    await page.getByLabel('Contacto o dirección').fill('Contacto de prueba');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText('Configuración guardada.')).toBeVisible();
    await page.goto(origin);
    await expect(
      page.getByRole('link', { name: 'Tienda QA, inicio' }),
    ).toBeVisible();
    await expect(
      page.getByText('Contacto de prueba', { exact: true }),
    ).toBeVisible();
    console.log(
      'Flujo navegador verificado: producto con variante → inventario → carrito → pedido → confirmar/cancelar → configuración.',
    );
  } catch (error) {
    const page = browser?.contexts()[0]?.pages()[0];
    if (page) {
      await mkdir('.vercel/qa', { recursive: true });
      await page.screenshot({ path: '.vercel/qa/failure.png', fullPage: true });
      console.log(
        'Error visible:',
        await page.getByRole('alert').allTextContents(),
      );
    }
    throw error;
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
    await new Promise<void>((resolve) => {
      if (server.exitCode !== null) resolve();
      else server.once('exit', () => resolve());
    });
  }
}
