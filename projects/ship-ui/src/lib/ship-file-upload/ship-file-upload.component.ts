import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ShipFormField } from '../ship-form-field/ship-form-field.component';
import { ShipIcon } from '../ship-icon/ship-icon';

@Component({
  selector: 'sh-file-upload',
  imports: [ShipFormField, ShipIcon],
  template: `
    <sh-form-field [class]="fileUploadClasses()">
      <ng-content select="label" ngProjectAs="label"></ng-content>

      <div class="input" ngProjectAs="input" #inputWrap>
        @if (files().length === 1) {
          <div class="files-text">{{ files()[0].name }}</div>
        } @else if (files().length > 1) {
          <div class="files-text">{{ files().length }} files selected</div>
        } @else {
          <div class="placeholder">{{ filesOver() ? overlayText() : placeholder() }}</div>
        }
        <input type="file" [attr.multiple]="multiple()" [attr.accept]="accept()" #input />
        <div class="bg-overlay" [class.files-over]="filesOver()"></div>
      </div>

      <sh-icon suffix>upload-simple</sh-icon>
    </sh-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipFileUploadComponent {
  _el = inject(ElementRef);
  inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');
  filesOver = signal(false);
  multiple = input<boolean | null>();
  accept = input<string | null>(null);
  placeholder = model<string>('Click or drag files here');
  overlayText = input<string>('Drop files here');
  files = model<File[]>([]);

  fileUploadClasses = computed(() => this._el.nativeElement.classList.toString());

  handleFileUpload(newFiles: File[]) {
    if (this.multiple()) {
      this.files.update((currentFiles) => [...currentFiles, ...newFiles]);
    } else {
      this.files.set(newFiles);
    }
  }

  inputEffect = effect(() => {
    const input = this.inputRef().nativeElement;

    if (!input) return;

    if (input.placeholder) {
      this.placeholder.set(input.placeholder);
    }

    input.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.filesOver.set(true);
    });

    input.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.filesOver.set(false);
    });

    input.addEventListener('drop', (e) => {
      e.preventDefault();
      this.filesOver.set(false);

      const files = e.dataTransfer?.files;

      if (files && files.length > 0) {
        this.handleFileUpload(Array.from(files));

        (input as HTMLInputElement).files = files;
      }
    });

    input.addEventListener('change', (e: any) => {
      e.preventDefault();
      this.handleFileUpload(Array.from(e.target.files));
    });
  });
}
