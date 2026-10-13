# Contributing

This repository develops the `smithkit` library and a separate demonstration app.
The introduction belongs in [README.md](README.md), usage guides in `docs/guide/`,
and reference descriptions in public TypeScript doc comments. Agent-specific
working rules live in [AGENTS.md](AGENTS.md).

## Local development

Clone the repository, then use Node.js 24 LTS, as specified in `.nvmrc`, and the
committed npm lockfile:

```sh
git clone https://github.com/rosek86/smithkit.git
cd smithkit
nvm use
npm ci
npm run dev
```

The development server opens the demo. Node.js 24 is a development toolchain
requirement, not a browser requirement for applications using the library.

| Command                        | Purpose                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `npm run lint`                 | Check JavaScript and TypeScript with ESLint; warnings fail the check.                                 |
| `npm run lint:fix`             | Apply automatic ESLint fixes.                                                                         |
| `npm run format`               | Format source, configuration, demo assets, and documentation with Prettier.                           |
| `npm run format:check`         | Check formatting without changing files.                                                              |
| `npm run typecheck`            | Check types and Angular strict templates with TypeScript 7 and Angular/TypeScript 6.                  |
| `npm run build`                | Build ESM modules and TypeScript declarations in `dist/lib/`.                                         |
| `npm run build:demo`           | Build the demo and integration gallery in `dist/demo/`.                                               |
| `npm run build:docs`           | Rebuild library declarations and generate the searchable API site in `public/api/`.                   |
| `npm run preview`              | Preview the built demo.                                                                               |
| `npm test`                     | Run calculation, parser, scale, and release verification tests.                                       |
| `npm run api:check`            | Rebuild declarations and fail if the tracked public API report differs.                               |
| `npm run api:update`           | Rebuild declarations and explicitly update the public API report for review.                          |
| `npm run check`                | Check formatting, lint, types, tests, the API report, and library/demo builds.                        |
| `npm run test:e2e`             | Run browser tests against the built demo under `/smithkit/`.                                          |
| `npm run check:package`        | Pack and install the library in an isolated consumer; verify ESM imports and declarations.            |
| `npm run check:browser -- ...` | Run a native-browser WebDriver smoke check; requires a local vendor driver and exact browser version. |
| `npm pack`                     | Rebuild the library and create an installable `.tgz` archive.                                         |

For browser tests, run `npm run build:demo` and `npx playwright install chromium`
first. To use an installed Chrome instead, run
`PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`. Run WebKit coverage with
`npm run test:e2e:webkit` after `npx playwright install webkit`. Run Firefox with `npm run test:e2e:firefox` after `npx playwright install firefox`.
CI runs Chromium, Firefox, and WebKit. Native pointer assertions allow device-pixel rounding;
SVG text bounds use DOM geometry so text anchors are included.

