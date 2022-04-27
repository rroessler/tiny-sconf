/**************
 *  TYPEDEFS  *
 **************/

/** Available Configuration Event Listeners. */
export interface IConfigEvents<T extends object, K extends keyof T = keyof T> {
    change: (alterations: Alteration<T, K>[]) => void;
}

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
