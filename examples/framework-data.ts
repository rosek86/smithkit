import { SmithEventType, SmithFormatter } from 'smithkit';
import type { SmithEvent } from 'smithkit';

export const sweeps = [
  [
    [1e9, 0.4, -0.4],
    [1.5e9, 0, 0],
    [2e9, 0.4, 0.4],
  ],
  [
    [1e9, 0.3, -0.3],
    [1.5e9, 0.2, 0.1],
    [2e9, 0.3, 0.3],
  ],
] as const;

export function markerReading(event: SmithEvent): string | undefined {
  if (event.type !== SmithEventType.Marker) {
    return;
  }
  const reading = event.data;
  return `${SmithFormatter.number(reading.frequencyHz)}Hz · Γ = ${reading.reflectionCoefficient.toString(3)}`;
}
