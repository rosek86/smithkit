# Smithkit documentation

Build static and interactive Smith charts using the same public API.
Start with a guide, open a working example, or search for a class, method,
option, or phrase. This site follows `main`; the displayed package version does
not imply that every documented change has already been published to npm.

## Start here

- [Getting started](getting-started.md): mount a chart, enable interaction, resize and destroy.
- [Configuration](configuration.md): constructor defaults, `setOptions()` patches, themes and grid controls.
- [Traces and markers](traces.md): object/tuple/packed inputs, identity, display accuracy and accessibility.
- [Events and readings](events.md): subscriptions, delivery timing, physical units and singular values.
- [Scales](scales.md): independent radial scales and peripheral rulers.
- [RF calculations](rf.md): complex arithmetic, conversions, formatting and renormalization.
- [Touchstone](touchstone.md): S11/S22 import and `.s1p` export.
- [SVG and PNG export](export.md): report dimensions, backgrounds, legends and explicit scale readings.
- [Framework integration](frameworks.md): React and Angular mounting, updates and cleanup.

## API reference

Reference pages are generated from the public package declarations. They include
overloads, parameter and return types, option fields and links between types.
Private rendering classes are not part of this contract.

| Responsibility                    | Entry points                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Chart and lifecycle               | {@link Smith}, {@link SmithOptions}                                                                               |
| Trace data and markers            | {@link TraceInput}, {@link TraceOptions}, {@link TraceUpdateOptions}, {@link MarkerSnapshot}                      |
| Events and readouts               | {@link SmithEvent}, {@link SmithEventType}, {@link SmithReading}                                                  |
| Appearance and layers             | {@link SmithAppearance}, {@link SmithThemeOverrides}, {@link ChartLayers}, {@link GridLayer}, {@link CircleLayer} |
| Independent and peripheral scales | {@link SmithScales}, {@link PeripheralScales}                                                                     |
| Export                            | {@link SmithImageExportOptions}, {@link ScaleImageExportOptions}, {@link MarkerLegendOptions}                     |
| DOM-independent operations        | {@link Complex}, {@link RfCalculations}, {@link MarkerMeasurements}, {@link SmithFormatter}, {@link Touchstone}   |

## Working examples and compatibility

Each [integration example](https://rosek86.github.io/smithkit/examples/index.html)
includes the executed TypeScript source. Examples use the public library directly;
React and Angular components are copyable starting points, not separate wrapper packages.

See the [compatibility evidence](https://github.com/rosek86/smithkit/blob/main/docs/compatibility.md)
for browser and compiler targets, the
[migration guide](https://github.com/rosek86/smithkit/blob/main/docs/migrations.md)
when upgrading, and the
[API compatibility policy](https://github.com/rosek86/smithkit/blob/main/docs/api-review.md)
for the intended 1.x contract. During 0.x, breaking API changes may occur in minor releases.
