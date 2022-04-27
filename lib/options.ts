/** Options Namespace. */
export namespace Options {
    /** Config Constructor Options. */
    export interface IConfig<B extends true | false = false> {
        path: string; // base config file-path
        useCache?: boolean; // denote if caching results
        allowCreate?: boolean; // allow creating file if missing
        exposedEvents?: B; // whether to batch config alterations
    }

    /** Default Options. */
    export const Default: Omit<Required<IConfig>, 'path'> = {
        useCache: false,
        allowCreate: true,
        exposedEvents: false
    };
}