Native Safari and historical browser verification use `check:browser`, separately
from Playwright. See [the evidence matrix and driver setup](docs/compatibility.md#native-browser-verification).

Framework packages are development dependencies used by the gallery only.
Angular's compiler uses the TypeScript 6 API alias; the library build continues to
use TypeScript 7. `check:package` separately installs TypeScript 5.7.3 in its
temporary consumer to verify the minimum supported declarations without changing
the repository's compiler. See [compatibility](docs/compatibility.md).

### Release and consumer verification

`npm run check:example` packs the library, installs it into a temporary copy of
`examples/`, checks its types, builds the gallery, and exercises the installed consumers
in Chromium, Firefox, and WebKit. Both `check:package` and `check:example` accept an existing
archive path after `--`, so release checks can reuse exactly the archive being shipped.

From a clean committed checkout, run `npm run prepare:release` for all source checks,
all three demo browser suites, package-consumer checks, and the standalone example. It
writes `artifacts/smithkit-0.5.0.tgz` and `artifacts/release-manifest.json`, containing
the commit, SHA-256, npm integrity, and archive sizes. Nothing is published.
Install all three engines first with `npx playwright install chromium webkit firefox`.
`PLAYWRIGHT_CHANNEL=chrome` can select installed Chrome for local checks; the script
clears that override when running WebKit and Firefox.

CI and the release workflow use this same command. The release workflow also has
a manual dispatch: leave `release_tag` empty to verify only, or set an existing
release tag on the default branch to retry its publication with the current workflow.

## Public API report

[docs/api/smithkit.api.md](docs/api/smithkit.api.md) is the generated signature
baseline for the package's root entry point. [API Extractor](https://api-extractor.com/pages/setup/configure_api_report/)
analyzes the freshly emitted `dist/lib/index.d.ts` and its referenced declarations.
It records exported classes, constructors, overloads, properties, enums, interfaces,
and type aliases. Private implementation members are excluded. Local types exposed
through a public signature must also be exported from `src/index.ts`; forgotten
exports fail the check, including during an explicit report update.

When changing public API:

1. Update the source, examples, and relevant documentation.
2. Run `npm run api:update` and inspect `git diff -- docs/api/smithkit.api.md`.
3. Include the report in the same PR, explain the compatibility impact, and update
   the changelog/migration guide as required by [the API policy](docs/api-review.md).
4. Run `npm run check`. It includes `api:check`, so both CI and release verification
   reject a missing or outdated report without overwriting the tracked baseline.

Both API commands rebuild declarations first, preventing a stale `dist/` from
hiding source changes. Candidate reports are written to ignored `dist/api-report/`.
The generated baseline uses API Extractor's own formatting and LF line endings;
Prettier intentionally skips it. Do not edit it manually or use `api:update` to
approve changes blindly. Updating the report is an explicit review step, not an
automatic determination that a change is compatible.

The report detects declaration changes, not behavior, performance, numerical
accuracy, or styling changes. Existing consumer/runtime tests remain required.
Neither the report nor the extraction tool is shipped as runtime package content;
the ESM modules and declarations remain separate, unchanged build products.

API Extractor uses its bundled TypeScript engine to read emitted declarations.
Its newer-compiler notice is expected with our TypeScript 7 / TypeScript 6 aliases;
compiler diagnostics are still checked. Native builds and consumer compilation
select `@typescript/native` explicitly because transitive tools can also install
an executable named `tsc`.

## Architecture

See the [architecture diagram and component boundaries](docs/architecture.md) for
a visual overview of the library.

```text
src/
  index.ts                 public package exports
  Smith.ts                 public API, trace/marker identities, RF readings and events
  measurements.ts          trace/marker type contracts
  MarkerMeasurements.ts    stateless marker comparisons
  SmithFormatter.ts        stateless numeric and complex formatting
  samples.ts               trace input contract
  layers.ts                public layer contracts
  math/                    complex arithmetic and geometry types, independent of the DOM
  rf/                      readings, conversions, components, and renormalization
  grid/                    grid definitions, labels, renderers, and layer controls
  appearance/              shared presets, validation, and scoped SVG presentation tokens
  rendering/               internal chart renderers; SVG composition, view and lifecycle
  svg/                     reusable SVG primitives and coordinate scaling
  traces/                  sample/marker state, trace rendering, and their coordinator
  interaction/             mouse gestures and chart cursor
  scales/                  independent parameter-scale renderer and definitions
  io/                      Touchstone reflection import/export, independent of the UI
demo/                      application UI, CSS, and file handling
tests/                     unit, deployment, and browser tests
scripts/                   library build and demo deployment tools
```

`src/index.ts` exposes the library API without starting the demo. `index.html`
and `demo/main.ts` are the demo entry points. Keep file selection and other
application controls in the demo; parsers and calculations belong in the library.

`Smith` delegates the square chart SVG, zoom transform, resize observation, and
SVG export to the internal `SvgChartRenderer`. `SmithScales` mounts
its own responsive container; the demo connects it to cursor events. Keep scale
rendering outside the chart transform and RF scale mappings in `RadialScaleDefinitions.ts`.
The demo throttles moving cursor/marker readouts to one update per 33 ms, using
the latest position even during continuous movement. Clearing readouts and
switching tabs cancel pending updates and render immediately. `SmithScales.update`
remains synchronous for library consumers.

`TraceModel` validates and copies samples and selects marker samples without a DOM.
`TraceRenderer` draws lines and points, including viewport-based point reduction.
`SmithData` connects the model to draggable SVG markers and coalesces marker events.
Keep sample-selection rules in the model so they can be tested without a browser.
Trace redraws replace their SVG group in place to preserve the order of overlapping traces.

RF transformations reuse `Complex.div()` for division and reject non-finite results.
Their analytic imaginary numerator remains in the RF layer to avoid cancellation in
Smith-chart conversions. Internal folder paths are not package entry points;
consumers continue to import from `smithkit`.

The library build uses TypeScript to emit ESM JavaScript and declarations with
matching paths. Relative source imports use `.js` extensions so consumers can
resolve emitted files with both NodeNext and bundler module resolution. D3 remains
a package dependency. `@types/d3` is also a dependency because public declarations
reference D3 types. Demo CSS is not part of the library, which renders SVG directly.

## Conventions

Use English for documentation, code comments, UI labels, descriptions, and error
messages. Use descriptive private fields without a leading underscore. Keep public
names and units consistent. During 0.x development, document breaking changes in a
minor release and fixes in a patch release. Update the demo, tests, and public
examples together when changing API behavior.

Organize library behavior in classes: instance methods own state and lifecycle;
static methods group stateless domain operations. Keep helpers private to their
owning class, use class names for their filenames, and leave types/interfaces as
plain contracts. Local callbacks and closures remain appropriate for events,
mapping, and rendering. ESLint rejects module-level function declarations and
function-valued variables in `src/`.

Public stateless operations are grouped under `RfCalculations`, `Touchstone`,
`SmithFormatter`, and `MarkerMeasurements`. The class API replaces the 0.1.x
standalone exports and must ship in a minor release; see [the migration guide](docs/migration-0.2.md).

Always use braces for control-flow bodies, including single-line guards and loops.
The ESLint `curly` rule enforces this; Prettier formats the resulting blocks.

ESLint uses a flat configuration in `eslint.config.mjs` with recommended JavaScript
and TypeScript rules, browser/Node globals for the relevant files, and a rule
forbidding leading underscores on private fields. Prettier owns formatting;
`eslint-config-prettier` disables conflicting lint rules. Formatting uses two-space
indentation, single quotes, semicolons, trailing commas, and a 100-column print width.
Generated output and dependency directories are ignored. The npm lockfile is also
excluded from Prettier because npm maintains its formatting.

Run `npm run lint:fix` and `npm run format` before `npm run check`. CI runs the same
checks and rejects lint warnings or formatting differences. No Git hooks are required.

### TypeScript tooling compatibility

The `@typescript/native` npm alias provides TypeScript 7, invoked explicitly by
our build and type-check scripts. The `typescript` alias points to
`@typescript/typescript6`, which supplies the compiler API required by
`typescript-eslint`. This follows Microsoft's
[side-by-side setup](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0).
Keep both aliases until ESLint's TypeScript tooling supports the new compiler API;
do not replace the compatibility package with TypeScript 7 directly.

For documentation-only changes, review links and examples and run
`git diff --check`. For code changes, run `npm run check` and relevant browser
tests. For package changes, pack the library and install the archive in a separate
consumer project to verify runtime imports and TypeScript declarations.

## Pull request workflow

Create a feature branch from `main`, commit and push to that branch, and open a
pull request targeting `main`. Do not push changes directly to `main` or merge a
pull request without an explicit request. Include the behavior change and relevant
validation in the PR description. CI runs checks for PRs; demo deployment follows
only after changes reach the default branch.

## Complex-number validation

`tests/complex.test.ts` covers arithmetic at extreme finite magnitudes, logarithms, roots, hyperbolic and reciprocal
operations, their principal branches, signed zeros, poles, and large/small finite
arguments. Independent expected values are stored in
`tests/fixtures/complex-reference.json` and generated with Python's standard
[`cmath`](https://docs.python.org/3/library/cmath.html) module. Python is not needed
for the normal test suite. To regenerate the fixtures:

```sh
python3 scripts/generate-complex-reference.py
npx prettier tests/fixtures/complex-reference.json --write
npm test -- tests/complex.test.ts
```

The generator explicitly preserves signed zeros when forming `1/z` for inverse
reciprocal functions, because Python's complex division can discard them. Reference
comparisons use relative error for nonzero components, so tiny values are tested
rather than hidden by a blanket absolute tolerance. Other transcendental operations still need broader numerical coverage.

## Packaging and releases

See [the API review and compatibility policy](docs/api-review.md) for API decisions, units,
identity and lifecycle contracts, and remaining release considerations.

`npm pack` runs the library build through `prepack`. Only `dist/lib/`, the README,
the license, and package metadata are included. Demo assets and internal instructions
are excluded. Building the library does not clear the demo output, and vice versa.

Before publishing a release, verify the package name, ownership, version, API
compatibility, and package contents. A local build or pack does not publish anything
to npm. Run `npm run check:package` to automate isolated consumer verification. CI runs
this check too. The release workflow publishes verified archives using npm trusted
publishing; publisher configuration and the release procedure are described in
[docs/releases.md](docs/releases.md).

## Known technical debt

- Grid labels use screen-space collision handling in
  `src/svg/LabelLayout.ts`. Changes to fonts, label priorities, or grid definitions
  need visual checks at small and large sizes, including combined impedance and
  admittance layers. Peripheral scales preserve complete lettering in two outlined
  bands; at extremely small sizes their text shrinks with the geometry. Independent
  radial scales use a separate layout.
- Reference impedances are positive real ohm values. Complex reference impedances,
  full multiport matrices/renormalization, noise blocks, and Touchstone 2.x are not
  supported. Touchstone 1.x import extracts S11 or S22 from two-port files; export
  writes a single reflection trace as `.s1p`. The demo can renormalize imported
  reflection data and existing traces using the public library helpers.

## Demo hosting

The demo is published from this repository to https://rosek86.github.io/smithkit/
using GitHub Pages. See [docs/deployment.md](docs/deployment.md) for workflow setup
and verification.

## API documentation

`npm run build:docs` rebuilds the public declarations with the native compiler,
then TypeDoc reads only `dist/lib/index.d.ts` using its compatible TypeScript API.
It generates reference pages and searchable guides from `docs/guide/` in
`public/api/`. That generated directory is ignored by Git and excluded from npm.
Do not edit the generated HTML or include private implementation classes.

`npm run dev` generates the documentation before starting Vite; open `/api/` or
use the demo navigation. After editing guides or API comments, rerun
`npm run build:docs` and refresh. `npm run build:demo` regenerates and copies the
site to `dist/demo/api/`, so the existing Pages workflow publishes it with the demo.
The hosted documentation tracks `main`, not a versioned npm archive.

Use relative Markdown links between guides and `{@link Smith.setOptions}`-style
references for public symbols. TypeDoc resolves these to HTML links. Its warnings
fail the build. Document titles determine their generated filenames; keep incoming
links from README/examples in sync when renaming a title. Full-demo builds rewrite
hosted API links in the examples to the local site; standalone examples keep the
hosted links.

`check:package` compiles every `ts` code block in README and the guides against
the installed package, with TypeScript 5.7.3 and the native compiler. Each block is
checked independently; snippets may refer to an existing `chart` and `traceId`.
The browser documentation checks cover search, deep links, assets, and responsive
navigation. The API Extractor report remains a separate signature-change gate.

## Hosted integration examples

`examples/` is both a standalone Vite consumer and part of the demo's multi-page
build. The root build aliases `smithkit` to `src/index.ts` so PR previews exercise
the current library. The standalone examples have no source alias and import the
installed package; `check:example` copies them outside this repository and verifies
the packed library in Chromium, Firefox, and WebKit.

Add new pages to the input lists in both Vite configurations and to gallery checks.
Each page should focus on one task. `page.ts` displays `main.ts?raw`, so the shown
TypeScript is the exact integration code being executed. Keep sample data and
controls local to each example; avoid building application workflows into the demo.

## Performance diagnostics

Run `npm run benchmark:traces` for large-series add/update, marker, and zoom timings.
See [the benchmark methodology and comparison](docs/performance.md) for workload limits
and options. Benchmarks are diagnostic; browser correctness tests do not impose
hardware-dependent timing thresholds.

Run `npm run benchmark:workloads -- /tmp/smithkit-workloads.json` for deterministic
noisy data, multiple traces, isolated and interactive marker selection, and Chromium
memory checks across repeated updates and destruction. See
[the workload methodology and decision](docs/performance-workloads.md) before
interpreting results or enabling the bounded-data arithmetic experiment.
