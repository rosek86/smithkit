import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
    rolldownOptions: {
      input: [
        'index.html',
        'large-trace/index.html',
        'static/index.html',
        'touchstone/index.html',
        'markers/index.html',
        'appearance/index.html',
        'export/index.html',
        'basic/index.html',
        'react/index.html',
        'angular/index.html',
      ],
    },
  },
});
