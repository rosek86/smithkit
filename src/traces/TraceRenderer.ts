import { path, pathRound } from 'd3';
import { SmithGroup } from '../svg/SmithGroup.js';
import { SmithScaler } from '../svg/SmithScaler.js';
import type { TraceStyle, TraceStyleOptions } from '../measurements.js';
import { TraceLineDetail } from './TraceLineDetail.js';
import { TraceBuffer } from './TraceBuffer.js';

export interface TraceTransform {
  x: number;
  y: number;
  k: number;
}

/** Draws a trace; sample validation and marker selection belong to TraceModel. */
export class TraceRenderer {
  private style: TraceStyle;
  private viewportScale = 1;
  private visible = true;
  private group: SmithGroup;
  private lineDetail: TraceLineDetail | undefined;
  private lineIndices: Uint32Array | undefined;

  public constructor(
    private data: TraceBuffer,
    private color: string,
    private transform: TraceTransform,
    container: SmithGroup,
    private scaler: SmithScaler,
    style: TraceStyleOptions = {},
  ) {
    this.style = {
      mode: style.mode ?? 'points',
      line: { width: style.line?.width ?? 2, tolerancePx: style.line?.tolerancePx ?? 0 },
      point: { radius: style.point?.radius ?? 2 },
    };
    this.group = this.drawTrace(data).attr('pointer-events', 'none');
    container.append(this.group);
  }

  private drawTrace(data: TraceBuffer): SmithGroup {
    const group = new SmithGroup({
      stroke: 'none',
      strokeWidth: 'none',
      fill: this.color,
    });
    group.attr('data-role', 'samples');
    group.attr('data-mode', this.style.mode);
    if (this.style.mode !== 'points') {
      this.lineIndices = this.selectLineIndices();
      group.Element.append('path')
        .attr('class', 'trace-line')
        .attr('d', this.linePath(this.lineIndices))
        .attr('fill', 'none')
        .attr('stroke', this.color)
        .attr('stroke-width', this.style.line.width)
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round');
    }
    if (this.style.mode !== 'line') {
      this.renderPoints(group, data);
    }
    return group;
  }

  private selectLineIndices(): Uint32Array | undefined {
    if (this.style.line.tolerancePx === 0) {
      return;
    }
    this.lineDetail ??= new TraceLineDetail(this.data);
    const unitsToPixels =
      Math.max(
        Math.abs(this.scaler.x(1) - this.scaler.x(0)),
        Math.abs(this.scaler.y(1) - this.scaler.y(0)),
      ) *
      this.transform.k *
      this.viewportScale;
    return this.lineDetail.select(this.style.line.tolerancePx / unitsToPixels);
  }

  private linePath(indices?: Uint32Array): string {
    // Simplified paths retain numeric precision even at high zoom. Full paths keep
    // the existing SVG serialization; the tolerance measures additional simplification.
    const line = indices ? path() : pathRound(3);
    const length = indices?.length ?? this.data.length;
    for (let position = 0; position < length; position++) {
      const index = indices ? indices[position] : position;
      const x = this.scaler.x(this.data.real(index));
      const y = this.scaler.y(this.data.imaginary(index));
      if (position === 0) {
        line.moveTo(x, y);
      } else {
        line.lineTo(x, y);
      }
    }
    if (length === 1) {
      line.closePath();
    }
    return line.toString();
  }

  private updateLine(): void {
    if (this.style.mode === 'points') {
      return;
    }
    const indices = this.selectLineIndices();
    if (indices !== this.lineIndices) {
      this.lineIndices = indices;
      this.group.Element.select('.trace-line').attr('d', this.linePath(indices));
    }
  }

  /** Replace geometry only in the export copy, never in the live SVG. */
  public fullExportLine(): { node: SVGElement; path: string } | undefined {
    const node = this.group.Element.select<SVGElement>('.trace-line').node();
    if (node && this.lineIndices) {
      return { node, path: this.linePath() };
    }
    return;
  }

