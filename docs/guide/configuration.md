---
title: Configuration
group: Guides
---

# Configuration

Reference: {@link SmithOptions | configuration fields}, {@link Smith.setOptions | runtime patches}, {@link ChartLayers | layer controls}.

## Constructor configuration

`new Smith(options?)` and `new Smith(target, options?)` accept a typed `SmithOptions`
object. Every configuration field is optional:

```ts
import { Smith } from 'smithkit';

const chart = new Smith({
  referenceImpedanceOhms: 75,
  appearance: { theme: 'dark' },
  interaction: { zoom: false },
  peripheralScales: { visible: false },
  grid: {
    detail: 'basic',
    labelsVisible: true,
    style: { line: { majorWidth: 1.5 } },
    layers: {
      resistance: { style: { line: { color: '#60a5fa' } } },
      reactance: { labelsVisible: false },
      conductance: { visible: true, detail: 'standard' },
    },
  },
  circles: {
    q: { visible: true, values: [1, 2, 5] },
    vswr: { visible: true, values: [2, 3], style: { line: { color: '#fbbf24' } } },
  },
});
chart.draw('#smith');

// Update all four grids together, including hidden admittance layers.
chart.setGridDetail('standard');
// Individual overrides remain available.
chart.layers.reactance.setDetail('basic');
```

Configuration is grouped by responsibility:

| Group                    | Purpose                                                                                            | Runtime API                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `referenceImpedanceOhms` | Physical reference impedance                                                                       | `renormalize()`                                                    |
| `appearance`             | Theme, fonts, colors, marker/cursor styling                                                        | `setAppearance()`                                                  |
| `interaction`            | `zoom` and `cursor` tracking switches                                                              | `setZoomEnabled()`, `setCursorEnabled()`                           |
| `grid`                   | Shared detail, labels, styles; `layers` overrides for resistance/reactance/conductance/susceptance | `setGridDetail()`, `layers.resistance` and the other grid controls |
| `circles`                | Independent Q and VSWR values, visibility, styles                                                  | `layers.q`, `layers.vswr`                                          |
| `peripheralScales`       | Visibility of all peripheral rulers together                                                       | `peripheralScales.setVisible()`                                    |

Defaults are 50 Ω, the light theme, zoom and cursor disabled, peripheral scales hidden,
and standard grids with labels. Resistance/reactance are visible;
conductance/susceptance and Q/VSWR circles are hidden. Q defaults to
`[0.5, 1, 2, 5, 10]`; VSWR defaults to `[1.2, 1.5, 2, 3, 5, 10]`.

Shared `grid` settings apply to all four grids; `grid.layers` overrides individual
fields afterward. Styles merge by property. Explicit layer styles override theme
colors and remain in effect when `setAppearance()` changes the theme.
Options and circle arrays are copied; changing the original object does not update
the chart. Use the existing chart/layer methods for later changes. Unknown constructor groups
or structural option names throw `TypeError`; omitted fields use defaults.

Export configuration belongs to `toSvg()`/`toPng()` calls, independently of chart
construction. `scaleReadout` requires `scales`; otherwise export throws/rejects with `TypeError`.

The constructor configures presentation and interaction. Add measurement data with
`addTrace()` and optional markers with `addMarker()`; no markers are created implicitly.
Radial parameter scales remain independently mounted `SmithScales` instances.

### Mounting during construction

When the host already exists, pass a CSS selector or an `HTMLElement` as the first
argument: `new Smith('#smith', options)` or `new Smith(element, options)`.
Options are optional: `new Smith('#smith')` mounts the default static chart.
This is equivalent to `new Smith(options)` followed by `chart.draw(target)`.
Strings are CSS selectors (use `'#smith'`, not a bare element ID).

Keep `new Smith(options)` and call `draw()` later when the host is not available
yet. A constructor target is a mounting argument, not part of `SmithOptions`:
`setOptions()` changes configuration without moving the chart. Missing containers,
invalid selectors, or invalid options throw; a failed mount releases its resources.

### Updating configuration

`chart.setOptions(options)` accepts the same `SmithOptions` type as the constructor:

```ts
chart.setOptions({
  interaction: { zoom: true },
  grid: {
    detail: 'basic',
    layers: { reactance: { labelsVisible: false } },
  },
  circles: { vswr: { visible: true, values: [2, 3] } },
});
```

