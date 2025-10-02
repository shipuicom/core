import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  DOCUMENT,
  inject,
  Injectable,
  isSignal,
  OutputEmitterRef,
  OutputRefSubscription,
  Type,
} from '@angular/core';
import { ShipDialogComponent, ShipDialogOptions } from './ship-dialog.component';

export interface ShipDialogServiceOptions<T = any> extends ShipDialogOptions {
  data?: T;
  closed?: (...args: any[]) => void;
}

export type ShipDialogReturn<T> = ReturnType<ShipDialogService['open']> & {
  component: T;
};

type TWithClosed<T> = T & { closed: OutputEmitterRef<any> };

@Injectable({
  providedIn: 'root',
})
export class ShipDialogService {
  #document = inject(DOCUMENT);
  #bodyEl = this.#document.querySelector('body');
  #appRef = inject(ApplicationRef);

  compRef: ComponentRef<ShipDialogComponent> | null = null;
  insertedCompRef: ComponentRef<unknown> | null = null;

  closedFieldSub: OutputRefSubscription | null = null;
  compClosedSub: OutputRefSubscription | null = null;

  open<T, K = any>(component: Type<T>, options?: ShipDialogServiceOptions<K>) {
    const environmentInjector = this.#appRef.injector;
    const hostElement = this.#createEl();
    let closingCalled = false;

    const { data, closed, ...rest } = options || {};

    if (this.compRef) {
      this.#cleanupRefs(true);
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
        this.#cleanupRefs();

        if (closingCalled) return;

        closingCalled = true;

        closed?.(...args);

        this.compRef?.instance.closed.emit(...args);
      });
    }

    this.#appRef.attachView(this.insertedCompRef.hostView);
    this.#appRef.attachView(this.compRef.hostView);

    this.insertedCompRef.changeDetectorRef.detectChanges();
    this.compRef.changeDetectorRef.detectChanges();
    this.compRef.instance.isOpen.set(true);
    this.compRef.setInput('options', rest);

    this.compClosedSub = this.compRef.instance.closed.subscribe(() => closeAction());

    const _self = this;

    function closeAction<U>(arg: U | undefined = undefined) {
      _self.#cleanupRefs();

      if (closingCalled) return;

      closingCalled = true;

      if (closedField && closedField instanceof OutputEmitterRef) {
        closedField.emit(arg);
      }

      closed?.(arg);
    }

    return {
      component: this.insertedCompRef.instance as T,
      close: closeAction,
      closed: this.compRef.instance.closed,
    };
  }

  #createEl(): Element {
    const wrapperEl = this.#document.createElement('sh-dialog-ref');
    wrapperEl.id = 'sh-dialog-ref';

    if (!this.#document.getElementById('sh-dialog-ref')) {
      this.#bodyEl?.append(wrapperEl);
    }

    return this.#document.getElementById('sh-dialog-ref')!;
  }

  #cleanupRefs(instant = false) {
    const _self = this;

    instant ? cleanup : queueMicrotask(() => cleanup());

    function cleanup() {
      if (_self.insertedCompRef) {
        _self.#appRef.detachView(_self.insertedCompRef.hostView);
        _self.closedFieldSub?.unsubscribe();
        _self.insertedCompRef.destroy();
      }

      if (!_self.compRef) return;

      _self.#appRef.detachView(_self.compRef.hostView);
      _self.compClosedSub?.unsubscribe();
      _self.compRef.destroy();
    }
  }

  ngOnDestroy() {
    this.#cleanupRefs(true);
  }
}
