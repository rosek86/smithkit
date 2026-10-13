# Browser and TypeScript compatibility

This is the proposed baseline for the 1.0 API. The library remains at 0.x;
see the [API review](api-review.md) for the intended compatibility guarantee.

## Browser baseline

Smithkit targets Chrome 111+, Edge 111+, Firefox 114+, and Safari/iOS Safari 16.4+.
These floors match the [Vite 8 default production targets](https://vite.dev/guide/build).
The demo and standalone gallery explicitly use the same targets. Applications
using the ESM package must configure their own bundler targets; Smithkit supplies
ES2022 modules and does not install polyfills.

Rendering requires a browser DOM, SVG, ResizeObserver, and DOM geometry APIs.
PNG export also uses canvas, Blob, and object URLs. No separate stylesheet is
required. Hosts must have a non-zero size when mounted. Browser text metrics
can differ, so exact pixels and identical label density are not guaranteed.

The automated checks run the Chromium, Firefox, and WebKit versions pinned by
Playwright in the lockfile, on CI's Linux runner and during local development.
They cover rendering, interaction, SVG/PNG export, resize, destruction, and the
installed-package gallery. WebKit testing is useful Safari coverage, but is not
a test of the Safari application or a physical iOS device. Edge is not run
separately.

**The minimum versions above are build/support targets, not results from testing
those historical browser binaries.** Before declaring 1.0, verify these floors
on the actual browsers, including Safari/iOS, or adjust the documented baseline.
The currently tested engines and their versions can be inspected through the
installed Playwright browsers. Raising a confirmed support floor during 1.x will
require a major release.

## TypeScript and runtime

The minimum checked consumer compiler is **TypeScript 5.7.3**. `check:package`
installs the packed library into a fresh project and compiles its public API and
README examples in strict mode with both `NodeNext` and `Bundler` module
resolution. Declaration checking is enabled. The same checks run with the
repository's TypeScript 7 compiler. Earlier compilers are not supported by this
baseline, even if some imports happen to compile.

The library has no React or Angular runtime dependency. Node.js 24 is used for
building and checking this repository; it is not required in browser consumers.
Importing the ESM package and using the math, RF, and Touchstone classes does not
require a DOM. Construct and mount visual components only in the browser.

## Framework integration evidence

The gallery demonstrates **React 19.3** and **Angular 22.2** with small, copyable,
single-trace components. These are examples, not separately versioned framework
packages or promises to support every framework release. An application's
framework may impose stricter browser/compiler requirements than Smithkit:
Angular 22 requires TypeScript 6 and its own browser baseline; see
[Angular version compatibility](https://angular.dev/reference/versions).

- React creates the chart in an effect, patches options/data through separate
  effects, and destroys it on cleanup. An additional development-server test
  exercises [StrictMode's setup/cleanup replay](https://react.dev/reference/react/StrictMode).
- Angular mounts with [afterNextRender](https://angular.dev/guide/components/lifecycle),
  patches inputs through `ngOnChanges`, and unsubscribes/destroys in `ngOnDestroy`.
  The example uses zoneless signal-driven parent state. Parent events are deferred
  out of input updates and discarded after destruction.
- Both keep the same SVG instance while replacing data or configuration, reflect
  keyboard marker changes in framework state, resize through Smithkit's observer,
  and disconnect their observers on unmount. Remounting does not duplicate events.
- The standalone-gallery check uses the packed library, not a source alias.
  Angular templates also pass the Angular compiler's strict AOT type checks.

The Angular gallery page uses JIT compilation to share the existing Vite build.
A normal Angular CLI application uses AOT and does not need the gallery's
`@angular/compiler` import. Framework dependencies are loaded only on their
respective example pages, not by the main demo or the npm library.

These tests do not establish end-to-end server-rendering/hydration support.
For SSR applications, follow the framework's browser-only mounting lifecycle;
never construct a chart during server rendering.
