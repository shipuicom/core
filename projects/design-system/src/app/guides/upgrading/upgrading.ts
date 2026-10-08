import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-upgrading',
  imports: [Highlight, PropertyViewer, RouterLink],
  templateUrl: './upgrading.html',
  styleUrl: './upgrading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Upgrading {
  readonly MIGRATION_URL = 'https://github.com/shipuicom/core/blob/main/projects/ship-ui/MIGRATION.md';

  readonly STEPS = `npm i @ship-ui/core@latest
npx ship-migrate --dry-run          # what would change under ./src, nothing written
npx ship-migrate                    # rewrite ./src in place
npx ship-migrate projects/app/src   # another folder`;

  readonly OUTPUT = `● src/app/settings/settings.html
    :12  <ship-theme-toggle> → <sh-theme-toggle>
    :30  .warning → .warn
    :41  <sh-card color> removed (it had no effect)
● src/app/shared/badge.html
    :4  ⚠ "warning" on an element that is not sh-form-field/sh-form-field-popover — rename to "warn" if it is a ShipUI colour

0.26.0: 214 files scanned, 18 changed (41 edits), 3 warnings to review.`;

  readonly VALUE_SYNC = `<!-- old behaviour: value / the form control update on every keystroke -->
<sh-code [(value)]="source" valueSync="immediate" />`;
}
