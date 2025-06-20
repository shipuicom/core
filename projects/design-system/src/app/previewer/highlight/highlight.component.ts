import { ChangeDetectionStrategy, Component, computed, ElementRef, input, signal, viewChild } from '@angular/core';
import hljs from 'highlight.js';
import scss from 'highlight.js/lib/languages/scss';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { SparkleButtonComponent, SparkleIconComponent } from '../../../../../sparkle-ui/src/public-api';

const langMap = {
  ts: 'typescript',
  html: 'xml',
  scss: 'scss',
};

@Component({
  selector: 'app-highlight',
  imports: [SparkleButtonComponent, SparkleIconComponent],
  templateUrl: './highlight.component.html',
  styleUrl: './highlight.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightComponent {
  lang = input.required<'ts' | 'html' | 'scss'>();
  content = input.required<string>();
  langClass = computed(() => `language-${langMap[this.lang()]}`);

  codeRef = viewChild.required<ElementRef<HTMLElement>>('codeRef');

  ngOnInit() {
    hljs.registerLanguage('typescript', typescript);
    hljs.registerLanguage('xml', xml);
    hljs.registerLanguage('scss', scss);
  }

  ngAfterViewInit() {
    const codeElement = this.codeRef().nativeElement;

    if (codeElement) {
      hljs.highlightElement(codeElement);
    } else {
      console.warn('Could not find <code> element within app-highlight-file for highlighting.');
    }
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
