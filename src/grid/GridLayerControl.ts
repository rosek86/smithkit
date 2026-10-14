import { OptionsValidation } from '../OptionsValidation.js';
import type { SmithGridLayer } from './SmithGridLayer.js';
import type { GridDetail, GridLayer, GridStyleOptions } from '../layers.js';
import { LayerControl } from './LayerControl.js';

/** Exposes grid controls without exposing the SVG renderer. */
export class GridLayerControl extends LayerControl implements GridLayer {
  public constructor(
    private readonly layer: SmithGridLayer,
    assertAlive: () => void,
    private readonly changed: () => void,
  ) {
    super(assertAlive);
  }

  public setVisible(visible: boolean): void {
    this.assertAlive();
    OptionsValidation.boolean(visible, 'Grid visibility');
    this.layer.visibility(visible);
    this.changed();
  }

  public setLabelsVisible(visible: boolean): void {
    this.assertAlive();
    OptionsValidation.boolean(visible, 'Grid visibility');
    this.layer.setLabelsVisible(visible);
    this.changed();
  }

  public setDetail(detail: GridDetail): void {
    this.assertAlive();
    OptionsValidation.detail(detail);
    this.layer.setDetail(detail);
    this.changed();
  }

  public setStyle(style: GridStyleOptions): void {
    this.assertAlive();
    OptionsValidation.gridStyle(style);
    const properties = [
      ['Stroke', style.line?.color],
      ['MajorWidth', style.line?.majorWidth],
      ['MinorWidth', style.line?.minorWidth],
      ['TextColor', style.text?.color],
      ['TextFontFamily', style.text?.fontFamily],
      ['TextFontSize', style.text?.fontSize],
    ] as const;
    for (const [property, value] of properties) {
      if (value !== undefined) {
        this.layer[property] = String(value);
      }
    }
    this.changed();
  }
}
