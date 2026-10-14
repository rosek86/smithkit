---
title: Touchstone
group: Guides
---

# Touchstone

Reference: {@link Touchstone}, {@link TouchstoneParseOptions}, {@link TouchstoneWriteOptions}.

## Import using the file reference

`Touchstone.parse(text, options?)` returns `{ samples, referenceImpedanceOhms }`.
It reads Touchstone 1.x S-parameters, converts RI/MA/DB into Cartesian Γ and
frequencies into Hz, and throws an `Error` with a line number for invalid content.
Invalid parser options throw `TypeError`.

| Option      | Default     | Meaning                                                                          |
| ----------- | ----------- | -------------------------------------------------------------------------------- |
| `ports`     | `1`         | Source port count: `1` for `.s1p`, `2` for `.s2p`. It is not inferred from text. |
| `parameter` | `'S11'`     | Reflection parameter: `'S11'` or, with two ports, `'S22'`.                       |
| `output`    | `'objects'` | Object samples or `'packed'` `Float64Array` containing f/re/im triples.          |

```ts
import { Smith, Touchstone } from 'smithkit';

async function showMeasurement(file: File): Promise<Smith> {
  const ports = /\.s2p$/i.test(file.name) ? 2 : 1;
  const { samples, referenceImpedanceOhms } = Touchstone.parse(await file.text(), {
    ports,
    parameter: ports === 2 ? 'S22' : 'S11',
    output: 'packed',
  });
  const chart = new Smith('#smith', { referenceImpedanceOhms });
  chart.addTrace(samples, { name: file.name });
  return chart;
}
```

**The file already specifies its reference impedance.** Use the returned
`referenceImpedanceOhms` to configure the chart, as above. No renormalization is
needed.

Packed parsing writes directly into growing typed storage, without creating an
object or coordinate array per sample. It scans lines incrementally within the
supplied string; this is not a streaming file API. The returned buffer has exact
length and is caller-owned. The default object result remains unchanged.

Omitted header options use GHz, S, MA, 50 Ω. The parser accepts comments, BOM,
LF/CRLF/CR line endings, decimal scientific notation, and continued records. Each
frequency record starts on a new line. Two-port records use S11, S21, S12, S22
order; all four parameters are validated even though only one reflection trace is
returned. Two-port frequencies must increase strictly. Three or more ports,
per-port/complex reference impedances, noise blocks and Touchstone 2.x keywords
are rejected. See the [IBIS Touchstone specification](https://www.ibis.org/touchstone_ver2.1/touchstone_ver2_1.pdf)
for the legacy 1.x data layout.

## Export a one-port file

`Touchstone.stringify(samples, { referenceImpedanceOhms })` returns `.s1p` text
with a `# Hz S RI R …` header and a final newline. It accepts object samples,
tuples, or packed triples, writes numeric values without a precision limit, and
does not modify or renormalize the input. The reference defaults to 50 Ω; supply
the actual reference of your data. Empty/invalid samples, nonpositive/nonfinite
reference impedance, and duplicate or descending frequencies throw `RangeError`.
Samples are never silently sorted or discarded.

```ts
import { Touchstone } from 'smithkit';

const sourceText = '# GHz S RI R 75\n1 0.2 -0.3\n2 0.2 0.3';
const { samples, referenceImpedanceOhms } = Touchstone.parse(sourceText);
const text = Touchstone.stringify(samples, { referenceImpedanceOhms });
// Save text as measurement.s1p in your application.
```

When you intentionally need a different reference, use the separate
[reference impedance conversion API](rf.md#reference-impedance-and-renormalization). It is not needed
for loading a file at its original reference. Exporting S22 to `.s1p` represents
that selected port as the single port of the new file; transmission data is not
exported.

The [Touchstone example](https://rosek86.github.io/smithkit/examples/touchstone/index.html)
shows parameter selection, packed import at the file reference, and download. In the demo,
choose **Two-port reflection** before importing `.s2p`; the trace name includes the
selected parameter. Both `.s1p` and `.s2p` use packed import.
