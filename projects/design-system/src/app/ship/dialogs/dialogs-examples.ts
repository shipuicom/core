import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { Previewer } from '../../previewer/previewer';
import { BasicDynamicDialog } from './examples/basic-dynamic-dialog/basic-dynamic-dialog';
import { BottomSheetDialog } from './examples/bottom-sheet-dialog/bottom-sheet-dialog';
import { DataPassingDialog } from './examples/data-passing-dialog/data-passing-dialog';
import { DialogAsComponent } from './examples/dialog-as-component/dialog-as-component';
import { HeaderFooterDialog } from './examples/header-footer-dialog/header-footer-dialog';
import { TemplateDialog } from './examples/template-dialog/template-dialog';

@Component({
  selector: 'app-dialogs-examples',
  imports: [
    Previewer,
    BasicDynamicDialog,
    BottomSheetDialog,
    HeaderFooterDialog,
    DataPassingDialog,
    DialogAsComponent,
    TemplateDialog,
    ShipButtonGroup,
  ],
  templateUrl: './dialogs-examples.html',
  styleUrl: './dialogs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DialogsExamples {
  type = signal('');
}