This is a patch: omitted and `undefined` fields retain their current values;
`{}` groups do nothing. Shared grid settings apply to all four grids first, then
per-layer overrides in the same call. A later shared setting also replaces that
field on previously customized layers. Style fields merge; circle value lists
replace. `appearance`, when provided, replaces the preset/overrides exactly like
`setAppearance()` (it is not recursively merged with the previous appearance).

The complete patch is validated before application. Invalid settings or impossible
reference conversions leave the chart unchanged. `referenceImpedanceOhms` invokes
renormalization of existing traces and retains physical impedance and marker IDs.
Other configuration updates preserve measurements, markers, selection, and view.
Options are not retained; subsequent edits to the input object have no effect.
Individual setters remain available for focused changes.

## Appearance and themes

`Smith` and `SmithScales` accept the same appearance configuration. The default
is the light preset with a transparent background. The dark preset includes a
solid dark background so its labels remain readable when embedded or exported.

```ts
import { Smith, SmithScales } from 'smithkit';
import type { SmithAppearance } from 'smithkit';

const appearance: SmithAppearance = {
  theme: 'dark',
  overrides: {
    text: { fontFamily: 'Arial, sans-serif' },
    grid: { line: { majorWidth: 1.2 }, text: { color: '#e2e8f0' } },
    cursor: { impedance: { color: '#fbbf24' } },
    marker: { focus: { color: '#38bdf8' } },
    traces: { colors: ['#38bdf8', '#fb923c', '#a78bfa'] },
  },
};
const chart = new Smith({ referenceImpedanceOhms: 50, appearance });
const scales = new SmithScales(appearance);
chart.draw('#smith');
scales.draw('#scales');

// Update both independent components using the same configuration.
chart.setAppearance({ theme: 'light' });
scales.setAppearance({ theme: 'light' });
```

Each `setAppearance` call replaces the previous preset and overrides; omitted
settings return to the selected preset, or light when `theme` is omitted.
Nested overrides are partial. Appearance is scoped to each component and does not
change the surrounding application's CSS or other chart instances.

| Override                                               | Settings                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `background`, `text`                                   | Component background and shared `text.fontFamily`.                                          |
| `grid.line`                                            | `color`, `majorWidth`, `minorWidth`.                                                        |
| `grid.text`                                            | `color`, `fontSize`.                                                                        |
| `boundary`                                             | `color`, `width` for the Smith chart boundary.                                              |
| `circles.q`, `circles.vswr`                            | Independent `color` and `width` for each circle family.                                     |
| `scales.line`, `scales.boundary`                       | `color` for ticks/axes and peripheral band outlines.                                        |
| `scales.text`                                          | `color` and radial tick `fontSize`; the color also applies to titles and peripheral labels. |
| `scales.title`, `scales.peripheral`                    | `fontSize` for radial titles and peripheral labels.                                         |
| `scales.value`                                         | `color`, `fontSize` for readings.                                                           |
| `scales.indicator`                                     | `color`, `outline` for reading dots.                                                        |
| `cursor.point`                                         | `color`, `size` (dot diameter).                                                             |
| `cursor.impedance`, `cursor.admittance`, `cursor.line` | Axis `color` and shared line `width`.                                                       |
| `marker.text`, `marker.outline`                        | `color`; marker fill follows its trace color.                                               |
| `marker.focus`                                         | `color` and `halo` color.                                                                   |
| `traces.colors`                                        | Non-empty palette for automatically colored traces.                                         |

Colors must be solid CSS colors accepted by the library's color parser, including
hex, RGB, HSL, named colors, and `transparent`; CSS variable references are not
accepted in the configuration. Numeric values must be positive and finite.
Line widths and cursor point size are CSS pixels. Font sizes are SVG chart/scale
units and follow the existing layout; grid labels retain their adaptive minimum
size. Marker geometry and the 44 px touch target stay unchanged.

Appearance updates retain zoom, samples, marker selection/focus, layer visibility,
and scale readings. They recolor existing and future automatically colored traces.
Explicit colors passed through trace options and explicit layer styles take
precedence and survive theme changes. Applying a new appearance does not reset
those individual overrides. Invalid appearance settings throw before making changes.

