---
title: SVG and PNG export
group: Guides
---

# SVG and PNG export

Reference: {@link SmithImageExportOptions}, {@link ScaleImageExportOptions}, {@link MarkerLegendOptions}.

## PNG and report export

`chart.toPng(options?)` and `scales.toPng(options?)` return `Promise<Blob>` with MIME
type `image/png`. Call them in a browser after mounting the components at non-zero
sizes, as with SVG export. The current view, labels, colors, markers, and scale
readings are captured without modifying the live components.

```ts
import { SmithScales } from 'smithkit';

const scales = new SmithScales();
scales.draw('#scales');
const png = await chart.toPng({ width: 3200, background: 'white', legend: true });
// Use the Blob with your application's download, preview, or upload flow.
const report = await chart.toPng({ width: 2400, scales, legend: true });
const scalePng = await scales.toPng({ width: 1200, background: 'transparent' });
```

- `width` / `height`: output pixels. Omit both to use the snapshot's natural size;
  specify one to preserve proportions. With both set, the complete image is
  centered and fitted without distortion or cropping. Padding uses the chosen
  background, or transparency when no background is specified.
- `background`: omit to keep component backgrounds, or pass a concrete CSS color
  (for example `'#fff'`) or `'transparent'` to replace them. Chart colors stay as
  configured; choose a suitable chart theme for your report background.
- `lineDetail` (chart only): `'full'` (default) includes every sample in each trace line;
  `'view'` preserves the currently displayed line geometry, including simplification.
  Both work for SVG and PNG without changing the live chart. Increasing export dimensions
  scales the current-view error too; use `'full'` for reports requiring all samples.
  This option does not change point culling, the viewport, markers, or scales.
- `legend` (chart only): append the names and colors of visible traces. Long names
  wrap; hidden traces are omitted. Default: `false`.
- `markerLegend` (chart only): independently append marker descriptions below the chart/scales.
  Default: `false`. `true` includes every marker of visible traces, with trace name,
  marker number, frequency, and impedance. Use an options object to select `markerIds`
  and `fields` (`frequency`, `impedance`, `admittance`, `reflectionCoefficient`, `vswr`,
  `returnLoss`). Fields use Hz with SI prefixes, Ω, mS, dimensionless Γ, VSWR ratios,
  and dB respectively. Empty `markerIds` selects none; empty `fields` keeps only names
  and marker numbers. Hidden traces are always omitted, duplicate selections appear
  once, and unknown IDs/fields throw. Long descriptions wrap. Readings are captured at
  export invocation, without moving markers or changing the live view.
- `scales` (chart only): a mounted `SmithScales` instance to place centered below the chart.
  Its current responsive layout and readings are preserved. Use `scaleReadout` to
  export a specific reading independently of the live view.

```ts
// Works with toSvg() as well. Trace and marker legends are independent.
const png = await chart.toPng({
  legend: false,
  markerLegend: {
    fields: ['frequency', 'impedance', 'vswr'],
    // Omit markerIds to include all markers of visible traces.
  },
});
```

Dimensions must be positive integers, at most 8192 px per side and 32 megapixels
in total. Invalid options and unavailable/destroyed components reject the promise.
PNG export uses browser SVG decoding and Canvas 2D and releases temporary image URLs.
Fonts must be available to the browser; external font files are not embedded.
Export size increases resolution; it does not change the current label density.

The demo's **Export** dialog supports chart, scales, or a combined report,
custom dimensions/background, and independent trace and marker legends. **Include marker legend** reveals field and marker checkboxes; it is disabled for scales-only exports. The default output width is 3200 px. Choose PNG or SVG in the same dialog; both formats support these report options. The demo starts in dark mode. For exports containing parameter scales, **Scale readings** explicitly selects a marker or **None**, independently of the Cursor/Marker tab. Marker exports include the trace name, marker number, and frequency; cursor readings are not exported.

To export a specific scale reading without changing the live view, pass `readout` to
`scales.toSvg()` / `scales.toPng()`, or `scaleReadout` to a combined chart export:

```ts
import { Complex, SmithScales } from 'smithkit';

const scales = new SmithScales();
scales.draw('#scales');
const report = await chart.toPng({
  scales,
  scaleReadout: {
    reflectionCoefficient: Complex.from(0.2, 0.3),
    label: 'Antenna · Marker 1 · Frequency: 1 GHz',
  },
});
```

Use `{ reflectionCoefficient: null }` for scales without readings. Omit the override to
preserve the current readings. Labels wrap to fit the exported scales.

## SVG export

`chart.toSvg(options?)` and `scales.toSvg(options?)` return SVG strings synchronously.
They accept the same `SmithImageExportOptions` / `ScaleImageExportOptions` as PNG export,
including size, background, legend, and scales. Omitting options is equivalent to
passing `{}`: both use the natural snapshot size and enforce the same output limits.
Call them after `draw()`
while the component is mounted and has a non-zero rendered size; exporting before
mounting, from a `display: none` container, or after destruction throws an error.

```ts
const svg = chart.toSvg();
const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'smith-chart.svg';
document.body.appendChild(link);
link.click();
link.remove();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

The chart export preserves the current zoom/pan, layer visibility, labels, traces,
markers, and visible indicators. It captures the rendered points, including dense
trace point reduction; it is an image export, not a measurement-data export.
The scale export combines all twelve axes into one SVG using their current layout
and displayed readings. Use the `readout` or `scaleReadout` override to capture a marker independently
of the current live scale reading.

Files have explicit pixel dimensions and preserve the configured component background
(transparent by default). Presentation
styles are inlined so the application's stylesheet is not required. Text remains
editable, and curved captions retain their internal path references. Font files
and surrounding HTML controls/backgrounds are not embedded. Downloading is the
consumer's responsibility; the library does not create files or modify live nodes.
In the demo, choose **Export → Format → SVG**, then select chart, scales, or the combined report.
