import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  viewChild,
} from '@angular/core';

export type SparkleDialogOptions = {
  width?: string;
  height?: string;
  closeOnButton?: boolean;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
};

const DEFAULT_OPTIONS: SparkleDialogOptions = {
  width: undefined,
  height: undefined,
  closeOnButton: true,
  closeOnEsc: true,
  closeOnOutsideClick: true,
};

@Component({
  selector: 'spk-dialog',
  standalone: true,
  imports: [],
  template: `
    <dialog
      #dialogRef
      [style.width]="defaultOptionMerge().width ?? ''"
      [style.height]="defaultOptionMerge().height ?? ''">
      <div class="dialog-content">
        <ng-content />
      </div>

      @if (isOpen()) {
        <div class="dialog-backdrop" (click)="defaultOptionMerge().closeOnOutsideClick && isOpen.set(false)"></div>
      }
    </dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleDialogComponent {
  dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');
  isOpen = model<boolean>(false);
  options = input<Partial<SparkleDialogOptions>>();

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
      dialogEl?.close();
    }
  });
}
