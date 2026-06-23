# Touch Features Backlog - ShipUI

This backlog outlines additional touch and mobile-optimized features to be added to the ShipUI component library in future phases.

---

## 1. Tab Panel Swipe Navigation (`sh-tabs`)

- **Target Components**: Tab container (`sh-tabs` / `sh-tab-group`).
- **UX Goal**: Allow mobile users to swipe horizontally anywhere on the active tab content panel to navigate to the next or previous tab.
- **Behavior**:
  - Tracks horizontal touchmove velocity and distance.
  - Switches active tab when the swipe gesture exceeds a threshold (e.g. `50px` swipe distance with high velocity).
  - Integrates clean CSS transform translations on the tab content panel during the swipe to provide direct, real-time visual feedback under the user's finger.

## 2. Swipe-to-Dismiss Bottom Sheets (`sh-dialog`)

- **Target Components**: Modals and Dialogs (`sh-dialog`).
- **UX Goal**: On mobile screens, automatically transform centered dialog boxes into bottom sheets that slide up from the viewport bottom and can be swiped down to close.
- **Behavior**:
  - CSS media query handles transition from centered modal to docked bottom sheet.
  - A touch drag bar at the top of the sheet allows dragging the pane downward.
  - If dragged down past `30%` of the viewport height or swiped down with high velocity, automatically dismiss the dialog. Otherwise, bounce back up.

## 3. Double-Tap gestures

- **Target Components**: Editable Table Cells (`sh-table`) and List Items.
- **UX Goal**: Single touch targets can trigger normal selection, while double-tapping a cell or item quickly opens its inline edit mode.
- **Behavior**:
  - Tracks tap timing; if two taps occur within `250ms` on the same element, trigger edit actions.
  - Avoids polluting the UI with edit icon buttons.

## 4. Horizontal Scroll Indicators & Fade Fringes

- **Target Components**: Resizable & Wide Tables (`sh-table`).
- **UX Goal**: Visually indicate horizontal scroll capability in scrollable mobile tables.
- **Behavior**:
  - Fading gradients on the left/right inner edges of the scroll container.
  - The gradients automatically fade in/out based on the scroll position (`scrollLeft > 0` shows left shadow, `scrollLeft < maxScroll` shows right shadow).
