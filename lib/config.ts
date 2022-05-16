/// Native Modules
import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

/// `tiny-sconf` Imports
import { Draft } from './draft';
import { Alteration, ConfigEvents } from './events';
import { Options } from './options';
import { Schema } from './schema';

/** Configuration Wrapper Class. */
class ConfigWrapper<T extends object, M extends any = {}, B extends true | false = false> {
    /****************
     *  PROPERTIES  *
     ****************/

    /** Internal Configuration Cache. */
    private m_cache: T = null as unknown as T;

    /** Internal Schema. */
    private m_schema: Schema<T, M>;

    /** Assigned Options. */
    private m_options: Required<Options.IConfig<B>>;

    /** Internal Emitter Instance. */
    private m_emitter = new EventEmitter();

    /***********************
     *  GETTERS / SETTERS  *
     ***********************/

    /** Gets the current configuration cache (or file if not using the cache). */
    private get m_current() {
        return this.m_options.useCache ? this.m_cache : this.m_readFile();
    }

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
    constructor(draft: Draft<T, M>, opts: Options.IConfig<B>) {
        // generate the base schema
        this.m_schema = new Schema(draft);

        // assign the internal options
        this.m_options = Object.assign({}, Options.Default, opts);

        // ensure the resource file has a `.json` ending
        if (!this.path.endsWith('.json')) throw new Error('tiny::sconf | Expected ".json" file extension.');

        // ensure the base file exists
        this.m_prepareResource();

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
        const conf = this.m_current;
        return key === undefined ? conf : conf[key];
    }

    /**
     * Alters a property within the configuration. Also triggers
     * a change event to occur once complete.
     * @param key                           Property to change.
     * @param value                         Value to set.
     */
    alter<K extends keyof T>(key: K, value: T[K]) {
        // get the current configuration
        const conf = this.m_current;

        // modify the current value (if cached this will alter the reference)
        conf[key] = value;

        // write the current configuration to the file
        this.m_writeFile(conf);

        // emit the change event
        this.m_emitAlterations([new Alteration(key, value)]);
    }

    /**
     * Overwrites the entire configuration in one go. Emits
     * changes for every base property.
     * @param next                          Next configuration value.
     */
    overwrite(next: T) {
        // override the cache completely if necessary
        if (this.m_options.useCache) this.m_cache = next;

        // write the cache to the file
        this.m_writeFile(next);

        // and emit change events for every property
        const alterations = Object.entries(next).map(([key, value]) => new Alteration<T, keyof T>(key as any, value));

        // as core alterations
        this.m_emitAlterations(alterations);
    }

    /** Resets the config to the `preset` values. */
    reset = () => this.overwrite(Object.assign({}, this.m_schema.flattened));

    /*******************
     *  EVENT METHODS  *
     *******************/

    /**
     * Attaches a listener callback for configuration events.
     * @param eventName                     Config Event.
     * @param listener                      Listener Callback.
     */
    on<K extends keyof ConfigEvents<B, T>>(eventName: K, listener: ConfigEvents<B, T>[K]) {
        this.m_emitter.on(eventName as string, listener as any);
    }

    /**
     * Attaches a once listener callback for configuration events.
     * @param eventName                     Config Event.
     * @param listener                      Listener Callback.
     */
    once<K extends keyof ConfigEvents<B, T>>(eventName: K, listener: ConfigEvents<B, T>[K]) {
        this.m_emitter.once(eventName as string, listener as any);
    }

    /**
     * Ignores events given by the event name.
     * @param eventName                     Event to ignore.
     */
    ignore<K extends keyof ConfigEvents<B, T>>(eventName: K) {
        this.m_emitter.removeAllListeners(eventName as string);
    }

    /**
     * Triggers an event manually for the given keys.
     * @param keys                          Properties to trigger an event for.
     */
    trigger(...keys: (keyof T)[]) {
        const conf = this.m_current; // get the configuration reference
        this.m_emitAlterations(keys.map((key) => new Alteration(key, conf[key])));
    }

    /**
     * Helper method that allows for emitting alterations in batches.
     * @param alterations                   Alterations to emit.
     */
    private m_emitAlterations = (alterations: Alteration<T, keyof T>[]) => {
        this.m_emitter.emit('change', alterations);
        if (!this.m_options.exposedEvents) return;
        alterations.forEach((alter) => this.m_emitter.emit(`change:${alter.key}`, alter.value));
    };

    /*********************
     *  PRIVATE METHODS  *
     *********************/

    /** Prepares the internal cache. */
    private m_prepareCache = () => {
        if (this.m_options.useCache) this.m_cache = this.m_readFile();
    };

    /** Prepares the base configuration resource. */
    private m_prepareResource = () => {
        // ignore if the file already exists
        if (fs.existsSync(this.path)) return;

        // and create if possible
        if (!this.m_options.allowCreate) throw new Error('tiny::sconf | Resource file does not exist.');
        fs.mkdirSync(path.dirname(this.path), { recursive: true });
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
        try {
            fs.writeFileSync(this.path, JSON.stringify(next), 'utf-8');
        } catch (err) {
            // if a bad error, then rethrow
            if ((<any>err).code !== 'ENOENT') throw err;

            // otherwise attempt writing again
            this.m_prepareResource();
            this.m_writeFile(next);
        }
    };
}

/** Configuration Factory. */
export namespace Config {
    /**
     * Factory generator for configuration wrappers.
     * @param draft                     Schema Draft.
     * @param opts                      Config Options.
     */
    export const from = <T extends object, M extends any = {}, B extends true | false = false>(
        draft: Draft<T, M>,
        opts: Options.IConfig<B>
    ) => new ConfigWrapper(draft, opts);
}
