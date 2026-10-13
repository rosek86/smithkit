import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Keep the library and demo outputs independent, and remove stale library modules.
rmSync(new URL('../dist/lib/', import.meta.url), { recursive: true, force: true });
// Dependencies can also install a `tsc` binary. Select the repository's native compiler explicitly.
execFileSync(
  process.execPath,
  [
    fileURLToPath(new URL('../node_modules/@typescript/native/bin/tsc', import.meta.url)),
    '-p',
    'tsconfig.lib.json',
  ],
  { stdio: 'inherit' },
);
