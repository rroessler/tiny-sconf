/**************
 *  TYPEDEFS  *
 **************/

/** Preset Draft Value. */
export type Value<T extends any, M extends any = {}> = {
    preset: T;
} & M;

/** Draft Dictionary Typing. */
export type Draft<T extends Record<string, any> = {}, M extends any = {}> = {
    [K in keyof T]: Value<T[K], M>;
};

/********************
 *  PUBLIC METHODS  *
 ********************/

function _Preset_impl<T extends any>(data: T): Value<T>;
function _Preset_impl<T extends any, M extends any>(data: T, meta: M): Value<T, M>;
function _Preset_impl<T, M>(data: T, meta?: M): any {
    return Object.assign(meta ?? {}, { preset: data }) as any;
}

/**
 * Casts given data into a suitable draft preset.
 * @param data                  Data given.
 * @param meta                  Meta-data required.
 */
export const Preset = _Preset_impl;