  private renderPoints(group: SmithGroup, data: TraceBuffer): void {
    const visible: number[] = [];
    const cells = new Set<number>();
    const cellSize = Math.max(0.5, this.style.point.radius) / this.viewportScale;
    const extent = this.scaler.x(1);
    const margin = this.style.point.radius / this.viewportScale;
    const firstCell = Math.floor(-margin / cellSize);
    const columns = Math.floor((extent + margin) / cellSize) - firstCell + 1;
    for (let i = 0; i < data.length; i++) {
      if (data.length > 5000) {
        const x = this.scaler.x(data.real(i)) * this.transform.k + this.transform.x;
        const y = this.scaler.y(data.imaginary(i)) * this.transform.k + this.transform.y;
        if (x < -margin || y < -margin || x > extent + margin || y > extent + margin) {
          continue;
        }
        const cell =
          (Math.floor(y / cellSize) - firstCell) * columns + Math.floor(x / cellSize) - firstCell;
        if (cells.has(cell)) {
          continue;
        }
        cells.add(cell);
      }
      visible.push(i);
    }
    group.Element.selectAll('circle')
      .data(visible)
      .join('circle')
      .attr('cx', (index) => this.scaler.x(data.real(index)))
      .attr('cy', (index) => this.scaler.y(data.imaginary(index)))
      .attr('r', this.style.point.radius / (this.transform.k * this.viewportScale));
  }

  public setViewportScale(scale: number): void {
    if (scale === this.viewportScale || !Number.isFinite(scale) || scale <= 0) {
      return;
    }
    this.viewportScale = scale;
    this.zoomDataPoints();
  }

  public zoom(transform: TraceTransform): void {
    this.transform = transform;
    this.zoomDataPoints();
  }

  private zoomDataPoints(): void {
    this.updateLine();
    const k = this.transform.k;
    if (this.style.mode === 'line') {
      return;
    }
    if (this.data.length > 5000) {
      this.renderPoints(this.group, this.data);
    } else {
      this.group.Element.selectAll('circle').attr(
        'r',
        this.style.point.radius / (k * this.viewportScale),
      );
    }
  }

  public setColor(color: string): void {
    this.color = color;
    this.group.attr('fill', color);
    this.group.Element.select('.trace-line').attr('stroke', color);
  }

  public get Style(): TraceStyle {
    return { ...this.style, line: { ...this.style.line }, point: { ...this.style.point } };
  }

  public setStyle(options: TraceStyleOptions): void {
    const next = {
      mode: options.mode ?? this.style.mode,
      line: {
        width: options.line?.width ?? this.style.line.width,
        tolerancePx: options.line?.tolerancePx ?? this.style.line.tolerancePx,
      },
      point: { radius: options.point?.radius ?? this.style.point.radius },
    };
    if (
      next.mode === this.style.mode &&
      next.line.width === this.style.line.width &&
      next.point.radius === this.style.point.radius &&
      next.line.tolerancePx === this.style.line.tolerancePx
    ) {
      return;
    }
    const modeChanged = next.mode !== this.style.mode;
    this.style = next;
    if (modeChanged) {
      this.redraw();
    } else {
      this.group.Element.select('.trace-line').attr('stroke-width', next.line.width);
      this.zoomDataPoints();
    }
  }

  private redraw(): void {
    const group = this.drawTrace(this.data).attr('pointer-events', 'none');
    // Replace in place to retain trace ordering beneath the separate marker layer.
    this.group.Node!.replaceWith(group.Node!);
    this.group = group;
    this.group.Element.style('display', () => (this.visible ? null : 'none'));
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.group.Element.style('display', () => (visible ? null : 'none'));
  }

  public update(data: TraceBuffer): void {
    this.data = data;
    this.lineDetail = undefined;
    this.redraw();
  }

  public destroy(): void {
    this.lineDetail = undefined;
    this.lineIndices = undefined;
    this.data = TraceBuffer.empty();
    this.group.Element.remove();
  }
}
