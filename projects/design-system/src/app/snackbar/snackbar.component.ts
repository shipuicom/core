import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SparkleAlertComponent, SparkleAlertContainerComponent, SparkleAlertService } from '../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [MatSnackBarModule, MatIconModule, MatButtonModule, MatDividerModule, SparkleAlertComponent, SparkleAlertContainerComponent],
  templateUrl: './snackbar.component.html',
  styleUrl: './snackbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SnackbarComponent {
  sparkleAlertService = inject(SparkleAlertService);

  count = 0;

  ngOnInit() {
    this.sparkleAlertService.addAlert({
      type: 'error',
      title: 'Error',
      content: 'This is an error',
    });
    this.sparkleAlertService.addAlert({
      type: 'primary',
      title: 'Info',
      content: 'This is an info',
    });

    setTimeout(() => {
      this.sparkleAlertService.addAlert({
        type: 'primary',
        title: 'Short info',
      });
    }, 5000);
  }

  addAlert() {
    this.count += 1;

    this.sparkleAlertService.addAlert({
      type: 'question',
      title: 'Yet another question? - ' + this.count,
    });
  }
}
