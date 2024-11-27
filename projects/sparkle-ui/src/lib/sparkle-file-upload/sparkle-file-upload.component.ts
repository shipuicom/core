import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { SparkleFormFieldComponent } from '../sparkle-form-field/sparkle-form-field.component';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';

@Component({
  selector: 'spk-file-upload',
  imports: [SparkleFormFieldComponent, SparkleIconComponent],
  template: `
    <spk-form-field (fileDropped)="onFileDropped($any($event))">
      <ng-content select="label" ngProjectAs="label"></ng-content>

      <div class="input" ngProjectAs="input" #inputWrap>
        <ng-content select="input"></ng-content>
      </div>

      <spk-icon suffix>upload-simple</spk-icon>
    </spk-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleFileUploadComponent {
  #selfRef = inject(ElementRef<SparkleFileUploadComponent>);
  inputWrapRef = viewChild.required<ElementRef<HTMLDivElement>>('inputWrap');
  #inputRef = signal<HTMLInputElement | null>(null);
  #triggerInput = signal(false);
  files = model<File[]>([]);

  inputRefEffect = effect(() => {
    this.#triggerInput();
    const input = this.#selfRef.nativeElement.querySelector('input');

    if (input) {
      input.autocomplete = 'off';
      this.#inputRef.set(input);
      this.#newInput();
    }
  });

  ngOnInit() {
    this.#inputObserver.observe(this.inputWrapRef().nativeElement, {
      childList: true,
      subtree: true,
    });
  }

  onFileDropped(files: FileList) {
    this.handleFileUpload(Array.from(files));
  }

  handleFileUpload(newFiles: File[]) {
    this.files.update((currentFiles) => [...currentFiles, ...newFiles]);
  }

  inputController: AbortController | null = null;

  #newInput() {
    if (this.inputController) {
      this.inputController.abort();
    }

    this.inputController = new AbortController();

    const input = this.#inputRef();

    if (!input) return;

    input.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;

      if (files && files.length > 0) {
        this.handleFileUpload(Array.from(files));
      }
    });
  }

  #inputObserver = new MutationObserver((mutations) => {
    for (var mutation of mutations) {
      if (mutation.type == 'childList') {
        this.#triggerInput.set(!this.#triggerInput());
      }
    }
  });

  ngOnDestroy() {
    if (this.#inputObserver) {
      this.#inputObserver.disconnect();
    }
  }
}
