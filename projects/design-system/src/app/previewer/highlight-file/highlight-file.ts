import { isPlatformBrowser } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import hljs from 'highlight.js';
import scss from 'highlight.js/lib/languages/scss';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

const langMap = {
  ts: 'typescript',
  html: 'xml',
  scss: 'scss',
};
@Component({
  selector: 'app-highlight-file',
  imports: [ShipButton, ShipIcon],
  templateUrl: './highlight-file.html',
  styleUrl: './highlight-file.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightFile {
  #platformId = inject(PLATFORM_ID);

  lang = input.required<'ts' | 'html' | 'scss'>();
  langClass = computed(() => `language-${langMap[this.lang()]}`);
  path = input.required<string>();

  fileResource = httpResource.text(() => `/assets/examples${this.path()}.${this.lang()}`);
  // A missing source file resolves to the SPA's index.html (or an error page)
  // rather than a network error — detect that and show a message instead.
  content = computed(() => {
    // Reading value() of an errored resource throws (NG0951) — gate on the
    // resource state first.
    if (this.fileResource.error() || !this.fileResource.hasValue()) return null;
    const value = this.fileResource.value();
    if (!value || value.trimStart().toLowerCase().startsWith('<!doctype')) return null;
    return value;
  });
  codeRef = viewChild.required<ElementRef<HTMLElement>>('codeRef');

  resourceEffect =
    isPlatformBrowser(this.#platformId) &&
    effect(() => {
      const fileContent = this.content();
      const codeElement = this.codeRef().nativeElement;

      if (fileContent && codeElement) {
        queueMicrotask(() => {
          hljs.highlightElement(codeElement);
        });
      } else {
        console.warn('Could not find <code> element within app-highlight-file for highlighting.');
      }
    });

  ngOnInit() {
    hljs.registerLanguage('typescript', typescript);
    hljs.registerLanguage('xml', xml);
    hljs.registerLanguage('scss', scss);
  }

  copied = signal(false);
  copyToClipboard() {
    const fileContent = this.content();

    if (fileContent) {
      navigator.clipboard.writeText(fileContent);

      this.copied.set(true);

      setTimeout(() => {
        this.copied.set(false);
      }, 3000);
    }
  }
}
