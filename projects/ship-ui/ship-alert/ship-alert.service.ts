import { Injectable, signal } from '@angular/core';
import { generateUniqueId } from '@ship-ui/core';
import { ShipAlertType } from './ship-alert';

export type ShipAlertItem = {
  type: ShipAlertType;
  title: string;
  content?: string;
};

export type ShipAlertItemInternal = ShipAlertItem & {
  id: string;
  isOpen: boolean;
  animateOut: boolean;
  animateIn: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class ShipAlertService {
  /** Reactive list of active/queued alerts, newest first. */
  alertHistory = signal<ShipAlertItemInternal[]>([]);
  /** Whether the alert history panel is expanded. */
  alertHistoryIsOpen = signal<boolean>(false);
  /** Whether the alert history panel is hidden. */
  alertHistoryIsHidden = signal<boolean>(true);

  /** Show an `error` alert (falls back to a default message when none is given). */
  error(message: string | null | undefined) {
    this.addAlert({
      type: 'error',
      title: message ?? 'An error occured',
    });
  }

  /** Show a `success` alert with the given message. */
  success(message: string) {
    this.addAlert({
      type: 'success',
      title: message,
    });
  }

  /** Show a `question` alert with the given message. */
  question(message: string) {
    this.addAlert({
      type: 'question',
      title: message,
    });
  }

  /** Show a `warn` alert with the given message. */
  warning(message: string) {
    this.addAlert({
      type: 'warn',
      title: message,
    });
  }

  /** Show an informational (`primary`) alert with the given message. */
  info(message: string) {
    this.addAlert({
      type: 'primary',
      title: message,
    });
  }

  /** Add an alert to the history, animate it in, and auto-hide it after a timeout. */
  addAlert(alert: ShipAlertItem) {
    const id = generateUniqueId();

    this.alertHistory.update((history) => [
      { ...alert, isOpen: true, animateIn: true, animateOut: false, id },
      ...history,
    ]);

    setTimeout(() => {
      this.alertHistory.update((history) =>
        history.map((item) => ({
          ...item,
          animateIn: item.id === id ? false : item.animateIn,
        }))
      );
    }, 40);

    setTimeout(() => {
      this.hideAlert(id);
    }, 2500);
  }

  /** Animate out and remove the alert with the given `id` from the history. */
  removeAlert(id: string) {
    this.alertHistory.update((history) =>
      history.map((item) => ({
        ...item,
        animateOut: item.id === id ? false : item.animateOut,
      }))
    );

    setTimeout(() => {
      this.alertHistory.update((history) => history.filter((item) => item.id !== id));
    }, 300);
  }

  /** Mark the alert with the given `id` as closed without removing it from the history. */
  hideAlert(id: string) {
    this.alertHistory.update((history) =>
      history.map((item) => ({
        ...item,
        isOpen: item.id === id ? false : item.isOpen,
      }))
    );
  }

  /** Set whether the alert history panel is hidden. */
  setHidden(isHidden: boolean) {
    this.alertHistoryIsHidden.set(isHidden);
  }
}
