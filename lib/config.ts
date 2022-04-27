/// Native Modules
import fs from 'fs';
import EventEmitter from 'events';

/// `tiny-sconf` Imports
import { Draft } from './draft';
import { Alteration, IConfigEvents } from './events';
import { Options } from './options';
import { Schema } from './schema';

/** Configuration Wrapper Class. */
class ConfigWrapper<T extends object, M extends any = {}> {
    /****************
     *  PROPERTIES  *
     ****************/

    /** Internal Configuration Cache. */
    private m_cache: T = null as unknown as T;

    /** Internal Schema. */
    private m_schema: Schema<T, M>;

    /** Assigned Options. */
    private m_options: Required<Options.IConfig>;

    /** Internal Emitter Instance. */
    private m_emitter = new EventEmitter();

    /***********************
     *  GETTERS / SETTERS  *
     ***********************/

    /** Configuration File path. */
    get path() {
        return this.m_options.path;
    }

    /*****************
     *  CONSTRUCTOR  *
     *****************/

    /**
     * Constructs a new `Config` instance.
     * @param draft                 Base Draft.
     * @param opts                  Core Options.
     */
    constructor(draft: Draft<T, M>, opts: Options.IConfig) {
        // generate the base schema
        this.m_schema = new Schema(draft);

        // assign the internal options
        this.m_options = Object.assign({}, Options.Default, opts);

        // assert that the given path exists

        // prepare the cache (if possible)
        this.m_prepareCache();
    }

    /********************
     *  PUBLIC METHODS  *
     ********************/

    /**
     * Reads a property or the complete configuration schema.
     * @param key                           Optional key to read.
     */
    read(): T;
    read<K extends keyof T>(key: K): T[K];
    read<K extends keyof T>(key?: K): any {
        const conf = this.m_options.useCache ? this.m_cache : this.m_readFile();
        return key === undefined ? conf : conf[key];
    }

    /**
     * Alters a property within the configuration. Also triggers
     * a change event to occur once complete.
     * @param key                           Property to change.
     * @param value                         Value to set.
     */
    alter<K extends keyof T>(key: K, value: T[K]) {
        // modify the current cache value regardless
        this.m_cache[key] = value;

        // write the current cache to the file
        this.m_writeFile(this.m_cache);

        // and emit the change event
        this.m_emitter.emit('change', [new Alteration(key, value)]);
    }

    /**
     * Overwrites the entire configuration in one go. Emits
     * changes for every base property.
     * @param next                          Next configuration value.
     */
    overwrite(next: T) {
        // override the cache completely
        this.m_cache = next;

        // write the cache to the file
        this.m_writeFile(next);

        // and emit change events for every property
        const alterations = Object.entries(next).map(([key, value]) => new Alteration<T, keyof T>(key as any, value));
        this.m_emitter.emit('change', alterations);
    }

    /*******************
     *  EVENT METHODS  *
     *******************/

    /**
     * Attaches a listener callback for configuration events.
     * @param eventName                     Config Event.
     * @param listener                      Listener Callback.
     */
    on<K extends keyof IConfigEvents<T>>(eventName: K, listener: IConfigEvents<T>[K]) {
        this.m_emitter.on(eventName as string, listener as any);
    }

    /**
     * Attaches a once listener callback for configuration events.
     * @param eventName                     Config Event.
     * @param listener                      Listener Callback.
     */
    once<K extends keyof IConfigEvents<T>>(eventName: K, listener: IConfigEvents<T>[K]) {
        this.m_emitter.once(eventName as string, listener as any);
    }

    /**
     * Ignores events given by the event name.
     * @param eventName                     Event to ignore.
     */
    ignore<K extends keyof IConfigEvents<T>>(eventName: K) {
        this.m_emitter.removeAllListeners(eventName);
    }

    /*********************
     *  PRIVATE METHODS  *
     *********************/

    /** Prepares the internal cache. */
    private m_prepareCache = () => {
        this.m_cache = this.m_readFile();
    };

    /** Safely reads the current configuration. */
    private m_readFile = (): T => {
        // retrieve the flattened schema
        const flattened = Object.assign({}, this.m_schema.flattened);

        try {
            return Object.assign(flattened, JSON.parse(fs.readFileSync(this.path, 'utf-8')));
        } catch (_) {
            return flattened;
        }
    };

    /**
     * Writes the given configuration to the base file.
     * @param next                      Next config.
     */
    private m_writeFile = (next: T) => {
        fs.writeFileSync(this.path, JSON.stringify(next), 'utf-8');
    };
}

/** Configuration Factory. */
export namespace Config {
    /**
     * Factory generator for configuration wrappers.
     * @param draft                     Schema Draft.
     * @param opts                      Config Options.
     */
    export const from = <T extends object, M extends any = {}>(draft: Draft<T, M>, opts: Options.IConfig) =>
        new ConfigWrapper(draft, opts);
}
