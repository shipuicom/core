import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { SHIP_CONFIG } from '../utilities/ship-config';

export type ShipDialogOptions = {
  class?: 'default' | 'type-b' | string;
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  closeOnButton?: boolean;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
};

const DEFAULT_OPTIONS: ShipDialogOptions = {
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
  selector: 'sh-dialog',
  imports: [],
  template: `
    @let options = this.defaultOptionMerge();
    <dialog
      shDialog
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
export class ShipDialogComponent {
  #document = inject(DOCUMENT);
  #shConfig = inject(SHIP_CONFIG, { optional: true });
  dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');
  isOpen = model<boolean>(false);
  options = input<Partial<ShipDialogOptions>>();
  closed = output<void>();

  defaultOptionMerge = computed(() => ({
    ...DEFAULT_OPTIONS,
    ...{ class: this.#shConfig?.dialogType ?? 'default' },
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

      this.#document.addEventListener(
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
