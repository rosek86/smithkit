# Smithkit

**`smithkit`** is a framework-independent JavaScript and TypeScript library for
interactive SVG Smith charts, RF calculations, and S11 measurement exploration.

[![Smithkit in dark mode: a Smith chart with one orange trace, a marker, and active cursor readings on the parameter scales.](https://raw.githubusercontent.com/rosek86/smithkit/main/docs/images/smithkit-preview.png)](https://rosek86.github.io/smithkit/)

[API documentation](https://rosek86.github.io/smithkit/api/) · [Try the interactive demo](https://rosek86.github.io/smithkit/) or browse the
[integration examples](https://rosek86.github.io/smithkit/examples/index.html):
static charts, marker controls, a 100,000-sample trace, themes, report exports, React/Angular components, and lifecycle cleanup.
Each example includes its TypeScript source.

## Features

- Labeled resistance, reactance, conductance, and susceptance grids.
- Configurable constant-Q and constant-VSWR circles.
- Zoom, pan, view reset, and cursor readings.
- Named traces with colors, visibility, and keyboard/touch/mouse markers that snap to samples.
- Marker comparisons: frequency, complex impedance, and wrapped phase differences.
- Physical impedance/admittance conversions and DOM-independent RF readings.
- Twelve parameter scales mounted independently of chart zoom.
- Four peripheral rulers for phase and electrical length.
- Touchstone 1.x `.s1p` / `.s2p` reflection import (RI/MA/DB), packed output, and `.s1p` export.
- Standalone SVG and configurable PNG export of the chart and radial scales.
- ESM modules and TypeScript declarations.

## Installation

Install from npm:

```sh
npm install smithkit
```

Browser applications need SVG, ES2022, and an ESM-compatible build tool.
The checked TypeScript minimum is 5.7.3. See the
[browser and framework compatibility](https://github.com/rosek86/smithkit/blob/main/docs/compatibility.md)
for tested environments and build targets.
No library stylesheet is required. To build the library from source, see
[Contributing](https://github.com/rosek86/smithkit/blob/main/CONTRIBUTING.md).

For a complete application using the installed package, see the
[standalone integration example](https://github.com/rosek86/smithkit/tree/main/examples/basic).
It demonstrates mounting, replacing samples, event subscriptions, resizing, and cleanup.
Copyable [React](https://rosek86.github.io/smithkit/examples/react/index.html) and
[Angular](https://rosek86.github.io/smithkit/examples/angular/index.html) components
cover the same lifecycle through framework props/inputs.

For upgrades from earlier versions, see the
[migration guide](https://github.com/rosek86/smithkit/blob/main/docs/migrations.md).

## Quick start

Mount a container with a non-zero size:

```html
<div id="smith" style="width: 100%; max-width: 700px; aspect-ratio: 1;"></div>
```

```ts
import { Smith } from 'smithkit';

const chart = new Smith('#smith', { referenceImpedanceOhms: 50 });
const traceId = chart.addTrace(
  [
    [1e9, 0.5, -0.5],
    [1.5e9, 0, 0],
    [2e9, 0.5, 0.5],
  ],
  { name: 'Antenna', color: '#2563eb', mode: 'line' },
);

// Optional: enable interaction and add a marker explicitly.
chart.setOptions({ interaction: { zoom: true, cursor: true } });
chart.addMarker(traceId, 1);

// On component unmount: chart.destroy();
```

Each tuple is `[frequencyHz, realGamma, imaginaryGamma]`. Object samples and
packed `Float64Array` triples are also supported. Inputs are validated and copied.

By default, the chart shows a labeled standard impedance grid with zoom, cursor
tracking, and peripheral scales disabled. No markers are added automatically.
The constructor and `setOptions()` share the same grouped configuration schema.
To mount later, use `new Smith(options)` and then `chart.draw(elementOrSelector)`.

Create charts in the browser after mounting the host; call `destroy()` on unmount.
Calculation, formatting, and Touchstone classes also work without a DOM.

## Documentation

The [searchable API documentation](https://rosek86.github.io/smithkit/api/) combines
usage guides with generated reference pages for every public class, method, and type.
The hosted site follows `main`; consult the installed package's declarations when
using an older release.

| Topic                                                    | Guide                                                                                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Mounting, resizing, cleanup                              | [Getting started](https://rosek86.github.io/smithkit/api/documents/Getting_started.html)             |
| Constructor options, runtime patches, themes, layers     | [Configuration](https://rosek86.github.io/smithkit/api/documents/Configuration.html)                 |
| Data formats, trace styling, markers, keyboard and touch | [Traces and markers](https://rosek86.github.io/smithkit/api/documents/Traces_and_markers.html)       |
| Subscriptions, event timing, readouts and units          | [Events and readings](https://rosek86.github.io/smithkit/api/documents/Events_and_readings.html)     |
| Radial and peripheral scales                             | [Scales](https://rosek86.github.io/smithkit/api/documents/Scales.html)                               |
| Complex arithmetic, conversions and renormalization      | [RF calculations](https://rosek86.github.io/smithkit/api/documents/RF_calculations.html)             |
| S11/S22 import, packed parsing, one-port export          | [Touchstone](https://rosek86.github.io/smithkit/api/documents/Touchstone.html)                       |
| SVG/PNG, dimensions, backgrounds, scales and legends     | [Report export](https://rosek86.github.io/smithkit/api/documents/SVG_and_PNG_export.html)            |
| React and Angular lifecycle integration                  | [Framework integration](https://rosek86.github.io/smithkit/api/documents/Framework_integration.html) |

## Development and license

See [CONTRIBUTING.md](CONTRIBUTING.md) for development, testing, release, and demo
hosting instructions. Licensed under [MIT](LICENSE).
