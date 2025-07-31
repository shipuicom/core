import { NgModule } from '@angular/core';
import { ShipAlertContainerComponent } from './ship-alert-container.component';
import { ShipAlertComponent } from './ship-alert.component';

@NgModule({
  imports: [ShipAlertComponent, ShipAlertContainerComponent],
  exports: [ShipAlertComponent, ShipAlertContainerComponent],
  providers: [],
})
export class ShipAlertModule {}
