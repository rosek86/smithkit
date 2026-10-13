import {
  afterNextRender,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { Smith } from 'smithkit';
import type { SmithEvent, SmithOptions, TraceInput } from 'smithkit';

@Component({
  selector: 'smith-chart',
  standalone: true,
  template: '<div #host class="smith-host" aria-label="Smith chart"></div>',
  styles: ':host { display: block; height: 100%; } .smith-host { width: 100%; height: 100%; }',
})
export class SmithChartComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) public samples!: TraceInput;
  @Input() public options: SmithOptions = {};
  @Input() public sampleIndex = 1;
  @Output() public chartEvent = new EventEmitter<SmithEvent>();
  @ViewChild('host') private host!: ElementRef<HTMLDivElement>;
  private chart?: Smith;
  private trace?: string;
  private marker?: string;
  private unsubscribe?: () => void;
  private alive = true;
  private previousSamples?: TraceInput;
  private previousOptions?: SmithOptions;

  public constructor() {
    // Runs after the host exists in the browser, and is skipped during server rendering.
    afterNextRender(() => {
      this.chart = new Smith();
      this.chart.draw(this.host.nativeElement);
      this.unsubscribe = this.chart.onEvent((event) => {
        // A subscription can notify during an input update; defer parent changes.
        queueMicrotask(() => {
          if (this.alive) {
            this.chartEvent.emit(event);
          }
        });
      });
      this.update();
    });
  }

  public ngOnChanges(): void {
    this.update();
  }

  private update(): void {
    if (!this.chart) {
      return;
    }
    if (this.options !== this.previousOptions) {
      this.chart.setOptions(this.options);
      this.previousOptions = this.options;
    }
    if (this.samples !== this.previousSamples) {
      if (this.trace) {
        this.chart.updateTrace(this.trace, this.samples);
      } else {
        this.trace = this.chart.addTrace(this.samples, { name: 'Measured sweep', mode: 'both' });
        this.marker = this.chart.addMarker(this.trace)!;
      }
      this.previousSamples = this.samples;
    }
    if (this.chart.getMarker(this.marker!)?.sampleIndex !== this.sampleIndex) {
      this.chart.setMarkerSample(this.marker!, this.sampleIndex);
    }
  }

  public ngOnDestroy(): void {
    this.alive = false;
    this.unsubscribe?.();
    this.chart?.destroy();
  }
}
