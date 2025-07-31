import { NgModule } from '@angular/core';
import { ShipAlertContainerComponent } from './sparkle-alert-container.component';
import { ShipAlertComponent } from './sparkle-alert.component';

@NgModule({
  imports: [ShipAlertComponent, ShipAlertContainerComponent],
  exports: [ShipAlertComponent, ShipAlertContainerComponent],
  providers: [],
})
export class ShipAlertModule {}