SVG exports resolve the appearance without requiring theme CSS. A configured
background is included in the exported image; `transparent` preserves transparency.
The **Theme** selector in the demo's top-right header updates both library components and the demo UI.
On desktop, **Chart settings** opens beside the chart at the same height. The chart
remains interactive, including zoom and markers, while the rest of the page is
dimmed and inactive. Click the dimmed area, press Escape, or use Close to dismiss
settings. On smaller screens, settings use a modal dialog.

## Grid layers

Resistance and reactance are initially visible. Conductance, susceptance, Q,
and VSWR layers start hidden. All controls are under `chart.layers`:

```ts
chart.layers.resistance.setVisible(false);
chart.layers.reactance.setVisible(false);
chart.layers.conductance.setVisible(true);
chart.layers.susceptance.setVisible(true);
chart.layers.conductance.setDetail('standard');
chart.layers.conductance.setLabelsVisible(false);
chart.layers.susceptance.setLabelsVisible(false);
chart.layers.susceptance.setStyle({ line: { color: '#64748b' }, text: { color: '#2a7f62' } });
chart.layers.vswr.addValue(4);
chart.layers.vswr.setVisible(true);
```

The four grid layers support `setVisible`, `setLabelsVisible`, `setDetail`, and
`setStyle(GridStyleOptions)`. Styles group `line.color`, `line.majorWidth`,
`line.minorWidth` and `text.color`, `text.fontFamily`, `text.fontSize`. Widths are positive finite numbers
in CSS pixels. Font size is a positive finite base size in chart units; adaptive
layout raises it when needed to keep the font size at least 9 CSS pixels in the
default view. Partial updates retain other settings. Invalid numeric styles throw
before any property is changed.

Use `chart.setGridDetail('basic' | 'standard' | 'detailed')` for all four grid layers,
or `layer.setDetail(...)` to override one layer:

- **Basic:** complete circles and arcs for normalized values 0.2, 0.5, 1, 2, and 5,
  with matching axis/rim labels and the zero label. Intended for small or static charts.
- **Standard** (default): the full major grid and its labels, without minor lines.
- **Detailed:** the full major and minor grid.

Changing detail preserves layer visibility, styles, and the current view. Label
collision handling still applies at every level. Peripheral scales and Q/VSWR
circles are independent. The demo's **Chart settings → Grid detail** selector updates all four grid layers.

Use `setLabelsVisible(false)` to hide a grid layer's labels while keeping its lines.
Labels default to visible. The setting persists through detail, style, theme, and
whole-layer visibility changes and is included in SVG exports. Calling
`setLabelsVisible(true)` restores labels allowed by the current detail and collision
layout; it does not show a hidden layer. The **Grid labels** checkbox in the demo’s **Chart settings** dialog controls all four grid layers together. Peripheral scale labels are unaffected.

`layers.q` and `layers.vswr` support `setVisible`,
`setStyle({ line: { color?, width? } })`, `setValues`, `addValue`, and `removeValue`.
`setValues([1, 2, 5])` replaces the entire list; `setValues([])` clears it.
Input arrays are copied, duplicate values are ignored, and invalid input leaves
the previous values unchanged.
Circle stroke widths are positive finite numbers in CSS pixels.
Q values must be positive and finite; VSWR values must be finite and at least 1.
Duplicate additions and removal of absent values have no effect.

Grid labels use normalized values; readings use physical units. Strokes default
to slate gray with 1 px major and 0.6 px minor lines. Stroke widths stay constant
under zoom. Layer controls do not expose drawing objects or SVG nodes.

Grid labels adapt automatically to the chart's rendered size,
including static charts with zoom disabled. The layout prioritizes key values,
hides labels that overlap or extend beyond the default view, and prioritizes zero
and the highest labeled axis value. It recalculates on resize and layer visibility
or style changes. Zoom and pan preserve the chosen labels and scale them smoothly
with the grid. This changes only labels; grid lines and ticks remain unchanged.
SVG exports preserve the current label layout.

For small static charts, hide minor grid lines and, when unnecessary, peripheral
scales using the controls above. Very small charts necessarily show fewer values;
use a larger container for detailed readings. Peripheral labels retain their full
wording and scale with the chart. Their rulers form two outlined bands: phase
(transmission/reflection) and electrical length (toward load/generator), with a
shared tick circle inside each band.
The independent `SmithScales` panel uses its own responsive layout.
