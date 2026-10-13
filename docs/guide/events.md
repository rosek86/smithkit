---
title: Events and readings
group: Guides
---

# Events and readings

Reference: {@link SmithEvent}, {@link SmithEventType}, {@link SmithReading}.

## Events and readings

`onEvent(listener)` supports multiple independent subscriptions and returns an
unsubscribe function. `SmithEvent` is a discriminated union: checking `type`
narrows `data` without a cast or a property-presence test.

```ts
import { SmithEventType } from 'smithkit';

const unsubscribe = chart.onEvent((event) => {
  if (event.type === SmithEventType.Cursor) {
    // undefined when the pointer leaves or a marker drag starts.
    console.log(event.data?.impedanceOhms?.toVector());
    return;
  }
  // Marker, MarkerSelect, MarkerDragStart, and MarkerDragEnd carry a MarkerSnapshot.
  console.log(event.data.markerId, event.data.frequencyHz);
});

// On component unmount:
unsubscribe();
chart.destroy();
```

The event types are `Cursor` (`'cursor'`), `Marker` (`'marker'`),
`MarkerSelect` (`'marker-select'`),
`MarkerDragStart` (`'marker-drag-start'`), and `MarkerDragEnd` (`'marker-drag-end'`).
`MarkerSelect` fires synchronously when a marker receives focus or is engaged by
keyboard navigation or a pointer press. Use it to select the corresponding
readout; it does not indicate a position change. Keyboard changes use the normal
queued `Marker` event and do not emit drag lifecycle events.
Cursor movement is suspended during marker dragging. Drag start/end events fire
synchronously; marker position notifications are queued and report the latest
snapshot at delivery. Before delivery, repeated updates to the same marker coalesce
into one notification; different markers have independent notifications. `addMarker()`
queues an initial marker notification too; `addTrace()` does not. Removed markers cannot deliver queued
position events.
Trace metadata changes do not emit marker events; refresh metadata after mutations.
Destruction suppresses application callbacks.

`chart.cursorReading` returns the last cursor position. Cursor and marker readings
share `SmithReading`; `RfCalculations.readReflection(gamma, referenceImpedanceOhms = 50)` produces
the same reading without constructing a chart.

| Fields                                                                               | Units / meaning                                                        |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `reflectionCoefficient`                                                              | Complex, dimensionless voltage Γ.                                      |
| `impedanceOhms`, `admittanceSiemens`                                                 | Physical complex Z in Ω and Y in S. Multiply Y by 1000 for mS display. |
| `phaseDegrees`                                                                       | Phase of Γ in degrees; undefined at Γ = 0.                             |
| `vswr`, `q`                                                                          | Dimensionless voltage standing-wave ratio and \|X/R\|.                 |
| `returnLossDb`, `reflectionLossDb`                                                   | dB. Reflection loss is also called mismatch loss.                      |
| `standingWaveRatioDb`                                                                | 20 log₁₀(VSWR), in dB.                                                 |
| `attenuationDb`                                                                      | Half the return loss; interpretation described below.                  |
| `powerReflectionCoefficient`, `powerTransmissionCoefficient`                         | \|Γ\|² and 1 − \|Γ\|².                                                 |
| `voltageReflectionCoefficientMagnitude`                                              | \|Γ\|.                                                                 |
| `voltageTransmissionCoefficientMagnitude`, `currentTransmissionCoefficientMagnitude` | \|1 + Γ\| and \|1 − Γ\|, respectively.                                 |
| `standingWavePeak`, `standingWaveLossCoefficient`                                    | √VSWR and (1 + \|Γ\|²)/(1 − \|Γ\|²).                                   |

Singular Z at Γ = +1 and Y at Γ = −1 are `undefined`. Q is undefined at an open
or short, and infinite for a nonzero purely reactive impedance. Finite points near
these limits retain finite readings within the supported numeric range. An exact
infinite scalar limit is preserved: perfect match gives infinite return loss;
\|Γ\| = 1 gives infinite VSWR and reflection loss.

For active loads (\|Γ\| > 1), VSWR, standing-wave quantities, reflection loss,
attenuation, and power transmission are `undefined`. Other quantities remain
available. Non-finite complex inputs or invalid reference impedances throw
`RangeError` in the public RF methods. Unrepresentable complex conversion
results are `undefined`.
