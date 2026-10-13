---
title: Getting started
group: Guides
---

# Getting started

Reference: {@link Smith}.

## Quick start

Give the container an explicit size and run the code after it is mounted:

```html
<div id="smith" style="width: 100%; max-width: 700px; aspect-ratio: 1;"></div>
```

```ts
import { Smith } from 'smithkit';

const chart = new Smith({ referenceImpedanceOhms: 50 }); // Reference impedance in ohms; defaults to 50.
chart.draw('#smith');
const traceId = chart.addTrace(
  [
    { frequencyHz: 1e9, reflectionCoefficient: [0.5, -0.5] },
    { frequencyHz: 1.5e9, reflectionCoefficient: [0, 0] },
    { frequencyHz: 2e9, reflectionCoefficient: [0.5, 0.5] },
  ],
  { name: 'Antenna', color: '#2563eb' },
);
```

Each `TraceSample` contains `frequencyHz` and the dimensionless voltage reflection
coefficient Γ as `[real, imaginary]`. Samples are copied and validated; readonly tuples and arrays (`as const`) are accepted. Frequencies
must be finite and non-negative; both coordinates must be finite. A trace must
contain at least one sample.

Traces start without markers. Call `chart.addMarker(traceId)` to add one at the
first sample, or pass a sample index to choose its initial position. Drag markers to select
samples with a mouse or touch. Enable zoom to scroll to zoom and drag the chart to pan. Markers
and their focus indicators stay above grid labels and sample points. `chart.resetView()` restores the initial view, including peripheral rulers.

Construct `Smith` only in a browser, such as your framework's mount hook. Importing
the package and using its calculation or parsing methods does not require a DOM.

The default chart is a static presentation: standard impedance grid with labels,
no peripheral scales, and zoom and cursor tracking disabled. Markers are optional
and remain interactive when explicitly added.

Enable interactions through constructor options or the corresponding setters:

```ts
import { Smith } from 'smithkit';

const chart = new Smith({ interaction: { zoom: true, cursor: true } });
chart.draw('#smith');

chart.setZoomEnabled(false); // Freeze the current view; page scrolling is unaffected.
chart.setCursorEnabled(false); // Hide cursor geometry and cancel pending readings.
```

Zoom controls wheel/double-click zoom and mouse/touch panning and pinch gestures;
it is independent of cursor tracking and marker interaction. `resetView()` remains
available with zoom disabled. Disabling during an active gesture freezes the view
while that gesture finishes normally.

Cursor tracking controls the cursor overlay and `Cursor` events. Disabling it
clears the current readout with one `Cursor` event carrying `undefined`, cancels
queued readings, and suppresses further cursor events. Enabling waits for a new
pointer movement. The last `cursorReading` remains available; marker controls and
events work independently.

`draw(selector | HTMLElement)` moves the existing SVG when called again. A missing
container throws. Call `chart.destroy()` on unmount; it removes the SVG, releases
event handlers, and cancels queued notifications. Repeated destruction is safe.
