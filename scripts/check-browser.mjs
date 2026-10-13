import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { build } from 'vite';

const { values } = parseArgs({
  options: {
    driver: { type: 'string' },
    browser: { type: 'string' },
    version: { type: 'string' },
    binary: { type: 'string' },
    headless: { type: 'boolean', default: false },
    output: { type: 'string', default: 'artifacts/compatibility' },
  },
});
if (!values.driver || !values.browser || !values.version) {
  throw new Error(
    'Required: --driver URL --browser NAME --version EXACT_VERSION. See docs/compatibility.md.',
  );
}
const driver = values.driver.replace(/\/$/, '');
const capabilities = { browserName: values.browser };
if (values.browser === 'firefox') {
  capabilities['moz:firefoxOptions'] = {
    ...(values.binary ? { binary: values.binary } : {}),
    args: values.headless ? ['-headless'] : [],
  };
} else if (values.browser === 'chrome' || values.browser === 'MicrosoftEdge') {
  capabilities[values.browser === 'chrome' ? 'goog:chromeOptions' : 'ms:edgeOptions'] = {
    ...(values.binary ? { binary: values.binary } : {}),
    args: values.headless ? ['--headless'] : [],
  };
} else if (values.binary || values.headless) {
  throw new Error('--binary and --headless are supported only for Firefox, Chrome and Edge.');
}

// Always build the emitted package first. Vite has no source aliases in this check.
execFileSync(process.execPath, ['scripts/build-library.mjs'], { stdio: 'inherit' });
const result = await build({
  configFile: false,
  logLevel: 'silent',
  resolve: { alias: { smithkit: resolve('dist/lib/index.js') } },
  build: {
    target: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
    lib: {
      entry: resolve('tests/compatibility/smoke.ts'),
      name: 'Compatibility',
      formats: ['iife'],
    },
    write: false,
    minify: false,
  },
});
const output = Array.isArray(result) ? result[0] : result;
const code = output.output.find((item) => item.type === 'chunk').code;
const server = createServer((request, response) => {
  if (request.url === '/smoke.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    response.end(code);
  } else {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(
      '<!doctype html><meta charset="utf-8"><title>Smithkit compatibility</title><script src="/smoke.js"></script>',
    );
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

async function command(path, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(`${driver}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(90000),
  });
  const { value } = await response.json();
  if (!response.ok) {
    throw new Error(value?.message ?? `WebDriver HTTP ${response.status}`);
  }
  return value;
}

const report = {
  timestamp: new Date().toISOString(),
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  workingTreeDirty: !!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
  packageVersion: JSON.parse(await readFile('package.json', 'utf8')).version,
  bundleSha256: createHash('sha256').update(code).digest('hex'),
  expectedBrowser: values.browser,
  expectedVersion: values.version,
  headless: values.headless,
  status: 'failed',
  checks: [],
};
let session;
try {
  const created = await command('/session', { capabilities: { alwaysMatch: capabilities } });
  session = created.sessionId;
  report.browser = created.capabilities.browserName;
  report.browserVersion = created.capabilities.browserVersion;
  report.platform = created.capabilities.platformName;
  if (report.browserVersion !== values.version || report.browser !== values.browser) {
    throw new Error(
      `Wrong browser: ${report.browser} ${report.browserVersion}; expected ${values.browser} ${values.version}.`,
    );
  }
  const call = (path, body, method) => command(`/session/${session}${path}`, body, method);
  await call('/timeouts', { script: 60000, pageLoad: 60000 });
  await call('/window/rect', { width: 1000, height: 1000 });
  await call('/url', { url: `http://127.0.0.1:${server.address().port}/` });
  report.userAgent = await call('/execute/sync', {
    script: 'return navigator.userAgent',
    args: [],
  });
  for (const phase of ['setup', 'finish']) {
    const result = await call('/execute/async', {
      script: `const done = arguments[arguments.length - 1];
        Compatibility.${phase}().then(checks => done({checks}), error => done({error: String(error) + '\\n' + (error.stack || '')}));`,
      args: [],
    });
    if (result.error) {
      throw new Error(result.error);
    }
    report.checks = result.checks;
    if (phase === 'setup') {
      await mkdir(values.output, { recursive: true });
      await writeFile(
        resolve(values.output, `${values.browser}-${values.version}.png`),
        Buffer.from(await call('/screenshot'), 'base64'),
      );
      await call('/actions', {
        actions: [
          {
            type: 'key',
            id: 'keyboard',
            actions: [
              { type: 'keyDown', value: '\uE014' },
              { type: 'keyUp', value: '\uE014' },
            ],
          },
        ],
      });
    }
  }
  report.status = 'passed';
} catch (error) {
  report.error = error.stack || String(error);
  process.exitCode = 1;
} finally {
  if (session) {
    try {
      await command(`/session/${session}`, undefined, 'DELETE');
    } catch (error) {
      report.cleanupError = String(error);
      report.status = 'failed';
      process.exitCode = 1;
    }
  }
  await new Promise((resolve) => server.close(resolve));
  await mkdir(values.output, { recursive: true });
  const path = resolve(values.output, `${values.browser}-${values.version}.json`);
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  console.log(`Report: ${path}`);
}
