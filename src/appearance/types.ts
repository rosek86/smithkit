/** Resolved appearance shared by charts and independent scales. Lengths are positive. */
export interface SmithTheme {
  background: string;
  text: { fontFamily: string };
  grid: {
    line: { color: string; majorWidth: number; minorWidth: number };
    text: { color: string; fontSize: number };
  };
  boundary: { color: string; width: number };
  circles: {
    q: { color: string; width: number };
    vswr: { color: string; width: number };
  };
  scales: {
    line: { color: string };
    boundary: { color: string };
    text: { color: string; fontSize: number };
    title: { fontSize: number };
    value: { color: string; fontSize: number };
    indicator: { color: string; outline: string };
    peripheral: { fontSize: number };
  };
  cursor: {
    point: { color: string; size: number };
    impedance: { color: string };
    admittance: { color: string };
    line: { width: number };
  };
  marker: {
    outline: { color: string };
    text: { color: string };
    focus: { color: string; halo: string };
  };
  traces: { colors: readonly string[] };
}

/** Each visual group can be overridden independently, down to individual properties. */
export type SmithThemeOverrides = {
  [K in keyof SmithTheme]?: SmithTheme[K] extends string
    ? string
    : {
        [P in keyof SmithTheme[K]]?: SmithTheme[K][P] extends readonly string[]
          ? readonly string[]
          : SmithTheme[K][P] extends object
            ? Partial<SmithTheme[K][P]>
            : SmithTheme[K][P];
      };
};

/** Each application replaces the previous appearance, starting from the named preset. */
export interface SmithAppearance {
  theme?: 'light' | 'dark';
  overrides?: SmithThemeOverrides;
}
