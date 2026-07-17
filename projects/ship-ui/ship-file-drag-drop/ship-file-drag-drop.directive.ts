import { Directive, HostListener, output, signal } from '@angular/core';

@Directive({
  selector: '[shDragDrop]',
  standalone: true,
  host: {
    '[class.filesover]': 'filesOver()',
  },
})
export class ShipFileDragDrop {
  filesOver = signal(false);
  /** Emits the dropped `FileList` when one or more files are released over the host element. */
  filesDropped = output<FileList>();

  @HostListener('dragover', ['$event']) onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.filesOver.set(true);
  }

  @HostListener('dragleave', ['$event']) onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.filesOver.set(false);
  }

  @HostListener('drop', ['$event']) ondrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.filesOver.set(false);
    const files = e.dataTransfer?.files;

    if (files && files.length > 0) {
      this.filesDropped.emit(files);
    }
  }
}
