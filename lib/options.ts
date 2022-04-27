/** Options Namespace. */
export namespace Options {
    /** Config Constructor Options. */
    export interface IConfig {
        path: string; // base config file-path
        useCache?: boolean; // denote if caching results
        allowCreate?: boolean; // allow creating file if missing
    }

    /** Default Options. */
    export const Default: Omit<Required<IConfig>, 'path'> = {
        useCache: false,
        allowCreate: true
    };
}
