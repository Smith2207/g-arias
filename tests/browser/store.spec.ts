import { test, expect } from '@playwright/test';
test('Catálogo vacío, carrito y protección administrativa', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Encuentra tu próximo favorito/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /administración/i })).toHaveCount(0);
  await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
  await page.getByRole('link', { name: /Mi pedido,/ }).click();
  await expect(page.getByRole('heading', { name: 'Tu próximo pedido empieza aquí' })).toBeVisible();
  await page.goto('/admin/productos/nuevo');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
});
test('El carrito conserva cantidades y genera el enlace de WhatsApp', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('arias-cart-v1', JSON.stringify({ state: { items: [{ id: 'test', nombre: 'Gorra de prueba', imagen: '', presentacion: 'docena', unidadesPorCaja: 144, cantidad: 2, precio: 60 }] }, version: 0 })));
  await page.goto('/carrito');
  const quantity = page.getByRole('spinbutton');
  await quantity.fill('3');
  await page.reload();
  await expect(quantity).toHaveValue('3');
  const link = page.getByRole('link', { name: 'Enviar pedido por WhatsApp' });
  await expect(link).toHaveAttribute('href', /^https:\/\/wa.me\/51999999999\?text=/);
  const message = new URL((await link.getAttribute('href'))!).searchParams.get('text')!;
  expect(message).toContain('Gorra de prueba');
  expect(message).toMatch(/180[.,]00/);
  await page.getByRole('button', { name: /Eliminar Gorra/ }).click();
  await expect(page.getByRole('heading', { name: 'Tu próximo pedido empieza aquí' })).toBeVisible();
});

test('Filtros, búsqueda y navegación hacia cómo comprar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar productos' }).fill('sombrero');
  await page.getByLabel('Ordenar productos').selectOption('nombre');
  await page.getByRole('button', { name: 'Aplicar búsqueda y orden' }).click();
  await expect(page).toHaveURL(/q=sombrero&orden=nombre/);
  await expect(page.getByText('Resultados para “sombrero”')).toBeVisible();
  await page.getByRole('link', { name: 'Limpiar filtros' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  await page.getByRole('link', { name: 'Así de fácil' }).click();
  await expect(page).toHaveURL(/#como-comprar$/);
  await expect(page.getByRole('heading', { name: 'Arma tu pedido' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
