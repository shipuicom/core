import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  inject,
  Injectable,
  isSignal,
  OutputEmitterRef,
  OutputRefSubscription,
  Type,
} from '@angular/core';
import { ShipDialogComponent, ShipDialogOptions } from './sparkle-dialog.component';

export interface ShipDialogServiceOptions<T = any> extends ShipDialogOptions {
  data?: T;
  closed?: (...args: any[]) => void;
}

export type ShipDialogReturn<T> = ReturnType<ShipDialogService['open']> & {
  component: T;
};

@Injectable({
  providedIn: 'root',
})
export class ShipDialogService {
  #bodyEl = typeof document !== 'undefined' ? document.querySelector('body') : null;
  #appRef = inject(ApplicationRef);

  compRef: ComponentRef<ShipDialogComponent> | null = null;
  insertedCompRef: ComponentRef<unknown> | null = null;

  closedFieldSub: OutputRefSubscription | null = null;
  compClosedSub: OutputRefSubscription | null = null;

  open<T, K = any>(component: Type<T>, options?: ShipDialogServiceOptions<K>) {
    const environmentInjector = this.#appRef.injector;
    const hostElement = this.#createEl();

    const { data, closed, ...rest } = options || {};

    if (this.compRef) {
      this.#cleanupRefs();
    }

    this.insertedCompRef = createComponent<T>(component, {
      environmentInjector,
    });

    this.compRef = createComponent(ShipDialogComponent, {
      hostElement,
      environmentInjector,
      projectableNodes: [[this.insertedCompRef.location.nativeElement]],
    });

    const dataField = (this.insertedCompRef.instance as any)?.data;
    const closedField = (this.insertedCompRef.instance as any)?.closed;

    if (data) {
      if (isSignal(dataField)) {
        this.insertedCompRef.setInput('data', data);
      } else if (!isSignal(dataField)) {
        throw new Error('data is not an input signal on the passed component');
      }
    }

    if (closedField instanceof OutputEmitterRef) {
      this.closedFieldSub = closedField.subscribe((...args: any[]) => {
        closed?.(...args);

        this.#cleanupRefs();
      });
    }

    this.#appRef.attachView(this.insertedCompRef.hostView);
    this.#appRef.attachView(this.compRef.hostView);

    this.insertedCompRef.changeDetectorRef.detectChanges();
    this.compRef.changeDetectorRef.detectChanges();
    this.compRef.instance.isOpen.set(true);
    this.compRef.setInput('options', rest);
    this.compRef.instance.closed.subscribe(() => closeAction());

    const _self = this;

    function closeAction() {
      if (closedField && closedField instanceof OutputEmitterRef) {
        closedField.emit(false);
      } else {
        closed?.(undefined);
      }

      _self.#cleanupRefs();
    }

    return {
      component: this.insertedCompRef.instance as T,
      close: closeAction,
    };
  }

  #createEl(): Element {
    const wrapperEl = document.createElement('sh-dialog-ref');
    wrapperEl.id = 'sh-dialog-ref';

    if (!document.getElementById('sh-dialog-ref')) {
      this.#bodyEl?.append(wrapperEl);
    }

    return document.getElementById('sh-dialog-ref')!;
  }

  #cleanupRefs() {
    if (this.insertedCompRef) {
      this.#appRef.detachView(this.insertedCompRef.hostView);
      this.closedFieldSub?.unsubscribe();
      this.insertedCompRef.destroy();
    }

    if (!this.compRef) return;

    this.#appRef.detachView(this.compRef.hostView);
    this.compClosedSub?.unsubscribe();
    this.compRef.destroy();
  }

  ngOnDestroy() {
    this.#cleanupRefs();
  }
}
