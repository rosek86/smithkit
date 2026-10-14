# Migration from 0.6.x to 0.7.0

Version 0.7.0 changes the visual configuration schema.
The old flat visual style keys are removed; they are not compatibility aliases.
Default appearance, interaction, grid detail, and trace behavior remain unchanged.

## Grid and circle styles

Use the same nested style shape in constructor options, `setOptions()`, and
individual layer `setStyle()` calls:

```ts
chart.layers.resistance.setStyle({
  line: { color: '#64748b', majorWidth: 1.5, minorWidth: 0.6 },
  text: { color: '#111827', fontFamily: 'Arial', fontSize: 9 },
});
chart.layers.vswr.setStyle({ line: { color: 'orange', width: 2 } });
```

| Previous grid key                | New grid key                         |
| -------------------------------- | ------------------------------------ |
| `stroke`                         | `line.color`                         |
| `majorWidth`, `minorWidth`       | `line.majorWidth`, `line.minorWidth` |
| `textColor`                      | `text.color`                         |
| `textFontFamily`, `textFontSize` | `text.fontFamily`, `text.fontSize`   |

Circle `stroke` and `strokeWidth` become `line.color` and `line.width`.
Use `GridStyleOptions` / `CircleStyleOptions` for partial patches instead of
`Partial<GridStyle>` / `Partial<CircleStyle>`. Patches merge individual nested
properties; for example, changing `text.color` preserves the font and line style.
Unknown keys and invalid nested values are rejected before changing the chart.

## Trace styles

| Previous trace key | New trace key      |
| ------------------ | ------------------ |
| `lineWidth`        | `line.width`       |
| `lineTolerancePx`  | `line.tolerancePx` |
| `pointRadius`      | `point.radius`     |

The new shape applies to `addTrace()`, `setTraceOptions()`, and `getTraces()`:

```ts
const traceId = chart.addTrace(samples, {
  mode: 'both',
  line: { width: 2, tolerancePx: 0.5 },
  point: { radius: 3 },
});
chart.setTraceOptions(traceId, { line: { width: 4 } });
// The tolerance and point radius are preserved.
console.log(chart.getTraces()[0].line.width);
```

Use `TraceStyleOptions` for partial style patches rather than `Partial<TraceStyle>`.
Snapshots have readonly, detached `line` and `point` objects. Unknown keys and
invalid nested values throw before changing the trace. Defaults remain points,
2 px line width, 2 px point radius, and no line simplification.

## Theme overrides

The `appearance: { theme, overrides }` wrapper and replacement semantics stay the
same. Override paths change as follows:

| Previous override                                                     | New override                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `fontFamily`                                                          | `text.fontFamily`                                                        |
| `traceColors`                                                         | `traces.colors`                                                          |
| `grid.stroke`, `grid.majorWidth`, `grid.minorWidth`                   | `grid.line.color`, `grid.line.majorWidth`, `grid.line.minorWidth`        |
| `grid.textColor`, `grid.fontSize`                                     | `grid.text.color`, `grid.text.fontSize`                                  |
| `boundary.stroke`                                                     | `boundary.color`                                                         |
| `circles.q`, `circles.vswr`                                           | `circles.q.color`, `circles.vswr.color`                                  |
| `circles.width`                                                       | Set both `circles.q.width` and `circles.vswr.width`                      |
| `scales.stroke`, `scales.boundaryColor`                               | `scales.line.color`, `scales.boundary.color`                             |
| `scales.textColor`, `scales.fontSize`                                 | `scales.text.color`, `scales.text.fontSize`                              |
| `scales.titleFontSize`, `scales.peripheralFontSize`                   | `scales.title.fontSize`, `scales.peripheral.fontSize`                    |
| `scales.valueColor`, `scales.valueFontSize`                           | `scales.value.color`, `scales.value.fontSize`                            |
| `scales.indicatorColor`, `scales.indicatorOutline`                    | `scales.indicator.color`, `scales.indicator.outline`                     |
| `cursor.pointColor`, `cursor.pointSize`                               | `cursor.point.color`, `cursor.point.size`                                |
| `cursor.impedanceColor`, `cursor.admittanceColor`, `cursor.lineWidth` | `cursor.impedance.color`, `cursor.admittance.color`, `cursor.line.width` |
| `marker.outlineColor`, `marker.textColor`                             | `marker.outline.color`, `marker.text.color`                              |
| `marker.focusColor`, `marker.focusHaloColor`                          | `marker.focus.color`, `marker.focus.halo`                                |

These changes also apply to the appearance passed to `SmithScales`.
The complete shape is documented in the [configuration guide](guide/configuration.md).

## Optional constructor mounting

```ts
const chart = new Smith('#chart', {
  appearance: { theme: 'dark' },
  grid: { style: { text: { color: '#e2e8f0' } } },
});
```

The first argument is a CSS selector or an `HTMLElement`. It is optional: existing
`new Smith(options)` followed by `draw(target)` still works. Data and markers are
added through the existing methods. The target is separate from configuration so
`setOptions()` keeps the chart in its current container.

`SmithScales` supports the same optional mounting argument, followed by its
independent appearance configuration:

```ts
const scales = new SmithScales('#scales', { theme: 'dark' });
```

`new SmithScales(appearance)` followed by `draw(target)` remains available.
Scales do not inherit chart settings or subscribe to chart events automatically.
