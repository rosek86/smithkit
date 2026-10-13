// The gallery uses JIT to keep this example within its existing Vite build.
// Normal Angular CLI applications compile these same components ahead of time.
import '@angular/compiler';
import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SmithEventType } from 'smithkit';
import type { SmithEvent, SmithOptions } from 'smithkit';
import { SmithChartComponent } from './SmithChartComponent';
import { sweeps, markerReading } from '../framework-data';

@Component({
  selector: 'framework-example',
  standalone: true,
  imports: [SmithChartComponent],
  template: `
    <div class="controls">
      <button (click)="mounted.set(!mounted())">
        {{ mounted() ? 'Unmount chart' : 'Mount chart' }}
      </button>
      <button [disabled]="!mounted()" (click)="alternate.set(!alternate())">Replace sweep</button>
      <label
        ><input type="checkbox" [checked]="dark()" (change)="setDark($event)" /> Dark theme</label
      >
      <label
        ><input
          type="checkbox"
          [checked]="compact()"
          (change)="compact.set($any($event.target).checked)"
        />
        Compact chart</label
      >
      <label
        >Marker sample
        <input
          type="range"
          min="0"
          max="2"
          [value]="sampleIndex()"
          [disabled]="!mounted()"
          (input)="sampleIndex.set($any($event.target).valueAsNumber)"
      /></label>
    </div>
    <div id="chart" [class.compact]="compact()">
      @if (mounted()) {
        <smith-chart
          [samples]="sweeps[alternate() ? 1 : 0]"
          [options]="options()"
          [sampleIndex]="sampleIndex()"
          (chartEvent)="onChartEvent($event)"
        />
      }
    </div>
    <output id="reading">{{ mounted() ? reading() : 'No chart mounted.' }}</output>
    <p class="hint">
      Marker events received: <span id="event-count">{{ events() }}</span>
    </p>
  `,
})
export class Example {
  public readonly sweeps = sweeps;
  public readonly mounted = signal(true);
  public readonly alternate = signal(false);
  public readonly compact = signal(false);
  public readonly dark = signal(false);
  public readonly sampleIndex = signal(1);
  public readonly reading = signal('Waiting for marker…');
  public readonly events = signal(0);
  public readonly options = signal<SmithOptions>({
    interaction: { cursor: true },
    grid: { detail: 'basic' },
  });

  public setDark(event: Event): void {
    const dark = (event.target as HTMLInputElement).checked;
    this.dark.set(dark);
    this.options.set({ ...this.options(), appearance: { theme: dark ? 'dark' : 'light' } });
  }

  public onChartEvent(event: SmithEvent): void {
    const value = markerReading(event);
    if (value !== undefined && event.type === SmithEventType.Marker) {
      this.sampleIndex.set(event.data.sampleIndex);
      this.reading.set(value);
      this.events.update((count) => count + 1);
    }
  }
}

// Angular 22 uses zoneless change detection; signals schedule parent UI updates.
const application = await bootstrapApplication(Example);
if (import.meta.hot) {
  import.meta.hot.dispose(() => application.destroy());
}
