import { GlobalPositionStrategy, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { Injectable, inject, signal } from '@angular/core';
import { SparkleAlertType } from './sparkle-alert.component';

export type SparkleAlertItem = {
  type: SparkleAlertType;
  title: string;
  content?: string;
};

export type SparkleAlertItemInternal = SparkleAlertItem & {
  id: string;
  isOpen: boolean;
  animateOut: boolean;
  animateIn: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class SparkleAlertService {
  private overlay = inject(Overlay);

  alertHistory = signal<SparkleAlertItemInternal[]>([]);
  alertHistoryIsOpen = signal<boolean>(false);
  alertHistoryIsHidden = signal<boolean>(true);
  overlayRef: OverlayRef | null = null;
  positionStrategy = new GlobalPositionStrategy().bottom('70px').right('20px');
  // containerComponent = new ComponentPortal(SparkleAlertContainerComponent);

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
      type: 'warning',
      title: message,
    });
  }

  info(message: string) {
    this.addAlert({
      type: 'primary',
      title: message,
    });
  }

  addAlert(alert: SparkleAlertItem) {
    const id = crypto.randomUUID();

    this.alertHistory.update((history) => [
      { ...alert, isOpen: true, animateIn: true, animateOut: false, id },
      ...history,
    ]);

    // if (this.overlayRef === null) {
    //   this.addAlertContainer();
    // }

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

      if (this.alertHistory().length === 0) {
        this.removeAlertContainer();
      }
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

  // private addAlertContainer() {
  //   this.overlayRef = this.overlay.create({
  //     width: '100%',
  //     maxWidth: '320px',
  //     panelClass: 'sparkle-alert-overlay',
  //   });

  //   this.overlayRef.attach(this.containerComponent);
  // }

  private removeAlertContainer() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}
