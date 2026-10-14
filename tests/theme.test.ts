import { describe, expect, it } from 'vitest';
import { Theme } from '../src/appearance/Theme';
import type { SmithAppearance } from '../src';

describe('appearance resolution', () => {
  it('copies nested overrides and resolves independent visual groups', () => {
    const overrides = {
      grid: { text: { color: '#123456' } },
      circles: { q: { width: 3 }, vswr: { color: 'purple' } },
      scales: { value: { fontSize: 14 }, indicator: { color: 'cyan' } },
      marker: { focus: { color: 'yellow' } },
    };
    const theme = Theme.resolve({ overrides });
    overrides.grid.text.color = 'red';
    overrides.circles.q.width = 8;
    expect(theme.grid.text).toEqual({ color: '#123456', fontSize: 7 });
    expect(theme.circles).toEqual({
      q: { color: 'blue', width: 3 },
      vswr: { color: 'purple', width: 1 },
    });
    expect(theme.scales.value).toEqual({ color: '#b42318', fontSize: 14 });
    expect(theme.scales.indicator).toEqual({ color: 'cyan', outline: 'white' });
    expect(theme.marker.focus).toEqual({ color: 'yellow', halo: 'white' });
  });
  it('merges partial overrides without mutating the input or sharing presets', () => {
    const colors = ['#123456', 'red'];
    const appearance: SmithAppearance = {
      theme: 'dark',
      overrides: {
        traces: { colors: colors },
        grid: { line: { majorWidth: 2 } },
        text: { fontFamily: 'Arial' },
      },
    };
    const theme = Theme.resolve(appearance);
    expect(theme.background).toBe('#0f172a');
    expect(theme.grid.line.majorWidth).toBe(2);
    expect(theme.grid.line.minorWidth).toBe(0.6);
    expect(theme.text.fontFamily).toBe('Arial');
    colors[0] = 'blue';
    theme.grid.line.color = 'pink';
    expect(theme.traces.colors[0]).toBe('#123456');
    expect(Theme.resolve({ theme: 'dark' }).grid.line.color).toBe('#94a3b8');
    expect(appearance.overrides!.grid).toEqual({ line: { majorWidth: 2 } });
    expect(Theme.resolve().background).toBe('transparent');
  });

  it.each([
    null,
    { theme: 'unknown' },
    { theme: null },
    { overrides: null },
    { overrides: { grid: null } },
    { overrides: { grid: { text: null } } },
    { overrides: { grid: { text: { unknown: 'red' } } } },
    { overrides: { grid: { textColor: 'red' } } },
    { overrides: { circles: { q: { width: 0 } } } },
    { overrides: { grid: { line: { majorWidth: 0 } } } },
    { overrides: { scales: { text: { fontSize: NaN } } } },
    { overrides: { cursor: { line: { width: Infinity } } } },
    { overrides: { marker: { text: { color: 'url(https://example.com)' } } } },
    { overrides: { background: 'var(--external)' } },
    { overrides: { traces: { colors: [] } } },
    { overrides: { traces: { colors: ['red', 'invalid'] } } },
    { overrides: { text: { fontFamily: '' } } },
    { overrides: { grid: { missing: 'red' } } },
  ])('rejects invalid configuration: %j', (appearance) => {
    expect(() => Theme.resolve(appearance as unknown as SmithAppearance)).toThrow();
  });
});
