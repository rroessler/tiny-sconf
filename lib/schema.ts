/// `tiny-sconf` Imports
import { Draft } from './draft';

/** Schema Implementation. */
export class Schema<T extends object, M extends any = {}> {
    /****************
     *  PROPERTIES  *
     ****************/

    /** Flattened Schema Instance. */
    readonly flattened: T;

    /*****************
     *  CONSTRUCTOR  *
     *****************/

    /**
     * Constructs a new instance of a Schema Cache.
     * @param m_draft
     */
    constructor(private readonly m_draft: Draft<T, M>) {
        this.flattened = this.m_flatten(); // flatten the draft
    }

    /****************
     *  PROPERTIES  *
     ****************/

    /**
     * Queries if a key exists within a schema.
     * @param key                           Key to query.
     */
    has = <K extends keyof T>(key: K) => Object.keys(this.m_draft).includes(key as string);

    /**
     * Gets the associated preset value for a schema.
     * @param key                           Key of preset get.
     */
    get = <K extends keyof T>(key: K): T[K] => this.flattened[key];

    /**
     * Gets the meta parameters of a given schema key.
     * @param key                           Key of schema property.
     */
    meta = <K extends keyof T>(key: K): Omit<Draft<T, M>[K], 'preset'> => {
        const { preset, ...meta } = this.m_draft[key];
        return meta;
    };

    /*********************
     *  PRIVATE METHODS  *
     *********************/

    /** Helper method to flatten schema drafts. */
    private m_flatten = () =>
        Object.entries<any>(this.m_draft).reduce((acc, [key, value]) => {
            acc[key] = value.preset;
            return acc;
        }, {} as any) as T;
}
