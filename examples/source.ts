import './style.css';
import { showCode } from './basic/highlight';

/** Display the exact executed source and the required host markup. */
export function showSource(source: string): void {
  void showCode('#source', source);
  const markup = document.querySelector('.preview')!.cloneNode(true) as HTMLElement;
  const chart = markup.querySelector('#chart')!;
  chart.replaceChildren();
  chart.setAttribute('style', 'width: 100%; max-width: 520px; aspect-ratio: 1; background: white');
  const output = markup.querySelector('output');
  if (output) {
    output.replaceChildren();
  }
  void showCode('#markup', markup.innerHTML.trim(), 'html');
}
