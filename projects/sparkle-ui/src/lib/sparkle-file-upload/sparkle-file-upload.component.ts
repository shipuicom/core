import { ChangeDetectionStrategy, Component, effect, ElementRef, input, model, signal, viewChild } from '@angular/core';
import { SparkleFormFieldComponent } from '../sparkle-form-field/sparkle-form-field.component';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';

@Component({
  selector: 'spk-file-upload',
  imports: [SparkleFormFieldComponent, SparkleIconComponent],
  template: `
    <spk-form-field>
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

      <spk-icon suffix>upload-simple</spk-icon>
    </spk-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleFileUploadComponent {
  inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');
  filesOver = signal(false);
  multiple = input<boolean | null>();
  accept = input<string | null>(null);
  placeholder = model<string>('Click or drag files here');
  overlayText = input<string>('Drop files here');
  files = model<File[]>([]);

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
