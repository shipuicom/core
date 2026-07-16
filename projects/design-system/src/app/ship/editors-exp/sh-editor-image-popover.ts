import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipPopover } from '@ship-ui/core/ship-popover';
import { EditorEngineService } from './editor-engine.service';
import { isSafeUrl } from './editor-sanitize';
import { LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';

/**
 * Image insertion popover — a URL field plus a file picker (read to a
 * `data:` URL). Opened by the engine's `uiRequest` for the 'image' action
 * (toolbar image button, or a future slash command). On confirm it calls
 * `engine.insertImage`, which drops the image as its own block and selects it
 * so the contextual toolbar appears.
 *
 * URLs are validated with the same `isSafeUrl` the sanitizer uses (data:image/*
 * allowed); bare domains get an https:// prefix.
 */
@Component({
  selector: 'sh-editor-image-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipPopover, ShipFormField, ShipButton, ShipIcon],
  template: `
    <div class="sh-editor-link-anchor" [style.top.px]="top()" [style.left.px]="left()">
      <sh-popover [(isOpen)]="isOpen" (closed)="onClosed()" [disableOpenByClick]="true" [asSheetOnMobile]="true" [options]="{ closeOnButton: false, closeOnEsc: true }">
        <div class="sh-editor-popover sh-editor-image-form" (keydown)="onFormKeydown($event)">
          <div class="sh-editor-popover-header">
            <sh-icon>image</sh-icon>
            <span>Insert image</span>
          </div>
          <sh-form-field size="small">
            <label>Image URL</label>
            <input
              #urlInput
              type="text"
              autofocus
              placeholder="https://example.com/image.jpg"
              [value]="url()"
              (input)="url.set($any($event.target).value); error.set(null)" />
            @if (error(); as message) {
              <span error role="alert">{{ message }}</span>
            }
          </sh-form-field>
          <input #fileInput type="file" accept="image/*" hidden (change)="onFile($event)" />
          <div class="sh-editor-popover-actions">
            <button shButton noBg [disabled]="uploading()" (click)="fileInput.click()">
              <sh-icon>upload-simple</sh-icon>
              {{ uploading() ? 'Uploading…' : 'Upload' }}
            </button>
            <span class="sh-editor-popover-spacer"></span>
            <button shButton color="primary" [disabled]="uploading()" (click)="apply()">Insert</button>
          </div>
        </div>
      </sh-popover>
    </div>
  `,
})
export class ShipEditorImagePopover {
  surface = input.required<HTMLElement>();
  /** Optional upload handler. When provided, a picked file is handed to it and
   * the resolved URL is inserted (e.g. an S3/CDN link); otherwise the file is
   * inlined as a `data:` URL. Rejections surface as an inline error. */
  upload = input<((file: File) => Promise<string>) | null>(null);

  engine = inject(EditorEngineService);
  selection = inject(EditorSelectionService);
  #selfRef = inject(ElementRef<HTMLElement>);

  urlInput = viewChild<ElementRef<HTMLInputElement>>('urlInput');

  isOpen = signal(false);
  url = signal('');
  error = signal<string | null>(null);
  uploading = signal(false);
  top = signal(0);
  left = signal(0);

  #savedSelection: LogicalSelection | null = null;

  constructor() {
    effect(() => {
      const request = this.engine.uiRequest();
      if (request?.action !== 'image') return;
      untracked(() => {
        this.engine.uiRequest.set(null);
        this.#open();
      });
    });
    effect(() => {
      if (this.isOpen()) queueMicrotask(() => this.urlInput()?.nativeElement.focus());
    });
  }

  #open() {
    const sel = this.selection.active();
    if (!sel) return;
    this.#savedSelection = structuredClone(sel);
    this.url.set('');
    this.error.set(null);

    const container = this.#selfRef.nativeElement.closest('.sh-editor-container') as HTMLElement | null;
    const containerRect = container?.getBoundingClientRect();
    const domSel = typeof window !== 'undefined' ? window.getSelection() : null;
    const rect = domSel && domSel.rangeCount > 0 ? domSel.getRangeAt(0).getBoundingClientRect() : null;
    if (rect && containerRect && (rect.width > 0 || rect.height > 0)) {
      this.top.set(rect.bottom - containerRect.top);
      this.left.set(rect.left + rect.width / 2 - containerRect.left);
    } else if (containerRect) {
      this.top.set(48);
      this.left.set(containerRect.width / 2);
    }
    this.isOpen.set(true);
  }

  onFormKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.apply();
    }
  }

  async onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // let the same file be re-picked after an error
    if (!file) return;

    const upload = this.upload();
    if (upload) {
      this.uploading.set(true);
      this.error.set(null);
      try {
        this.#insert(await upload(file), file.name);
      } catch {
        this.error.set('Upload failed — try again or paste a URL.');
      } finally {
        this.uploading.set(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.#insert(String(reader.result), file.name);
    reader.readAsDataURL(file);
  }

  apply() {
    const raw = this.url().trim();
    if (!raw) {
      this.error.set('Enter a URL or upload a file.');
      return;
    }
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
    const isRelative = raw.startsWith('/') || raw.startsWith('#') || raw.startsWith('?');
    const normalized = hasScheme || isRelative ? raw : `https://${raw}`;
    if (!isSafeUrl(normalized, { allowDataImage: true })) {
      this.error.set('That URL scheme is not allowed.');
      return;
    }
    this.#insert(normalized, '');
  }

  #insert(src: string, alt: string) {
    if (this.#savedSelection) this.selection.live.set(structuredClone(this.#savedSelection));
    this.engine.insertImage({ src, alt, mode: 'content', size: 'auto' });
    this.isOpen.set(false);
  }

  onClosed() {
    this.#savedSelection = null;
    // If an image was just inserted it is now the selected block; the editor's
    // block-selection effect owns focus + the node selection for it, so a focus
    // here would only collapse that selection and race it. Only refocus when the
    // popover was dismissed without inserting (nothing selected).
    if (this.engine.selectedBlock() === null) this.surface().focus();
  }
}
