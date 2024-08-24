import { Directive, HostListener, output, signal } from '@angular/core';

@Directive({
  selector: '[spkDragDrop]',
  standalone: true,
  host: {
    '[class.fileover]': 'fileOver()',
  },
})
export class SparkleDragDropDirective {
  fileOver = signal(false);

  fileDropped = output<FileList>();

  @HostListener('dragover', ['$event']) onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.fileOver.set(true);
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.fileOver.set(false);
  }

  @HostListener('drop', ['$event']) public ondrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.fileOver.set(false);
    const files = e.dataTransfer?.files;

    if (files && files.length > 0) {
      this.fileDropped.emit(files);
    }
  }
}
