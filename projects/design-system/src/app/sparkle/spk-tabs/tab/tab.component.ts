import { ChangeDetectionStrategy, Component, inject, input, TemplateRef, viewChild } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SparkleButtonComponent } from '@sparkle-ui/core';

@Component({
  selector: 'app-tab',
  standalone: true,
  imports: [MatDialogModule, SparkleButtonComponent],
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabComponent {
  #dialog = inject(MatDialog);

  id = input.required();

  myDialog = viewChild.required<TemplateRef<any>>('myDialog');

  openDialog() {
    const dialogRef = this.#dialog.open(this.myDialog(), {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('result: ', result);
      }
    });
  }
}
