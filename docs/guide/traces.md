---
title: Traces and markers
group: Guides
---

# Traces and markers

Reference: {@link TraceInput}, {@link TraceOptions}, {@link MarkerSnapshot}.

## Trace input formats

`addTrace()` and `updateTrace()` accept the same `TraceInput` union:

- `TraceSamples`: an array of objects with `frequencyHz` and `reflectionCoefficient`.
- `readonly TraceTuple[]`: `[frequencyHz, re, im]` tuples, including `as const` arrays.
- `Float64Array`: packed triples in the order `f, re, im, f, re, im, …`.

In every format, frequency is in **Hz** and `re`/`im` are the dimensionless
voltage reflection coefficient **Γ**, relative to the chart's reference impedance.
A single input must use one format throughout; mixed tuples and objects are rejected.
Typed-array views are supported; only values inside the supplied view are copied.
The packed length must be a positive multiple of three. All formats use the same
finite-value checks and retain input order, duplicate frequencies, and full sample precision.

```ts
import { Smith, type TraceTuple } from 'smithkit';

const chart = new Smith();
chart.draw('#smith');
const samples: readonly TraceTuple[] = [
  [1e9, 0.4, -0.4],
  [1.5e9, 0, 0],
  [2e9, 0.4, 0.4],
];
const traceId = chart.addTrace(samples, { name: 'S11', mode: 'line' });

// A later update may use a different format. Each triple is one sample.
chart.updateTrace(traceId, new Float64Array([1e9, 0.3, -0.3, 1.5e9, 0, 0, 2e9, 0.3, 0.3]));
```

For large datasets, fill the packed array directly to avoid creating intermediate
objects or tuples:

```ts
import { Smith } from 'smithkit';

const count = 100_000;
const samples = new Float64Array(count * 3);
for (let i = 0; i < count; i++) {
  samples[3 * i] = 1e9 + i * 1e4;
  samples[3 * i + 1] = 0.7 * Math.cos((i / count) * 10);
  samples[3 * i + 2] = 0.7 * Math.sin((i / count) * 10);
}
const chart = new Smith();
chart.draw('#smith');
const traceId = chart.addTrace(samples, { mode: 'points' });
chart.addMarker(traceId, count - 1);
```

All inputs are copied into owned packed storage (24 bytes per sample for the numeric
payload). Modifying the input after adding or updating a trace does not change the
chart. Marker readings and events keep their existing object shape. `Touchstone.parse()` returns object samples by default, or packed triples with
`output: 'packed'`. `RfCalculations.renormalizeSamples()` preserves object or packed
representation.
Invalid replacements leave data, markers, and rendering unchanged.

