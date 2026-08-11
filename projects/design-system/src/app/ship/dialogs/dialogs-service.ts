import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-dialogs-service',
  imports: [ApiReference, Highlight, PropertyViewer],
  templateUrl: './dialogs-service.html',
  styleUrl: './dialogs-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DialogsService {
  codeOpenComponent = `import { Component, inject } from '@angular/core';
import { ShipDialogService } from '@ship-ui/core/ship-dialog';
import { UserProfileDialog } from './user-profile-dialog';

@Component({ /* ... */ })
export class ProfilePage {
  #dialogService = inject(ShipDialogService);

  openProfile() {
    const instance = this.#dialogService.open(UserProfileDialog, {
      data: { userId: 42 },
      closed: (result) => console.log('dialog closed with', result),
    });

    // Programmatic access to the rendered component and close handle
    instance.component; // UserProfileDialog instance
    instance.close();   // close it imperatively (optionally with a result)
  }
}`;

  codeDialogComponent = `import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-user-profile-dialog',
  template: \`
    <h2>User {{ data().userId }}</h2>
    <button (click)="closed.emit('saved')">Save</button>
  \`,
})
export class UserProfileDialog {
  // Typed by the service: \`open(UserProfileDialog, { data })\` requires this shape
  data = input.required<{ userId: number }>();
  // Emitting closes the dialog and resolves the \`closed\` callback
  closed = output<string>();
}`;

  codeOpenTemplate = `@Component({
  template: \`
    <ng-template #confirmTpl let-data let-close="close">
      <p>Delete {{ data.name }}?</p>
      <button (click)="close(true)">Yes</button>
      <button (click)="close(false)">No</button>
    </ng-template>
  \`,
})
export class DeletePage {
  #dialogService = inject(ShipDialogService);
  confirmTpl = viewChild.required<TemplateRef<unknown>>('confirmTpl');

  confirm() {
    this.#dialogService.open(this.confirmTpl(), {
      data: { name: 'report.pdf' },
      closed: (confirmed) => confirmed && this.delete(),
    });
  }
}`;

  codeOptions = `this.#dialogService.open(UserProfileDialog, {
  // ShipDialogOptions are forwarded to the ShipDialog host
  width: '600px',
  maxWidth: '90vw',
  closeOnOutsideClick: true,
  closeOnEsc: true,
  class: 'my-dialog',
});

// type: 'bottom-sheet' anchors the dialog as a native-feeling card:
// drag handle, slide-down dismiss, rides on top of the software keyboard.
this.#dialogService.open(ShareSheet, {
  type: 'bottom-sheet',
  maxWidth: '640px',
});`;
}
