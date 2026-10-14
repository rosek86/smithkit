import './style.css';
import { showCode } from './basic/highlight';
import { format } from 'prettier/standalone';
import * as htmlPlugin from 'prettier/plugins/html';

/** Display the exact executed source and the required host markup. */
export async function showSource(source: string): Promise<void> {
  void showCode('#source', source);
  const markup = document.querySelector('.preview')!.cloneNode(true) as HTMLElement;
  const chart = markup.querySelector('#chart')!;
  chart.replaceChildren();
  chart.setAttribute('style', 'width: 100%; max-width: 520px; aspect-ratio: 1; background: white');
  const output = markup.querySelector('output');
  if (output) {
    output.replaceChildren();
  }
  const formattedMarkup = await format(markup.innerHTML, {
    parser: 'html',
    plugins: [htmlPlugin],
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    htmlWhitespaceSensitivity: 'ignore',
  });
  await showCode('#markup', formattedMarkup.trimEnd(), 'html');
}
