import type { Complex } from './math/Complex.js';

export interface GridStyle {
  line: {
    color: string;
    /** Non-scaling stroke width in CSS pixels. */
    majorWidth: number;
    /** Non-scaling stroke width in CSS pixels. */
    minorWidth: number;
  };
  text: {
    color: string;
    fontFamily: string;
    /** Base font size in chart units; adaptive layout enforces a 9 CSS px minimum in the default view. */
    fontSize: number;
  };
}
/** A grid style patch. Omitted nested properties retain their existing values. */
export interface GridStyleOptions {
  line?: Partial<GridStyle['line']>;
  text?: Partial<GridStyle['text']>;
}
export interface CircleStyle {
  line: {
    color: string;
    /** Non-scaling stroke width in CSS pixels. */
    width: number;
  };
}
export interface CircleStyleOptions {
  line?: Partial<CircleStyle['line']>;
}

export type GridDetail = 'basic' | 'standard' | 'detailed';

/** Grid styling uses SVG user units, except non-scaling stroke widths in screen pixels. */
export interface GridLayer {
  setVisible(visible: boolean): void;
  /** Show or hide labels independently of grid lines. Default: true. */
  setLabelsVisible(visible: boolean): void;
  /** Default: standard. Basic shows only the principal normalized values. */
  setDetail(detail: GridDetail): void;
  setStyle(style: GridStyleOptions): void;
}

export interface CircleLayer {
  setVisible(visible: boolean): void;
  setStyle(style: CircleStyleOptions): void;
  /** Replace the complete set after validation; duplicates are ignored and empty clears it. */
  setValues(values: readonly number[]): void;
  addValue(value: number): void;
  removeValue(value: number): void;
}

export interface ChartLayers {
  readonly resistance: GridLayer;
  readonly reactance: GridLayer;
  readonly conductance: GridLayer;
  readonly susceptance: GridLayer;
  readonly q: CircleLayer;
  readonly vswr: CircleLayer;
}

export interface PeripheralScales {
  setVisible(visible: boolean): void;
  /** Show or hide axis captions independently of numeric tick labels. Default: true. */
  setCaptionsVisible(visible: boolean): void;
  /** Show or hide numeric tick labels independently of captions. Default: true. */
  setTickLabelsVisible(visible: boolean): void;
  /** Pass null to clear the indicators. */
  update(reflectionCoefficient: Complex | null): void;
}
