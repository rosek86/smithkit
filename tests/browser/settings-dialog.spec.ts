import { expect, test } from '@playwright/test';

test.describe('settings backdrop', () => {
  test.use({ hasTouch: true });

  for (const width of [1280, 360]) {
    test(`outside clicks and taps dismiss settings at ${width}px without losing changes`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('./');
      const opener = page.getByRole('button', { name: 'Chart settings', exact: true });
      const dialog = page.getByRole('dialog', { name: 'Chart settings', exact: true });
      await opener.click();
      await dialog.getByLabel('Grid labels', { exact: true }).uncheck();
      const bounds = (await dialog.boundingBox())!;
      // Dialog padding is part of the panel, even though the dialog is the event target.
      await page.mouse.click(bounds.x + 8, bounds.y + 8);
      await expect(dialog).toBeVisible();
      // Ending a drag outside must not act like clicking the backdrop.
      await page.mouse.move(bounds.x + 8, bounds.y + 8);
      await page.mouse.down();
      await page.mouse.move(4, 4);
      await page.mouse.up();
      await expect(dialog).toBeVisible();
      await page.mouse.click(4, 4);
      await expect(dialog).not.toBeVisible();
      await expect(opener).toBeFocused();
      await opener.click();
      await expect(dialog.getByLabel('Grid labels', { exact: true })).not.toBeChecked();
      await page.touchscreen.tap(4, 4);
      await expect(dialog).not.toBeVisible();
      await expect(opener).toBeFocused();
      await expect(page.locator('header #theme')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    });
  }
});

test('chart settings group all preferences, prevent background keyboard interaction, and retain changes on close', async ({
  page,
}) => {
  await page.goto('./');
  const opener = page.getByRole('button', { name: 'Chart settings', exact: true });
  const dialog = page.getByRole('dialog', { name: 'Chart settings', exact: true });
  await expect(dialog).not.toBeVisible();
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  for (const id of [
    'impedance',
    'admittance',
    'constantQ',
    'constantSwr',
    'peripheral-scales',
    'grid-detail',
    'grid-labels',
    'reference-impedance',
    'renormalize-import',
  ]) {
    await expect(dialog.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press('Tab');
    // Native dialogs may cycle through browser chrome (activeElement becomes body),
    // but must never focus an underlying page control.
    expect(
      await dialog.evaluate(
        (node) => node.contains(document.activeElement) || document.activeElement === document.body,
      ),
    ).toBe(true);
  }
  await dialog.getByLabel('Grid labels', { exact: true }).uncheck();
  await dialog.getByLabel('Grid detail').selectOption('basic');
  await expect(dialog).toHaveCSS('background-color', 'rgb(25, 28, 32)');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page.locator('[data-label-layer=resistance]')).toHaveCSS('display', 'none');
  await opener.click();
  await expect(dialog.getByLabel('Grid labels', { exact: true })).not.toBeChecked();
  await expect(dialog.getByLabel('Grid detail')).toHaveValue('basic');
  await expect(dialog.locator('#theme')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/settings-dialog-dark.png' });
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(opener).toBeFocused();
});

test('settings remain usable without horizontal overflow on a small viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 540 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Chart settings', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Chart settings', exact: true });
  const box = (await dialog.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  expect(box.y + box.height).toBeLessThanOrEqual(540);
  expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await dialog.getByLabel('Chart Z₀ (Ω)').fill('75');
  await dialog.getByRole('button', { name: 'Apply Z₀' }).click();
  await expect(dialog.locator('#reference-status')).toContainText('Chart renormalized to 75 Ω');
  await dialog.getByLabel('Renormalize imported data to chart Z₀').uncheck();
  await dialog.evaluate((node) => (node.scrollTop = 0));
  await page.screenshot({ path: 'test-results/settings-dialog-mobile.png' });
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#reference-value')).toHaveText('Z₀ = 75 Ω');
});
