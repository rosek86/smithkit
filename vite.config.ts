import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: { alias: { smithkit: fileURLToPath(new URL('./src/index.ts', import.meta.url)) } },
  plugins: [
    {
      name: 'local-api-documentation-links',
      // The standalone gallery links to hosted docs; the full demo uses its own build.
      transformIndexHtml(html, context) {
        const path = relative(dirname(context.filename), resolve('api')).replaceAll('\\', '/');
        return html.replaceAll('https://rosek86.github.io/smithkit/api/', `${path}/`);
      },
    },
  ],
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
