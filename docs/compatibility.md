# Browser and TypeScript compatibility

This document records tested browser and compiler versions, the checks performed,
and the build targets used by the project. Browser results apply to the recorded
versions and environments; they are not a minimum-version support guarantee.
See the [API review](api-review.md) for the intended 1.0 API compatibility contract.

## Automated browser tests

The automated checks run the Chromium, Firefox, and WebKit versions pinned by
Playwright in the lockfile, on CI's Linux runner and during local development.
They cover rendering, interaction, SVG/PNG export, resize, destruction, and the
installed-package gallery. These engine tests are recorded separately from the
native-browser checks below. The engine versions can be inspected through the
installed Playwright browsers.

## Build targets and runtime requirements

The demo, standalone gallery, and native-browser test fixture compile for
`chrome111`, `edge111`, `firefox114`, and `safari16.4`, matching the
[Vite 8 default production targets](https://vite.dev/guide/build).
These are compilation settings, not evidence of browser testing. Applications
using the ESM package must configure their own bundler targets; Smithkit supplies
ES2022 modules and does not install polyfills.

Rendering requires a browser DOM, SVG, ResizeObserver, and DOM geometry APIs.
PNG export also uses canvas, Blob, and object URLs. No separate stylesheet is
required. Hosts must have a non-zero size when mounted. Browser text metrics
can differ, so exact pixels and identical label density are not guaranteed.

## Native-browser verification

Last checked: **2026-10-14**. Safari 26.6 was tested against library source at
[`cd6b871`](https://github.com/rosek86/smithkit/commit/cd6b871521c6a4a5348d26b5bac370979e7e077b);
Firefox 114 was tested against
[`b5b12a9`](https://github.com/rosek86/smithkit/commit/b5b12a93d31a597ca9c596a16f43797554e479f3).
The [main CI run](https://github.com/rosek86/smithkit/actions/runs/38351309947)
also passed the automated integration checks.

| Browser                   | Environment                                                | Result                                                    |
| ------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| Firefox 114.0 and 114.0.2 | Native Firefox, geckodriver 0.33.0, headless on macOS 26.6 | Smoke checks passed; the 114.0.2 screenshot was reviewed. |
| Safari 26.6               | Native SafariDriver, visible browser on macOS 26.6         | Smoke checks passed; screenshot reviewed.                 |

The [Firefox 114.0 report](browser-checks/firefox-114.0-macos.json) records the
exact version check. Its dirty-checkout flag reflects the new test harness and
documentation; library sources were unchanged from the Firefox revision above. The
114.0.2 screenshot was also reviewed for labels and marker rendering.

The [Safari 26.6 report](browser-checks/safari-26.6-macos.json) records the same
checks using SafariDriver, including real keyboard input. The dirty-checkout flag
reflects a test-runner fix accepting SafariDriver's capitalized browser name;
library sources and the browser fixture were unchanged from `cd6b871`. Safari
remote automation was enabled manually before this run. The test session was
closed after completion; the setting can now be disabled again.

The smoke check exercises the emitted `dist/lib` package, bundled for
the build targets listed above. It checks packed Touchstone import, SVG paths and
labels (including Unicode), text measurement, radial scales, data/options updates
without replacing the SVG, ResizeObserver, the 44px marker target, a synthetic
wheel event, keyboard marker movement through WebDriver, focus/ARIA/events,
SVG/PNG export with scales and legends, and repeated mount/destroy cycles.
It is a focused smoke test, not the full Playwright suite or a framework support
certification. The wheel test does not establish native trackpad or pinch behavior.

### Reproduce with a browser's own WebDriver

Start the vendor's driver in another terminal. For Safari, use
`/usr/bin/safaridriver -p 4445` after manually enabling
[Allow Remote Automation](https://developer.apple.com/documentation/webkit/testing-with-webdriver-in-safari).
The script never changes this setting. For Firefox, start
`geckodriver --port 4446`; use a driver compatible with the selected version
([Mozilla's support table](https://firefox-source-docs.mozilla.org/testing/geckodriver/Support.html)).
Firefox binaries were taken from the
[official Mozilla archive](https://archive.mozilla.org/pub/firefox/releases/114.0/mac/en-US/).
Historical test binaries should use isolated profiles, not replace a daily browser.

```sh
# Exact version checking prevents silently testing a different installed browser.
npm run check:browser -- --driver http://127.0.0.1:4445 --browser safari --version 26.6

npm run check:browser -- --driver http://127.0.0.1:4446 \
  --browser firefox --version 114.0 \
  --binary /path/to/Firefox.app/Contents/MacOS/firefox --headless
```

The runner rebuilds the library, serves only its test fixture on loopback, opens
a new WebDriver session, and closes the session and HTTP server in `finally`.
It does not start or stop the vendor driver. `--browser chrome` and
`--browser MicrosoftEdge` accept the same optional `--binary` and `--headless`
flags.
The driver must run on the same computer: the loopback fixture is not reachable
from a remote device or cloud service.

Results and a pre-cleanup screenshot go to `artifacts/compatibility/`; change the
directory with `--output`. JSON records the exact browser version, user agent,
commit, dirty-checkout flag, fixture bundle SHA-256, completed checks, and errors.
A mismatch with `--version` fails the run. A green result only supports the
listed checks on that particular browser/build/platform.

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
