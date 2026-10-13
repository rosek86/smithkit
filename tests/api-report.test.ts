import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';

const fixtures: string[] = [];
const declarations = `
export interface Options { readonly theme?: 'light' | 'dark'; }
export type Input = string | number;
export declare enum EventType { Change = 'change' }
export declare class Chart {
  private state;
  constructor(options?: Options);
  get name(): string;
  update(value: string): void;
  update(value: number): void;
}
`;

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'smithkit-api-report-'));
  fixtures.push(directory);
  mkdirSync(join(directory, 'dist/lib'), { recursive: true });
  mkdirSync(join(directory, 'docs/api'), { recursive: true });
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({ name: 'api-fixture', version: '0.0.0' }),
  );
  const entry = join(directory, 'dist/lib/index.d.ts');
  const source = join(directory, 'dist/lib/chart.d.ts');
  writeFileSync(
    entry,
    "export { Chart, EventType } from './chart.js';\nexport type { Options, Input } from './chart.js';\n",
  );
  writeFileSync(source, declarations);
  const configPath = resolve('api-extractor.json');
  const config = ExtractorConfig.prepare({
    configObject: { ...ExtractorConfig.loadFile(configPath), projectFolder: directory },
    configObjectFullPath: configPath,
    packageJsonFullPath: join(directory, 'package.json'),
  });
  const report = () => readFileSync(config.reportFilePath, 'utf8');
  const run = (localBuild = false) => {
    const messages: string[] = [];
    const result = Extractor.invoke(config, {
      localBuild,
      messageCallback: (message) => {
        messages.push(message.messageId);
        message.handled = true;
      },
    });
    return { succeeded: result.succeeded, messages };
  };
  return { entry, source, report, run };
}

afterEach(() => {
  for (const directory of fixtures.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

it('reports re-exported signatures and ignores private implementation changes', () => {
  const { source, report, run } = fixture();
  expect(run(true).succeeded).toBe(true);
  const baseline = report();
  expect(baseline).toContain('constructor(options?: Options)');
  expect(baseline).toContain('get name(): string');
  expect(baseline).toContain('update(value: string): void');
  expect(baseline).toContain('update(value: number): void');
  expect(baseline).toContain('readonly theme?');
  expect(baseline).toContain('export type Input = string | number');
  expect(baseline).toContain("Change = 'change'");
  expect(baseline).not.toContain('private state');
  writeFileSync(
    source,
    declarations.replace('private state;', 'private renamedState;\nprivate helper;'),
  );
  expect(run().succeeded).toBe(true);
  expect(report()).toBe(baseline);
});

it('rejects API changes without rewriting the tracked baseline until explicitly updated', () => {
  const { entry, source, report, run } = fixture();
  // A clean checkout also fails if the tracked report is missing.
  expect(run().succeeded).toBe(false);
  expect(run(true).succeeded).toBe(true);
  const baseline = report();
  for (const changed of [
    declarations.replace('update(value: string): void;', 'update(value: boolean): void;'),
    declarations.replace("'light' | 'dark'", "'light' | 'dark' | 'system'"),
    declarations.replace('private state;', 'state: string;'),
  ]) {
    writeFileSync(source, changed);
    expect(run().succeeded).toBe(false);
    expect(report()).toBe(baseline);
  }
  writeFileSync(source, declarations);
  writeFileSync(
    entry,
    "export { Chart } from './chart.js';\nexport type { Options } from './chart.js';\n",
  );
  expect(run().succeeded).toBe(false);
  expect(report()).toBe(baseline);
  expect(run(true).succeeded).toBe(true);
  expect(run().succeeded).toBe(true);
  expect(report()).not.toBe(baseline);
}, 20_000);

it('rejects references to unexported local types even when updating the report', () => {
  const { source, run } = fixture();
  writeFileSync(
    source,
    declarations.replace('get name(): string;', 'get name(): Renderer;') +
      '\ninterface Renderer { rawSvg: SVGSVGElement; }\n',
  );
  const result = run(true);
  expect(result.messages).toContain('ae-forgotten-export');
  expect(result.succeeded).toBe(false);
});
