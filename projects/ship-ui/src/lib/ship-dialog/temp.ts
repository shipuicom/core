import { InputSignal, OutputEmitterRef, TemplateRef, Type } from '@angular/core';
import { ShipDialogOptions } from './ship-dialog';

export type Exact<T, U> = U extends T ? (keyof U extends keyof T ? U : never) : never;

export type ComponentDataType<T> = T extends TemplateRef<infer C>
  ? C extends { $implicit: infer K }
    ? K
    : void
  : T extends { data: InputSignal<infer K> }
    ? K
    : void;

export type ComponentClosedType<T> = T extends TemplateRef<infer C>
  ? C extends { close: (res?: infer U) => void }
    ? U
    : undefined
  : T extends { closed: OutputEmitterRef<infer U> }
    ? U
    : undefined;

export interface ShipDialogServiceOptions<TData = any, TResult = undefined> extends ShipDialogOptions {
  data?: TData extends void ? void : TData & Exact<TData, TData>;
  closed?: (res: TResult) => void;
}

export type ShipDialogInstance<T> = {
  component: T;
  close: (res?: ComponentClosedType<T> | undefined) => void;
  closed: OutputEmitterRef<ComponentClosedType<T> | undefined>;
};

export declare class ShipDialogService {
  open<
    T extends TemplateRef<any>,
    K = ComponentDataType<T>,
    U = ComponentClosedType<T>,
    _Options extends ShipDialogServiceOptions<K, U | undefined> = ShipDialogServiceOptions<K, U | undefined>,
  >(componentOrTemplate: T, options?: _Options): ShipDialogInstance<void>;

  open<
    T extends
      | { data?: InputSignal<any>; closed?: OutputEmitterRef<any> }
      | { data?: InputSignal<any> }
      | { closed?: OutputEmitterRef<any> }
      | {},
    K = ComponentDataType<T>,
    U = ComponentClosedType<T>,
    _Options extends ShipDialogServiceOptions<K, U | undefined> = ShipDialogServiceOptions<K, U | undefined>,
  >(componentOrTemplate: Type<T>, options?: _Options): ShipDialogInstance<T>;
}
