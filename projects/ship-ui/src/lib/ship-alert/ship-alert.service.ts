import { Injectable, signal } from '@angular/core';
import { generateUniqueId } from '../utilities/random-id';
import { ShipAlertType } from './ship-alert.component';

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
  alertHistory = signal<ShipAlertItemInternal[]>([]);
  alertHistoryIsOpen = signal<boolean>(false);
  alertHistoryIsHidden = signal<boolean>(true);

  error(message: string | null | undefined) {
    this.addAlert({
      type: 'error',
      title: message ?? 'An error occured',
    });
  }

  success(message: string) {
    this.addAlert({
      type: 'success',
      title: message,
    });
  }

  question(message: string) {
    this.addAlert({
      type: 'question',
      title: message,
    });
  }

  warning(message: string) {
    this.addAlert({
      type: 'warn',
      title: message,
    });
  }

  info(message: string) {
    this.addAlert({
      type: 'primary',
      title: message,
    });
  }

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

  hideAlert(id: string) {
    this.alertHistory.update((history) =>
      history.map((item) => ({
        ...item,
        isOpen: item.id === id ? false : item.isOpen,
      }))
    );
  }

  setHidden(isHidden: boolean) {
    this.alertHistoryIsHidden.set(isHidden);
  }
}
