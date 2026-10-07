import { Directive, output, signal } from '@angular/core';

@Directive({
  selector: '[shDragDrop]',
  host: {
    '[class.filesover]': 'filesOver()',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'ondrop($event)',
  },
})
export class ShipFileDragDrop {
  filesOver = signal(false);
  /** Emits the dropped `FileList` when one or more files are released over the host element. */
  filesDropped = output<FileList>();

  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.filesOver.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.filesOver.set(false);
  }

  ondrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.filesOver.set(false);
    const files = e.dataTransfer?.files;

    if (files && files.length > 0) {
      this.filesDropped.emit(files);
    }
  }
}
