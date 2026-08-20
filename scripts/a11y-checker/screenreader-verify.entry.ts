// Browser bundle entry for screenreader-verify.spec.ts: exposes the
// simulator's pure name/role computation so the spec can compare it against
// Chromium's real accessibility tree via CDP.
import { computeAccessibleName } from '../../projects/ship-ui/ship-screenreader/accname';
import { computeRole } from '../../projects/ship-ui/ship-screenreader/role';

declare global {
  interface Window {
    __shipScreenreader: {
      computeAccessibleName: typeof computeAccessibleName;
      computeRole: typeof computeRole;
    };
  }
}

window.__shipScreenreader = { computeAccessibleName, computeRole };
