import { Smith, Touchstone } from 'smithkit';

// Touchstone 1.x two-port order: frequency, S11, S21, S12, S22.
const source = `! Synthetic two-port measurement
# GHz S RI R 75
1   0.4 -0.4   0.8 0   0.1 0   0.2 -0.3
1.5 0.0  0.0   0.9 0   0.1 0   0.1  0.0
2   0.4  0.4   0.8 0   0.1 0   0.2  0.3
`;
const parameter = document.querySelector<HTMLSelectElement>('#parameter')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;

function readMeasurement() {
  return Touchstone.parse(source, {
    ports: 2,
    parameter: parameter.value === 'S22' ? 'S22' : 'S11',
    output: 'packed',
  });
}

let measurement = readMeasurement();
const chart = new Smith('#chart', {
  referenceImpedanceOhms: measurement.referenceImpedanceOhms,
});
const traceId = chart.addTrace(measurement.samples, { name: parameter.value, mode: 'both' });

function showStatus(): void {
  status.textContent = `${parameter.value}: ${measurement.samples.length / 3} packed samples at ${measurement.referenceImpedanceOhms} Ω.`;
}
parameter.addEventListener('change', () => {
  measurement = readMeasurement();
  chart.updateTrace(traceId, measurement.samples);
  chart.setTraceOptions(traceId, { name: parameter.value });
  showStatus();
});
showStatus();

document.querySelector('#download')!.addEventListener('click', () => {
  const text = Touchstone.stringify(measurement.samples, {
    referenceImpedanceOhms: measurement.referenceImpedanceOhms,
  });
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${parameter.value}-${measurement.referenceImpedanceOhms}ohm.s1p`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
