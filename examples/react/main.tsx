import { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SmithEventType } from 'smithkit';
import type { SmithEvent, SmithOptions } from 'smithkit';
import { SmithChart } from './SmithChart';
import { sweeps, markerReading } from '../framework-data';

function Example() {
  const [mounted, setMounted] = useState(true);
  const [alternate, setAlternate] = useState(false);
  const [dark, setDark] = useState(false);
  const [compact, setCompact] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(1);
  const [reading, setReading] = useState('Waiting for marker…');
  const [events, setEvents] = useState(0);
  const options = useMemo<SmithOptions>(
    () => ({
      appearance: { theme: dark ? 'dark' : 'light' },
      interaction: { cursor: true },
      grid: { detail: 'basic' },
    }),
    [dark],
  );
  const onChartEvent = useCallback((event: SmithEvent) => {
    const value = markerReading(event);
    if (value !== undefined && event.type === SmithEventType.Marker) {
      setSampleIndex(event.data.sampleIndex);
      setReading(value);
      setEvents((count) => count + 1);
    }
  }, []);

  return (
    <>
      <div className="controls">
        <button onClick={() => setMounted((value) => !value)}>
          {mounted ? 'Unmount chart' : 'Mount chart'}
        </button>
        <button disabled={!mounted} onClick={() => setAlternate((value) => !value)}>
          Replace sweep
        </button>
        <label>
          <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark
          theme
        </label>
        <label>
          <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />{' '}
          Compact chart
        </label>
        <label>
          Marker sample{' '}
          <input
            type="range"
            min="0"
            max="2"
            value={sampleIndex}
            disabled={!mounted}
            onChange={(e) => setSampleIndex(e.target.valueAsNumber)}
          />
        </label>
      </div>
      <div id="chart" className={compact ? 'compact' : ''}>
        {mounted && (
          <SmithChart
            samples={sweeps[alternate ? 1 : 0]}
            options={options}
            sampleIndex={sampleIndex}
            onChartEvent={onChartEvent}
          />
        )}
      </div>
      <output id="reading">{mounted ? reading : 'No chart mounted.'}</output>
      <p className="hint">
        Marker events received: <span id="event-count">{events}</span>
      </p>
    </>
  );
}

// In development, StrictMode deliberately runs setup/cleanup twice.
const root = createRoot(document.querySelector('#framework-root')!);
root.render(
  <StrictMode>
    <Example />
  </StrictMode>,
);
if (import.meta.hot) {
  import.meta.hot.dispose(() => root.unmount());
}
