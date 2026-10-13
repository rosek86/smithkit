---
title: Framework integration
group: Guides
---

# Framework integration

Use Smithkit directly in your framework's browser lifecycle. No wrapper package
is required. The examples cover data and configuration updates, marker events,
container resize, cleanup and remounting.

Reference: {@link Smith.draw}, {@link Smith.updateTrace}, {@link Smith.setOptions},
{@link Smith.onEvent}, {@link Smith.destroy}.

## Shared lifecycle

1. Mount a host element with an explicit, non-zero size, then construct and draw one chart.
2. Retain that instance and its trace/marker IDs. Update samples with `updateTrace()`
   and configuration with `setOptions()` instead of recreating the chart.
3. Store the unsubscribe function from `onEvent()`. Event payloads are detached
   snapshots; narrow `SmithEvent.type` before reading `data`.
4. Let the built-in ResizeObserver follow host size changes. No framework-specific
   resize listener is needed.
5. On unmount, unsubscribe and call `destroy()`. Clear stored references so a later
   mount creates a fresh chart. Repeated destruction is safe.

Pass replacement arrays/options when framework inputs change. Smithkit copies
data and does not observe subsequent mutations of the supplied objects. An options
update is a patch: omitted values remain unchanged, while `appearance` replaces
the preset and overrides. See [configuration](configuration.md#updating-configuration)
and [marker selection during data updates](traces.md#traces-and-markers).

## React

[Open the React example](https://rosek86.github.io/smithkit/examples/react/index.html)
and copy the displayed `SmithChart.tsx` component into your application.

- Create and draw the chart in an effect after the host ref is attached.
- Keep the chart and trace ID in refs; separate effects update data and options.
- Forward marker snapshots to application state. Keep callbacks current without
  reconstructing the chart or accumulating subscriptions.
- The effect cleanup unsubscribes and destroys the instance. It also works with
  StrictMode's development setup/cleanup replay.

Use the example controls to change data, switch theme, resize, move a marker
with the keyboard, and unmount/remount. The SVG should be retained on updates and
removed on unmount. See [event delivery](events.md#events-and-readings) for queued
marker updates and synchronous selection/drag events.

## Angular

[Open the Angular example](https://rosek86.github.io/smithkit/examples/angular/index.html)
and copy the displayed standalone `SmithChartComponent` into your application.

- Create the chart in `afterNextRender`, after the host exists in the browser.
- Apply changed inputs in `ngOnChanges`; retain changes received before mounting.
- Forward marker readings through the component output. The example defers parent
  notifications out of input updates and discards pending notifications on destruction.
- Unsubscribe and destroy in `ngOnDestroy`. The example uses signals and zoneless
  change detection in its parent.

The gallery loads `@angular/compiler` for its JIT example. Normal Angular CLI
applications use AOT and do not need that gallery-only import. The repository
also checks the example's templates with Angular's strict compiler.

## Browser-only mounting and support

Importing Smithkit and using calculations or Touchstone parsing does not require
a DOM. Construct `Smith` and `SmithScales` only in browser lifecycle hooks; neither
the examples nor this library claim end-to-end SSR/hydration support.

Frameworks may require newer browsers or compilers than the chart library itself.
See the [tested integration versions and compatibility limits](https://github.com/rosek86/smithkit/blob/main/docs/compatibility.md#framework-integration-evidence).
