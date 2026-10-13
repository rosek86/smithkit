---
title: RF calculations
group: Guides
---

# RF calculations

Reference: {@link Complex}, {@link RfCalculations}, {@link SmithFormatter}, {@link MarkerMeasurements}.

## Calculations without a chart

```ts
import { Complex, RfCalculations } from 'smithkit';

const gamma = RfCalculations.impedanceToReflection(Complex.from(75, 25), 50)!;
const reading = RfCalculations.readReflection(gamma, 50);
console.log(reading.impedanceOhms?.toVector()); // Approximately [75, 25].
console.log(reading.admittanceSiemens?.toVector());
```

| Static method                                                                           | Input and output                                                                                                |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `RfCalculations.reflectionToImpedance(gamma, referenceImpedanceOhms = 50)`              | Γ → physical Z in Ω.                                                                                            |
| `RfCalculations.impedanceToReflection(impedanceOhms, referenceImpedanceOhms = 50)`      | Physical Z in Ω → Γ.                                                                                            |
| `RfCalculations.reflectionToAdmittance(gamma, referenceImpedanceOhms = 50)`             | Γ → physical Y in S.                                                                                            |
| `RfCalculations.admittanceToReflection(admittanceSiemens, referenceImpedanceOhms = 50)` | Physical Y in S → Γ.                                                                                            |
| `RfCalculations.readReflection(gamma, referenceImpedanceOhms = 50)`                     | Complete `SmithReading`.                                                                                        |
| `MarkerMeasurements.compare(a, b)`                                                      | Compare readings without a chart. Each input needs `frequencyHz`, `reflectionCoefficient`, and `impedanceOhms`. |

Comparison results contain `frequencyDeltaHz`, `impedanceDeltaOhms`, and
`phaseDeltaDegrees`. Phase differences use B − A wrapped to **[−180°, 180°)**:
179° → −179° gives +2°; an exact half turn gives −180°. Phase is undefined if
either Γ is zero or non-finite. Impedance differences are undefined if either Z
is singular or non-finite. Frequencies must be finite and non-negative. This is
a point comparison, not sweep phase unwrapping or group delay.

`Complex.from(re, im)` constructs complex numbers. Read components through `re` and `im`. Arithmetic (`add`, `sub`,
`mul`, `div`, `pow`) returns new values. The class also provides `abs`, `arg`
(radians), and static methods such as `Complex.conj`, `Complex.sqrt`,
`Complex.exp`, `Complex.log`, and trigonometric/hyperbolic functions and inverses. `toVector()` returns `[real, imaginary]`; `toString(dp)` formats
a Cartesian value. See the exported declarations for all operations.

The `SmithFormatter` class provides static methods: `SmithFormatter.number(value)` (three significant
digits and SI prefixes), `SmithFormatter.complex(value, unit?, decimalPlaces?)`, and
`SmithFormatter.polar(value, unit?, decimalPlaces?)` (phase in degrees). They work
without a chart or DOM. Complex formatters default to three fractional digits.
`SmithFormatter.number` includes spacing so you can append a unit, e.g. `SmithFormatter.number(1e9) + 'Hz'`.

`RfCalculations.reactanceToComponent(reactanceOhms, frequencyHz)` calculates an ideal equivalent
series component without formatting or constructing a chart:

```ts
import { RfCalculations, SmithFormatter } from 'smithkit';

const component = RfCalculations.reactanceToComponent(-50, 1e9);
if (component?.kind === 'capacitor') {
  console.log(SmithFormatter.number(component.capacitanceFarads) + 'F'); // 3.18 pF
} else if (component?.kind === 'inductor') {
  console.log(SmithFormatter.number(component.inductanceHenries) + 'H');
}
```

Use `reading.impedanceOhms.im` for the reactance when impedance is defined.
Zero frequency, zero reactance, and unrepresentable results return `undefined`.
Non-finite reactance or negative/non-finite frequency throws `RangeError`.
This is a single-frequency equivalence, not a fitted circuit model.

## Reference impedance and renormalization

`chart.renormalize(referenceImpedanceOhms)` changes the positive real reference
impedance and transforms every loaded Γ to preserve physical Z. Trace/marker IDs,
names, colors, visibility, frequencies, and selected sample indices are retained.
Results for all traces are validated before any change; a singular/unrepresentable
result rejects the operation without changing Z₀ or data. Active marker drags end,
cursor indicators are cleared, and marker readings are queued with the new values.
Changing to the current Z₀ has no effect. Mutations after destruction throw.

Two DOM-independent methods are available on `RfCalculations`:

- `RfCalculations.renormalizeReflection(gamma, fromOhms, toOhms)` returns the new complex Γ or
  `undefined` for a singular/unrepresentable result. Exact open and short limits
  remain Γ = +1 and −1. References must be positive, finite, real ohm values.
- `RfCalculations.renormalizeSamples(samples, fromOhms, toOhms)` returns a new sample array in
  the same order, preserving frequencies. Invalid samples or a singular result
  throw `RangeError`; the input is never modified.

For example, a matched 75 Ω load has Γ = 0 at 75 Ω and Γ = 0.2 at 50 Ω.
Renormalization changes Γ, VSWR, and loss readings; physical impedance stays 75 Ω.
Simply relabeling the same Γ with a new Z₀ would describe a different load.

The demo exposes chart Z₀ and explicitly renormalizes existing traces when applied.
Import renormalization is enabled by a labeled checkbox. Disable it to reject
files whose reference differs from the chart. Complex reference impedances and
multiport renormalization are outside the supported scope.

## Numerical limits

`Complex` uses JavaScript binary64 numbers. Multiplication and division scale
intermediate products to avoid premature overflow and underflow; logarithms,
square roots, and reciprocals also handle extreme finite components. Results still
round to binary64: unrepresentable magnitudes become infinity and tiny results
can underflow to signed zero. Division by zero and reciprocals at zero return
`[NaN, NaN]`. These operations reject non-finite operands with NaN components.
The principal logarithm of zero retains its `-Infinity` real limit, and signed
zeros select the side of square-root and logarithm branch cuts. `pow(z, 0)` is one,
including zero to the zeroth power; negative powers of zero are undefined.

RF helpers validate finite inputs and use `undefined` for unrepresentable complex
readings, including an overflowing impedance difference between markers. These
conventions do not imply arbitrary precision or numerical certification of every
transcendental operation.
