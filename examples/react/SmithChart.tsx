import { useEffect, useRef } from 'react';
import { Smith } from 'smithkit';
import type { SmithEvent, SmithOptions, TraceInput } from 'smithkit';

interface Props {
  samples: TraceInput;
  options: SmithOptions;
  sampleIndex: number;
  onChartEvent: (event: SmithEvent) => void;
}

/** A small single-trace integration, not a wrapper for the entire Smithkit API. */
export function SmithChart({ samples, options, sampleIndex, onChartEvent }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<Smith | null>(null);
  const trace = useRef<string | null>(null);
  const marker = useRef<string | null>(null);

  useEffect(() => {
    const chart = new Smith();
    chart.draw(host.current!);
    instance.current = chart;
    return () => {
      chart.destroy();
      instance.current = null;
      trace.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => instance.current!.onEvent(onChartEvent), [onChartEvent]);
  useEffect(() => {
    instance.current!.setOptions(options);
  }, [options]);
  useEffect(() => {
    const chart = instance.current!;
    if (trace.current) {
      chart.updateTrace(trace.current, samples);
    } else {
      trace.current = chart.addTrace(samples, { name: 'Measured sweep', mode: 'both' });
      marker.current = chart.addMarker(trace.current)!;
    }
  }, [samples]);
  useEffect(() => {
    const chart = instance.current!;
    if (chart.getMarker(marker.current!)?.sampleIndex !== sampleIndex) {
      chart.setMarkerSample(marker.current!, sampleIndex);
    }
  }, [samples, sampleIndex]);

  // Smithkit observes this element's size; a window resize handler is unnecessary.
  return <div ref={host} style={{ width: '100%', height: '100%' }} aria-label="Smith chart" />;
}