For more than 5,000 samples, point rendering groups overlapping points into screen
cells and skips offscreen points; markers still select from the full data. Lines
retain every sample by default; opt into pixel-based simplification with
`lineTolerancePx` as described under [trace appearance](#trace-appearance).
Sorted ascending frequencies accelerate frequency selection; unsorted inputs remain
supported without reordering. There is no interpolation or reduction of the stored measurements.

## Traces and markers

Trace and marker IDs are opaque strings, unique within a chart and never reused
there. They survive renaming, hiding, updating samples, and removing other items.
They are not persistent across chart instances or page reloads.

```ts
const markerA = chart.addMarker(traceId)!; // First sample.
const markerB = chart.addMarker(traceId, 2)!; // Zero-based sample index.

chart.setTraceOptions(traceId, { name: 'Tuned antenna', visible: true });
chart.setMarkerSample(markerB, 1);
console.log(chart.getMarker(markerB)?.frequencyHz); // 1.5e9

const difference = chart.compareMarkers(markerA, markerB);
console.log(difference?.frequencyDeltaHz); // B − A, in Hz.
console.log(difference?.impedanceDeltaOhms?.toVector());
console.log(difference?.phaseDeltaDegrees);

chart.removeMarker(markerB);
```

| Method                                | Result / behavior                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `addTrace(samples, options?)`         | Returns a trace ID, without creating markers. Options: nonblank `name`, solid CSS `color`, and `visible`.                |
| `getTraces()`                         | Detached `TraceInfo` snapshots: ID, name, color, visibility, sample count, and marker metadata.                          |
| `setTraceOptions(id, options)`        | Updates the supplied options only. Invalid options throw before any change.                                              |
| `updateTrace(id, samples, options?)`  | Replaces samples and preserves identity, appearance, and markers. Empty/invalid input throws without changing the trace. |
| `removeTrace(id)`                     | Removes the trace and its markers.                                                                                       |
| `clearTraces()`                       | Removes all traces and their markers.                                                                                    |
| `addMarker(traceId, sampleIndex = 0)` | Returns a marker ID, or `undefined` if the trace is missing.                                                             |
| `getMarker(id)`                       | Returns a `MarkerSnapshot`, or `undefined` if missing.                                                                   |
| `focusMarker(id)`                     | Moves keyboard focus to a mounted, visible marker; returns `false` if missing or not focusable.                          |
| `setMarkerSample(id, sampleIndex)`    | Selects an existing sample and queues a marker notification.                                                             |
| `removeMarker(id)`                    | Removes one marker without renumbering the remaining markers.                                                            |
| `compareMarkers(a, b)`                | Returns B − A, or `undefined` if either marker is missing.                                                               |
| `referenceImpedanceOhms`              | Read-only reference impedance. Must be positive and finite.                                                              |

Update/remove methods return a boolean: `false` means the ID was not found.
Sample indices must be zero-based integers within the trace; invalid indices throw
`RangeError`. Sample replacement follows the nearest measured frequency by default.
Pass `{ markerSelection: 'sample-index' }` to retain indices (clamped to the new last
sample if the trace shrinks), or `{ markerSelection: 'reflection' }` to select the
nearest Γ. Frequency and Γ ties select the earlier sample in input order, including
unsorted sweeps and duplicate frequencies. Selection uses the actual selected sample,
not a previous requested frequency. No interpolation is performed.

```ts
chart.updateTrace(
  traceId,
  [
    { frequencyHz: 1e9, reflectionCoefficient: [0.2, 0] },
    { frequencyHz: 2e9, reflectionCoefficient: [0.3, 0] },
  ],
  { markerSelection: 'frequency' },
);
```

Invalid strategies throw `TypeError`; empty or invalid samples throw `RangeError`
before mutation. Unknown trace IDs return `false` without validating input.
Renormalization always preserves sample indices because it transforms the existing
sweep rather than replacing it.

Trace snapshots contain `markers: { id, number, sampleIndex }[]`. `number` is the
stable display number within that trace. A `MarkerSnapshot` includes the common
[RF reading fields](events.md#events-and-readings) plus `traceId`, `markerId`, `markerNumber`, `sampleIndex`,
and `frequencyHz`.

Hiding a trace hides its points and markers while retaining measurements for
comparisons. Hiding or deleting a dragged marker/trace ends the drag. Mutations
after destruction throw; trace/marker lookups return empty or missing results.

## Trace appearance

Pass `mode: 'points' | 'line' | 'both'`, `lineWidth`, `pointRadius`, and `lineTolerancePx` to
`addTrace` or `setTraceOptions`. Defaults are points, 2 px line width, and 2 px point radius. Both sizes are
CSS pixels and remain constant under chart zoom and container resize. Widths and radii must be positive and finite.
`getTraces()` includes the current style.

By default, lines connect all samples in input order, without smoothing or frequency sorting.
A line-only trace creates one SVG path and no sample circles, suitable for dense
sweeps. Points/both render every sample for traces up to 5,000 samples. Larger traces
render one representative per point-radius-sized display cell and skip points
outside the viewport; representatives are recalculated during zoom/pan.
This only simplifies the image: all original samples remain available to markers,
snapping, readouts, and comparisons.
Styles do not change marker identity or layer ordering. Hidden traces retain their style after sample replacement.
The demo exposes the same controls per trace.

For dense lines, opt into `lineTolerancePx` (finite, non-negative; default `0` disables
simplification):

```ts
chart.setTraceOptions(traceId, { mode: 'line', lineTolerancePx: 0.5 });
```

The tolerance bounds additional geometric deviation in **CSS pixels**, accounting for
chart zoom and container size. It does not include SVG coordinate rounding or browser
antialiasing. Cached, nested geometry levels retain endpoints and input order; zooming
in selects finer geometry, while panning reuses the current level. The cache is rebuilt
when samples change, including reference-impedance renormalization. Markers, frequency
selection, RF calculations, and sample counts always use the full data. The option
applies to the line in `line` and `both` modes; point rendering is unchanged.

Preparing levels takes extra CPU and memory, and noisy traces may simplify very little.
This is an opt-in display optimization, not data compression. See the
[large-trace example](https://rosek86.github.io/smithkit/examples/large-trace/) to compare
full geometry with pixel tolerances and [local measurements](https://github.com/rosek86/smithkit/blob/main/docs/performance.md).

## Selecting a marker by frequency

`chart.setMarkerFrequency(markerId, frequencyHz)` selects the nearest measured
frequency and returns `true`, or `false` if the marker does not exist. It accepts
finite, non-negative Hz values; other values throw `RangeError`. It works with
unsorted sweeps and duplicate frequencies. Equal-distance ties choose the earliest
sample in input order. Requests outside the sweep select the nearest endpoint.
No interpolation or sample reordering is performed.

Read `chart.getMarker(markerId).frequencyHz` for the actual selected frequency.
The same queued `Marker` event is emitted as for sample-index selection, and
comparisons update accordingly. The demo accepts MHz and shows the selected
measurement frequency; dragging and sample selection keep that field synchronized.

## Keyboard and touch markers

Use Tab/Shift+Tab to focus a marker. Arrow keys move through samples in input order;
Right/Up advances and Left/Down goes back. Shift+Arrow or Page Up/Down moves ten
samples, and Home/End selects the first/last sample. Navigation clamps at the ends
and also works when chart zoom is disabled. A single-sample trace remains focusable
for reading, with its slider marked disabled.

A focused marker has a contrasting outline and exposes its trace name, marker
number, sample position, and frequency to assistive technology. Hidden traces are
excluded from keyboard focus. `chart.focusMarker(id)` allows a separate marker
selector to focus the matching chart control. The demo provides a **Focus on chart**
button beside its marker selector.

Markers have a 44 CSS px circular hit area and an 18 CSS px triangle, kept constant
through zoom and container resizing. A marker touch gesture does not pan the chart;
cancelling it releases the drag state. Touch target areas may overlap for nearby
markers; use keyboard focus or the demo selector to reach an obscured marker.
