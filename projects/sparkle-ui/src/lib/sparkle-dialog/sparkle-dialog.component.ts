import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { SPARKLE_CONFIG } from '../utilities/sparkle-config';

export type SparkleDialogOptions = {
  class?: 'default' | 'type-b';
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  closeOnButton?: boolean;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
};

const DEFAULT_OPTIONS: SparkleDialogOptions = {
  class: 'default',
  width: undefined,
  maxWidth: undefined,
  height: undefined,
  maxHeight: undefined,
  closeOnButton: true,
  closeOnEsc: true,
  closeOnOutsideClick: true,
};

@Component({
  selector: 'spk-dialog',
  imports: [],
  template: `
    @let options = this.defaultOptionMerge();
    <dialog
      spkDialog
      #dialogRef
      [class]="options.class"
      [style.width]="options.width ?? ''"
      [style.max-width]="options.maxWidth ?? ''"
      [style.max-height]="options.maxHeight ?? ''"
      [style.height]="options.height ?? ''">
      <div class="content">
        <ng-content />
      </div>

      @if (this.defaultOptionMerge().closeOnOutsideClick) {
        <div class="closeable-overlay" (click)="isOpen.set(false)"></div>
      }
    </dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleDialogComponent {
  #spkConfig = inject(SPARKLE_CONFIG, { optional: true });
  dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');
  isOpen = model<boolean>(false);
  options = input<Partial<SparkleDialogOptions>>();
  closed = output<void>();

  defaultOptionMerge = computed(() => ({
    ...DEFAULT_OPTIONS,
    ...{ class: this.#spkConfig?.dialogType ?? 'default' },
    ...this.options(),
  }));

  abortController: AbortController | null = null;
  isOpenEffect = effect(() => {
    const dialogEl = this.dialogRef()?.nativeElement;

    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    if (this.isOpen()) {
      dialogEl?.showModal();
      dialogEl?.addEventListener(
        'close',
        () => {
          this.isOpen.set(false);
          this.closed.emit();
        },
        {
          signal: this.abortController?.signal,
        }
      );

      document.addEventListener(
        'keydown',
        (e) => {
          if (e.key === 'Escape' && !this.defaultOptionMerge().closeOnEsc) {
            e.preventDefault();
          }

          if (e.key === 'Escape' && this.defaultOptionMerge().closeOnEsc) {
            this.isOpen.set(false);
          }
        },
        {
          signal: this.abortController?.signal,
        }
      );
    } else {
      this.closed.emit();
      dialogEl?.close();
    }
  });

  ngOnDestroy() {
    this.abortController?.abort();
  }
}
