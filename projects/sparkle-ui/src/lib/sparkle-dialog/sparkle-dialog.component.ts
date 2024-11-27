import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

export type SparkleDialogOptions = {
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  closeOnButton?: boolean;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
};

const DEFAULT_OPTIONS: SparkleDialogOptions = {
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
    <dialog
      spkDialog
      #dialogRef
      [style.width]="defaultOptionMerge().width ?? ''"
      [style.max-width]="defaultOptionMerge().maxWidth ?? ''"
      [style.max-height]="defaultOptionMerge().maxHeight ?? ''"
      [style.height]="defaultOptionMerge().height ?? ''">
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
  dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');
  isOpen = model<boolean>(false);
  options = input<Partial<SparkleDialogOptions>>();
  closed = output<void>();

  defaultOptionMerge = computed(() => ({
    ...DEFAULT_OPTIONS,
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
