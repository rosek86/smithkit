import { createHighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import html from 'shiki/langs/html.mjs';
import tsx from 'shiki/langs/tsx.mjs';
import typescript from 'shiki/langs/typescript.mjs';
import darkPlus from 'shiki/themes/dark-plus.mjs';

// Keep this helper in the independently runnable basic example. The gallery shares it.
// Match TypeDoc's dark theme and load only the languages displayed in our examples.
const highlighter = createHighlighterCore({
  themes: [darkPlus],
  langs: [html, tsx, typescript],
  engine: createOnigurumaEngine(import('shiki/wasm')),
});

/** Color source without changing its copyable text or interpreting HTML examples as markup. */
export async function showCode(
  selector: string,
  source: string,
  language: 'typescript' | 'tsx' | 'html' = 'typescript',
): Promise<void> {
  const code = document.querySelector<HTMLElement>(selector)!;
  code.textContent = source;
  const { tokens, fg, bg } = (await highlighter).codeToTokens(source, {
    lang: language,
    theme: 'dark-plus',
  });
  const fragment = document.createDocumentFragment();
  tokens.forEach((line, index) => {
    if (index > 0) {
      fragment.append('\n');
    }
    for (const token of line) {
      const span = document.createElement('span');
      span.textContent = token.content;
      span.style.color = token.color ?? fg ?? '';
      if (token.fontStyle && token.fontStyle > 0) {
        span.style.fontStyle = token.fontStyle & 1 ? 'italic' : '';
        span.style.fontWeight = token.fontStyle & 2 ? 'bold' : '';
        span.style.textDecoration = token.fontStyle & 4 ? 'underline' : '';
      }
      fragment.append(span);
    }
  });
  code.replaceChildren(fragment);
  code.style.color = fg ?? '';
  code.closest('pre')!.style.backgroundColor = bg ?? '';
}
