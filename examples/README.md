# Integration examples

[Open the gallery](https://rosek86.github.io/smithkit/examples/index.html) from the
main demo's **Examples** link. Each page demonstrates one library task and displays
the TypeScript it executes, rather than a separately maintained snippet.

| Example                                             | Public API focus                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| [Static chart](static/main.ts)                      | constructor options, `draw`, grid detail, traces                 |
| [External marker controls](markers/main.ts)         | stable marker IDs, `onEvent`, sample selection, focus            |
| [Themes and overrides](appearance/main.ts)          | `setOptions`, presets, overrides                                 |
| [Touchstone](touchstone/main.ts)                    | S11/S22 packed import, file reference, `.s1p` download           |
| [Report export](export/main.ts)                     | SVG/PNG, image size, background, marker legends                  |
| [Mount, update, and destroy](basic/main.ts)         | subscriptions, data replacement, resize, cleanup                 |
| [React component](react/SmithChart.tsx)             | effects, immutable props, events, StrictMode cleanup             |
| [Angular component](angular/SmithChartComponent.ts) | browser mounting, inputs, outputs, zoneless updates, destruction |
| [Large trace](large-trace/main.ts)                  | 100,000 packed samples, zoom, full-data marker selection         |

Use Node.js 24 and npm. This directory can be copied into a separate project.

Install the published package and start the gallery:

```sh
cd examples
npm install
npm run dev
```

To test local library changes, run `npm pack` from the repository root, then
`npm install --no-save --package-lock=false ../smithkit-0.7.0.tgz` in `examples`.
Use the archive's absolute path when running a copied gallery.

`npm run build` creates the complete standalone gallery in `dist/`. It imports the
installed `smithkit` package and has no aliases to repository source. The basic
example also remains runnable independently from its own directory.

Source panels use Shiki with the same `dark-plus` syntax theme as the API reference.
The shared presentation helper lives in `basic/highlight.ts` so the basic example
remains self-contained. Highlighting is not needed by the chart integration code.
HTML host snippets are formatted with Prettier before highlighting, including in
production builds where the page markup is minified.

The pages use ordinary HTML elements and containers with an explicit size. A white
host background keeps the light theme's dark labels readable: the light preset's
SVG background is transparent. The dark preset supplies its own opaque background.
For framework integration, create the chart after mounting the host element, retain
returned IDs/subscriptions, and call the unsubscribe functions and `destroy()`
when unmounting. The lifecycle example shows this explicitly. The other examples
keep the chart alive for the lifetime of the page, including browser back/forward
navigation.

The repository's `check:example` command installs the exact packed library into a
temporary copy of this gallery, compiles it against the installed declarations,
builds it, and checks the integrations in Chromium, Firefox, and WebKit.

## Using the framework components

The framework examples are small single-trace components, not wrapper packages.
Copy `react/SmithChart.tsx` or `angular/SmithChartComponent.ts` into your application;
install `smithkit` alongside your existing framework. `main.tsx` / `main.ts` shows
the parent integration, and `framework-data.ts` contains only example data and
readout formatting. The gallery displays all of these source files.

Pass a new `samples` array/buffer to replace a sweep and a new `options` object to
apply a configuration patch. Mutating the existing objects in place does not
trigger an update. Keep options stable between unrelated renders (React's parent
uses `useMemo`). Options follow `setOptions()` patch semantics: omitted fields
retain their current values. Mount the component inside an explicitly sized
container, for example `width: 100%; height: 500px`. No window resize listener or
framework-specific observer is needed.

These components intentionally own one trace and one marker. Use the demonstrated
lifecycle pattern with the public API for multiple traces rather than treating
these props as a second configuration API. The marker slider and native marker
keyboard/drag interaction share framework-owned selection state.

React runs with StrictMode. Angular uses browser-only `afterNextRender` and
zoneless change detection. The gallery imports `@angular/compiler` for its Vite
JIT build; omit that import in a normal Angular CLI/AOT application. Angular's
strict template check runs as part of the root `npm run typecheck` and the
isolated gallery check. See [compatibility](../docs/compatibility.md) for versions
and the limits of the verification, including SSR.
