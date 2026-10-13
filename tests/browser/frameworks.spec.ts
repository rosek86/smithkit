import { expect, test } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';

for (const framework of ['react', 'angular']) {
  test(`${framework} preserves its chart across props, cleans up, and remounts`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const active = new Set<ResizeObserver>();
      const Original = window.ResizeObserver;
      window.ResizeObserver = class extends Original {
        public override observe(target: Element, options?: ResizeObserverOptions): void {
          active.add(this);
          super.observe(target, options);
        }
        public override disconnect(): void {
          active.delete(this);
          super.disconnect();
        }
      };
      Object.defineProperty(window, 'activeChartObservers', { get: () => active.size });
    });
    await page.goto(`examples/${framework}/index.html`);
    const svg = page.locator('#chart svg');
    const reading = page.locator('#reading');
    await expect(reading).toContainText('1.5 GHz');
    await expect(svg).toHaveCount(1);
    await svg.evaluate((node) => node.setAttribute('data-instance-test', 'original'));
    const first = await reading.textContent();
    await page.getByRole('button', { name: 'Replace sweep' }).click();
    await expect(reading).not.toHaveText(first!);
    await expect(reading).toContainText('0.200 + 0.100i');
    const background = await svg.evaluate((node) => getComputedStyle(node).backgroundColor);
    await page.getByLabel('Dark theme').check();
    await expect
      .poll(() => svg.evaluate((node) => getComputedStyle(node).backgroundColor))
      .not.toBe(background);
    await expect(svg).toHaveAttribute('data-instance-test', 'original');
    await page.getByLabel('Compact chart').check();
    await expect.poll(async () => (await svg.boundingBox())!.width).toBe(360);
    // Resize must also update SVG geometry, retaining constant-size data points.
    await expect
      .poll(
        async () => (await page.locator('[data-role=samples] circle').first().boundingBox())!.width,
      )
      .toBeCloseTo(4, 1);
    const count = Number(await page.locator('#event-count').textContent());
    await page.getByLabel('Marker sample').fill('2');
    await expect(reading).toContainText('2 GHz');
    await expect(page.locator('#event-count')).toHaveText(String(count + 1));
    // Native marker interaction updates framework-owned state as well.
    const marker = page.getByRole('slider', { name: 'Measured sweep, marker 1', exact: true });
    await marker.focus();
    await page.keyboard.press('Home');
    await expect(page.getByLabel('Marker sample')).toHaveValue('0');
    await expect(reading).toContainText('1 GHz');
    await page.keyboard.press('End');
    await expect(page.getByLabel('Marker sample')).toHaveValue('2');
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Unmount chart', exact: true }).click();
      await expect(svg).toHaveCount(0);
      await expect(reading).toHaveText('No chart mounted.');
      expect(await page.evaluate(() => Reflect.get(window, 'activeChartObservers'))).toBe(0);
      const events = await page.locator('#event-count').textContent();
      await page.setViewportSize({ width: 1000 + i * 10, height: 900 });
      await expect(page.locator('#event-count')).toHaveText(events!);
      await page.getByRole('button', { name: 'Mount chart', exact: true }).click();
      await expect(svg).toHaveCount(1);
      await expect(reading).toContainText('2 GHz');
      expect(await page.evaluate(() => Reflect.get(window, 'activeChartObservers'))).toBe(1);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/framework-${framework}.png`, fullPage: true });
  });
}

test('React development StrictMode replays effects without leaking a chart or subscription', async ({
  page,
}) => {
  // Other browser tests call Vite's build API, which can leave NODE_ENV=production
  // in a reused worker. StrictMode effect replay requires development React.
  const previousNodeEnv = process.env.NODE_ENV;
  let server: ViteDevServer | undefined;
  try {
    process.env.NODE_ENV = 'development';
    server = await createServer({
      mode: 'development',
      server: { host: '127.0.0.1', port: 0, open: false },
    });
    await server.listen();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const active = new Set<ResizeObserver>();
      let disconnected = 0;
      const Original = window.ResizeObserver;
      window.ResizeObserver = class extends Original {
        public override observe(target: Element, options?: ResizeObserverOptions): void {
          active.add(this);
          super.observe(target, options);
        }
        public override disconnect(): void {
          active.delete(this);
          disconnected++;
          super.disconnect();
        }
      };
      Object.defineProperty(window, 'chartObservers', {
        get: () => ({ active: active.size, disconnected }),
      });
    });
    await page.goto(new URL('examples/react/index.html', server.resolvedUrls!.local[0]).href);
    await expect(page.locator('#reading')).toContainText('1.5 GHz');
    await expect(page.locator('#chart svg')).toHaveCount(1);
    const observers = await page.evaluate(() => Reflect.get(window, 'chartObservers'));
    expect(observers.active).toBe(1);
    expect(observers.disconnected).toBeGreaterThanOrEqual(1);
    const count = Number(await page.locator('#event-count').textContent());
    await page.getByLabel('Marker sample').fill('2');
    await expect(page.locator('#reading')).toContainText('2 GHz');
    await expect(page.locator('#event-count')).toHaveText(String(count + 1));
    await page.getByRole('button', { name: 'Unmount chart', exact: true }).click();
    expect(await page.evaluate(() => Reflect.get(window, 'chartObservers').active)).toBe(0);
    expect(errors).toEqual([]);
  } finally {
    try {
      await server?.close();
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  }
});
