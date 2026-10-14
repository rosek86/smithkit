import { color } from 'd3';
import type { SmithAppearance, SmithTheme } from './types.js';

/** Resolve and validate a detached theme before touching any chart state or DOM. */
export class Theme {
  private constructor() {}

  public static resolve(appearance: SmithAppearance = {}): SmithTheme {
    if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
      throw new TypeError('Appearance must be an object.');
    }
    for (const key of Object.keys(appearance)) {
      if (key !== 'theme' && key !== 'overrides') {
        throw new TypeError(`Unknown appearance option: ${key}.`);
      }
    }
    const name = appearance.theme === undefined ? 'light' : appearance.theme;
    if (name !== 'light' && name !== 'dark') {
      throw new TypeError('Theme must be light or dark.');
    }
    const dark = name === 'dark';
    const theme: SmithTheme = {
      background: dark ? '#0f172a' : 'transparent',
      text: { fontFamily: 'Verdana, sans-serif' },
      grid: {
        line: { color: dark ? '#94a3b8' : '#64748b', majorWidth: 1, minorWidth: 0.6 },
        text: { color: dark ? '#e2e8f0' : '#111827', fontSize: 7 },
      },
      boundary: { color: dark ? '#cbd5e1' : '#334155', width: 1 },
      circles: {
        q: { color: dark ? '#93c5fd' : 'blue', width: 1 },
        vswr: { color: dark ? '#fbbf24' : 'orange', width: 1 },
      },
      scales: {
        line: { color: dark ? '#94a3b8' : '#64748b' },
        boundary: { color: dark ? '#cbd5e1' : '#334155' },
        text: { color: dark ? '#e2e8f0' : '#334155', fontSize: 10 },
        value: { color: dark ? '#fca5a5' : '#b42318', fontSize: 11 },
        indicator: { color: dark ? '#f87171' : '#dc2626', outline: dark ? '#0f172a' : 'white' },
        title: { fontSize: 12 },
        peripheral: { fontSize: 10.5 },
      },
      cursor: {
        point: { color: dark ? '#fca5a5' : 'red', size: 5 },
        impedance: { color: dark ? '#fca5a5' : 'red' },
        admittance: { color: dark ? '#86efac' : 'green' },
        line: { width: 1 },
      },
      marker: {
        outline: { color: dark ? '#e2e8f0' : 'gray' },
        text: { color: 'white' },
        focus: { color: dark ? '#93c5fd' : '#1d4ed8', halo: dark ? '#0f172a' : 'white' },
      },
      traces: {
        colors: dark
          ? [
              '#fb923c',
              '#4ade80',
              '#f87171',
              '#c084fc',
              '#d6a681',
              '#f472b6',
              '#cbd5e1',
              '#d4d45c',
              '#22d3ee',
              '#60a5fa',
            ]
          : [
              '#ff7f0e',
              '#2ca02c',
              '#d62728',
              '#9467bd',
              '#8c564b',
              '#e377c2',
              '#7f7f7f',
              '#bcbd22',
              '#17becf',
              '#1f77b4',
            ],
      },
    };
    if (appearance.overrides !== undefined) {
      Theme.merge(theme as unknown as Record<string, unknown>, appearance.overrides);
    }
    return theme;
  }

  private static merge(
    target: Record<string, unknown>,
    source: unknown,
    path = 'appearance',
  ): void {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      throw new TypeError(`${path} overrides must be an object.`);
    }
    for (const [key, value] of Object.entries(source)) {
      if (!Object.hasOwn(target, key)) {
        throw new TypeError(`Unknown appearance setting: ${path}.${key}.`);
      }
      if (value === undefined) {
        continue;
      }
      const previous = target[key];
      if (Array.isArray(previous)) {
        if (!Array.isArray(value) || value.length === 0 || !value.every(Theme.isColor)) {
          throw new TypeError('Trace colors must be a non-empty array of solid CSS colors.');
        }
        target[key] = [...value];
      } else if (typeof previous === 'object') {
        Theme.merge(previous as Record<string, unknown>, value, `${path}.${key}`);
      } else if (typeof previous === 'number') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
          throw new RangeError(`${path}.${key} must be positive and finite.`);
        }
        target[key] = value;
      } else {
        if (
          key === 'fontFamily' ? typeof value !== 'string' || !value.trim() : !Theme.isColor(value)
        ) {
          throw new TypeError(
            `${path}.${key} must be ${key === 'fontFamily' ? 'a non-empty font family' : 'a solid CSS color'}.`,
          );
        }
        target[key] = value;
      }
    }
  }

  private static isColor(value: unknown): value is string {
    return typeof value === 'string' && color(value) !== null;
  }
}
