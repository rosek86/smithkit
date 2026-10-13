import { Complex, Smith, SmithScales, Touchstone, type SmithEvent } from 'smithkit';

// Bundled against dist/lib by check-browser.mjs, never against the source alias.
const checks: string[] = [];
let chart: Smith;
let scales: SmithScales;
let marker: string;
let events: SmithEvent[] = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitFor(predicate: () => boolean, message: string): Promise<void> {
  const deadline = performance.now() + 5000;
  while (!predicate()) {
    assert(performance.now() < deadline, message);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

export async function setup(): Promise<string[]> {
  document.body.innerHTML =
    '<div id="chart" style="width:500px;height:500px"></div>' +
    '<div id="scales" style="width:500px"></div>';
  chart = new Smith({
    appearance: { theme: 'dark' },
    interaction: { zoom: true, cursor: true },
    peripheralScales: { visible: true },
  });
  chart.draw('#chart');
  scales = new SmithScales({ theme: 'dark' });
  scales.draw('#scales');
  scales.update(Complex.from(0.2, 0.3));
  const samples = Touchstone.parse('# GHz S RI R 50\n1 -0.5 0\n2 0 0.3\n3 0.5 0\n', {
    output: 'packed',
  }).samples;
  assert(samples instanceof Float64Array && samples.length === 9, 'Packed Touchstone import');
  checks.push('Touchstone packed import');
  const trace = chart.addTrace(samples, { name: 'Compatibility trace', mode: 'line' });
  marker = chart.addMarker(trace)!;
  assert(marker, 'Marker created');
  chart.onEvent((event) => events.push(event));
  const svg = document.querySelector<SVGSVGElement>('#chart svg')!;
  await waitFor(() => svg.querySelectorAll('text').length > 10, 'SVG labels rendered');
  assert(svg.querySelector('path[d]'), 'SVG path rendered');
  assert(document.querySelectorAll('#scales svg').length > 1, 'Radial scales rendered');
  assert(document.querySelector('#scales')!.textContent!.includes('∞'), 'Unicode scale labels');
  const text = Array.from(svg.querySelectorAll('text')).find((node) => node.textContent === '1');
  assert(text && text.getBBox().width > 0, 'SVG text measurement');
  checks.push('SVG paths, labels, text measurement and radial scales');

  chart.updateTrace(trace, new Float64Array([1e9, -0.6, 0, 2e9, 0, 0.4, 3e9, 0.6, 0]));
  chart.setOptions({ appearance: { theme: 'light' }, grid: { detail: 'basic' } });
  assert(document.querySelector('#chart svg') === svg, 'Options/data preserve SVG identity');
  assert(chart.getTraces()[0].sampleCount === 3, 'Updated trace samples');
  checks.push('Data and configuration updates preserve SVG identity');

  const hit = document.querySelector<SVGCircleElement>('.marker-hit-area')!;
  const before = hit.getScreenCTM()!.a;
  document.getElementById('chart')!.style.width = '400px';
  document.getElementById('chart')!.style.height = '400px';
  await waitFor(() => hit.getScreenCTM()!.a !== before, 'ResizeObserver updates geometry');
  await waitFor(() => {
    const matrix = hit.getScreenCTM()!;
    return Math.abs(2 * hit.r.baseVal.value * Math.hypot(matrix.a, matrix.b) - 44) < 0.1;
  }, 'Marker target remains 44 CSS pixels');
  checks.push('ResizeObserver and constant marker hit area');

  const group = svg.querySelector('g')!;
  const transform = group.getAttribute('transform');
  svg.dispatchEvent(
    new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -120,
      clientX: 200,
      clientY: 200,
      view: window,
    }),
  );
  await waitFor(() => group.getAttribute('transform') !== transform, 'Wheel zoom updates view');
  checks.push('Synthetic wheel event updates zoom');

  const exported = chart.toSvg({ scales, legend: true, markerLegend: true, width: 800 });
  const parsed = new DOMParser().parseFromString(exported, 'image/svg+xml');
  assert(!parsed.querySelector('parsererror'), 'SVG export parses');
  assert(parsed.documentElement.getAttribute('width') === '800', 'SVG export width');
  assert(parsed.documentElement.textContent?.includes('Compatibility trace'), 'Export legend');
  const png = await chart.toPng({ scales, legend: true, markerLegend: true, width: 800 });
  assert(png.type === 'image/png' && png.size > 1000, 'PNG blob generated');
  const url = URL.createObjectURL(png);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    assert(image.naturalWidth === 800 && image.naturalHeight > 0, 'PNG dimensions');
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    assert(
      pixels.some((value, i) => i % 4 !== 3 && value > 0 && value < 240),
      'PNG has ink',
    );
  } finally {
    URL.revokeObjectURL(url);
  }
  checks.push('SVG and PNG export with scales and legends');
  chart.setMarkerSample(marker, 0);
  await new Promise((resolve) => setTimeout(resolve, 100));
  events = [];
  assert(chart.focusMarker(marker), 'Marker focus succeeds');
  assert(document.activeElement?.getAttribute('role') === 'slider', 'Accessible marker focus');
  return [...checks];
}

export async function finish(): Promise<string[]> {
  try {
    await waitFor(
      () => chart.getMarker(marker)?.sampleIndex === 1,
      'Native ArrowRight moves marker',
    );
    await waitFor(() => events.some((event) => event.type === 'marker'), 'Marker event delivered');
    assert(
      document.activeElement?.getAttribute('aria-valuenow') === '1',
      'Accessible marker value',
    );
    checks.push('WebDriver keyboard navigation, focus, ARIA value and marker event');
    chart.destroy();
    scales.destroy();
    assert(document.querySelectorAll('svg').length === 0, 'Destroy removes visual components');
    for (let i = 0; i < 3; i++) {
      const next = new Smith();
      next.draw('#chart');
      assert(document.querySelectorAll('#chart svg').length === 1, 'Remount creates one SVG');
      next.destroy();
    }
    checks.push('Destroy and repeated mount/unmount');
    return [...checks];
  } finally {
    chart.destroy();
    scales.destroy();
  }
}
