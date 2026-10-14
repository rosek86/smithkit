import type { SmithTheme } from './types.js';

/** Scope presentation tokens to one chart or scale component. Explicit SVG styles take priority. */
export class SvgTheme {
  private constructor() {}

  public static apply(element: HTMLElement | SVGElement, theme: SmithTheme): void {
    SvgTheme.tokens(element, theme, '--smithkit');
    element.style.backgroundColor = theme.background;
  }

  private static tokens(element: HTMLElement | SVGElement, values: object, prefix: string): void {
    for (const [key, value] of Object.entries(values)) {
      if (Array.isArray(value)) {
        continue;
      }
      if (typeof value === 'object') {
        SvgTheme.tokens(element, value, `${prefix}-${key}`);
      } else {
        const suffix = key === 'fontSize' ? 'px' : '';
        element.style.setProperty(`${prefix}-${key}`, String(value) + suffix);
      }
    }
  }
}
