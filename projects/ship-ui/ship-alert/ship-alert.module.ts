import { NgModule } from '@angular/core';
import { ShipAlert } from './ship-alert';
import { ShipAlertContainer } from './ship-alert-container';

@NgModule({
  imports: [ShipAlert, ShipAlertContainer],
  exports: [ShipAlert, ShipAlertContainer],
  providers: [],
})
export class ShipAlertModule {}
