/**************
 *  TYPEDEFS  *
 **************/

/** @ts-ignore : Typed Configuration Alterations. */
type TypedAlterations<T extends object, K extends keyof T> = Record<`change:${K}`, (value: T[K]) => void>;

/** Default Configuration Events. */
type BaseConfigEvents<T extends object, K extends keyof T = keyof T> = {
    change: (alterations: Alteration<T, K>[]) => void;
};

/**  Typedef Configuration Events. */
type TypedConfigEvents<T extends object, K extends keyof T = keyof T> = TypedAlterations<T, K> & BaseConfigEvents<T, K>;

/** Exposed Configuration Events. */
export type ConfigEvents<B extends true | false, T extends object, K extends keyof T = keyof T> = B extends true
    ? TypedConfigEvents<T, K>
    : BaseConfigEvents<T, K>;

/********************
 *  IMPLEMENTATION  *
 ********************/

/** Config Alteration Helper. */
export class Alteration<T extends object, K extends keyof T> {
    /**
     * Constructs a new instance of an alteration.
     * @param key                   Alteration Key.
     * @param value                 Alteration Value.
     */
    constructor(public readonly key: K, public value: T[K]) {}

    /**
     * Type-guard for alterations.
     * @param query                 Key to query.
     */
    is<U extends K>(query: U): this is Alteration<T, U> {
        return this.key === query;
    }
}
