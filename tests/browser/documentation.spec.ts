import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

test('generated docs cover every public export and have valid local links and assets', () => {
  const site = resolve('dist/demo');
  const kinds = { class: 'classes', interface: 'interfaces', type: 'types', enum: 'enums' };
  const report = readFileSync('docs/api/smithkit.api.md', 'utf8');
  const exports = [...report.matchAll(/^export (class|interface|type|enum) (\w+)/gm)];
  expect(exports.length).toBeGreaterThan(0);
  for (const [, kind, name] of exports) {
    expect(existsSync(`${site}/api/${kinds[kind as keyof typeof kinds]}/${name}.html`), name).toBe(
      true,
    );
  }
  expect(existsSync(`${site}/api/classes/SvgChartRenderer.html`)).toBe(false);
  const files = readdirSync(site, { recursive: true }) as string[];
  const cache = new Map<string, string>();
  const contents = (file: string) => {
    if (!cache.has(file)) {
      cache.set(file, readFileSync(file, 'utf8'));
    }
    return cache.get(file)!;
  };
  for (const file of files.filter((file) => file.endsWith('.html'))) {
    const html = contents(resolve(site, file));
    for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = new URL(href.replaceAll('&amp;', '&'), `https://fixture.test/smithkit/${file}`);
      if (url.origin !== 'https://fixture.test') {
        continue;
      }
      expect(url.pathname.startsWith('/smithkit/'), `${file}: ${href}`).toBe(true);
      const local = decodeURIComponent(url.pathname.slice('/smithkit/'.length));
      const target = resolve(site, local.endsWith('/') ? `${local}index.html` : local);
      expect(existsSync(target), `${file}: ${href}`).toBe(true);
      if (url.hash && /\.(html|svg)$/.test(target)) {
        const id = decodeURIComponent(url.hash.slice(1));
        expect(contents(target), `${file}: ${href}`).toContain(`id="${id}"`);
      }
    }
  }
});

test('demo opens searchable documentation with working method and guide links', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('');
  await page.getByRole('link', { name: 'API documentation', exact: true }).click();
  await expect(page).toHaveURL(/\/smithkit\/api\/index.html$/);
  await page.screenshot({ path: 'test-results/api-reference-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('combobox').fill('setOptions');
  await page.locator('#tsd-search-results a[href*="Smith.html#setoptions"]').click();
  await expect(page).toHaveURL(/Smith.html#setoptions$/);
  await expect(page.locator('#setoptions')).toBeVisible();
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('combobox').fill('StrictMode');
  await expect(page.locator('#tsd-search-results')).toContainText('Framework integration');
  await page.locator('#tsd-search-results a[href*="Framework_integration.html"]').first().click();
  await expect(page.getByRole('heading', { name: /^React\b/ })).toBeVisible();
  await page.getByRole('link', { name: 'Open the React example', exact: true }).click();
  await expect(page).toHaveURL(/\/smithkit\/examples\/react\/index.html$/);
  await expect(page.locator('#chart svg')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('React and Angular examples deep-link to guides on the same site', async ({ page }) => {
  for (const [slug, title] of [
    ['react', 'React'],
    ['angular', 'Angular'],
  ] as const) {
    await page.goto(`examples/${slug}/index.html`);
    await page.getByRole('link', { name: `${title} integration guide`, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`Framework_integration.html#${slug}$`));
    await expect(page.getByRole('heading', { name: new RegExp(`^${title}\\b`) })).toBeVisible();
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('api/index.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('combobox').fill('SmithOptions');
  await page.locator('#tsd-search-results a[href*="interfaces/SmithOptions.html"]').first().click();
  await expect(page.getByRole('heading', { name: /SmithOptions/ }).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/api-reference-mobile.png', fullPage: true });
});
