import { NgModule } from '@angular/core';
import { SparkleAlertContainerComponent } from './sparkle-alert-container.component';
import { SparkleAlertComponent } from './sparkle-alert.component';

@NgModule({
  imports: [SparkleAlertComponent, SparkleAlertContainerComponent],
  exports: [SparkleAlertComponent, SparkleAlertContainerComponent],
  // providers: [SparkleAlertService],
})
export class SparkleAlertModule {}
