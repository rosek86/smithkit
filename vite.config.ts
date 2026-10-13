import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: { alias: { smithkit: fileURLToPath(new URL('./src/index.ts', import.meta.url)) } },
  build: {
    target: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
    outDir: 'dist/demo',
    sourcemap: true,
    rolldownOptions: {
      input: [
        'index.html',
        'examples/large-trace/index.html',
        'examples/index.html',
        'examples/static/index.html',
        'examples/touchstone/index.html',
        'examples/markers/index.html',
        'examples/appearance/index.html',
        'examples/export/index.html',
        'examples/basic/index.html',
        'examples/react/index.html',
        'examples/angular/index.html',
      ],
    },
  },
});
