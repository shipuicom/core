import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  DOCUMENT,
  inject,
  Injectable,
  InputSignal,
  isSignal,
  OutputEmitterRef,
  OutputRefSubscription,
  Type,
} from '@angular/core';
import { ShipDialog, ShipDialogOptions } from './ship-dialog';

export type Exact<T, U> = U extends T ? (keyof U extends keyof T ? U : never) : never;
export type ComponentDataType<T> = T extends { data: InputSignal<infer K> } ? K : void;
export type ComponentClosedType<T> = T extends { closed: OutputEmitterRef<infer U> } ? U : undefined;

export interface ShipDialogServiceOptions<TData = any, TResult = undefined> extends ShipDialogOptions {
  data?: TData extends void ? void : TData & Exact<TData, TData>;
  closed?: (res: TResult) => void;
}

export type ShipDialogInstance<T> = {
  component: T;
  close: (res?: ComponentClosedType<T> | undefined) => void;
  closed: OutputEmitterRef<ComponentClosedType<T> | undefined>;
};

@Injectable({
  providedIn: 'root',
})
export class ShipDialogService {
  #document = inject(DOCUMENT);
  #bodyEl = this.#document.querySelector('body');
  #appRef = inject(ApplicationRef);

  compRef: ComponentRef<ShipDialog> | null = null;
  insertedCompRef: ComponentRef<unknown> | null = null;

  closedFieldSub: OutputRefSubscription | null = null;
  compClosedSub: OutputRefSubscription | null = null;

  open<
    T extends
      | { data?: InputSignal<any>; closed?: OutputEmitterRef<any> }
      | { data?: InputSignal<any> }
      | { closed?: OutputEmitterRef<any> }
      | {},
    K = ComponentDataType<T>,
    U = ComponentClosedType<T>,
    _Options extends ShipDialogServiceOptions<K, U | undefined> = ShipDialogServiceOptions<K, U | undefined>,
  >(component: Type<T>, options?: _Options): ShipDialogInstance<T> {
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

    this.compRef = createComponent(ShipDialog, {
      hostElement,
      environmentInjector,
      projectableNodes: [[this.insertedCompRef.location.nativeElement]],
    });

    const insertedInstance = this.insertedCompRef.instance as T;
    const dataField = (insertedInstance as any).data as InputSignal<K>;
    const closedField = (insertedInstance as any).closed as OutputEmitterRef<U | undefined>;

    if (data) {
      if (isSignal(dataField)) {
        this.insertedCompRef.setInput('data', data);
      } else if (!isSignal(dataField)) {
        throw new Error('data is not an input signal on the passed component');
      }
    }

    if (closedField instanceof OutputEmitterRef) {
      this.closedFieldSub = closedField.subscribe((arg: U | undefined) => {
        this.#cleanupRefs();

        if (closingCalled) return;

        closingCalled = true;

        closed?.(arg as U);

        (this.compRef?.instance.closed as OutputEmitterRef<U | undefined>).emit(arg);
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

    function closeAction(arg: U | undefined = undefined) {
      _self.#cleanupRefs();

      if (closingCalled) return;

      closingCalled = true;

      if (closedField && closedField instanceof OutputEmitterRef) {
        closedField.emit(arg as any);
      }

      closed?.(arg as U);
    }

    return {
      component: this.insertedCompRef.instance as T,
      close: closeAction,
      closed: this.compRef.instance.closed as OutputEmitterRef<U | undefined>,
    } as ShipDialogInstance<T>;
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
