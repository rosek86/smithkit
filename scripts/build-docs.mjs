import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

execFileSync(process.execPath, ['scripts/build-library.mjs'], { stdio: 'inherit' });
execFileSync(process.execPath, ['node_modules/typedoc/bin/typedoc'], { stdio: 'inherit' });

// Author links work on GitHub; generated pages follow the current demo build,
// including localhost, forks, and Pages subpaths, without depending on a live site.
const site = resolve('public');
const docs = join(site, 'api');
for (const file of readdirSync(docs, { recursive: true })) {
  if (!file.endsWith('.html')) {
    continue;
  }
  const path = join(docs, file);
  const base = relative(dirname(path), site).replaceAll('\\', '/');
  const html = readFileSync(path, 'utf8').replaceAll(
    'href="https://rosek86.github.io/smithkit/',
    `href="${base}/`,
  );
  writeFileSync(path, html);
}
