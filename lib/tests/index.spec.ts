/// Native Imports
import fs from 'fs';
import path from 'path';
import assert from 'assert';

/// `tiny:sconf` Imports
import { Config, Draft, Preset } from '../exports';

/**************
 *  TYPEDEFS  *
 **************/

/** Configuration Test Data. */
interface TestData {
    animal: string;
    fruit: 'apple' | 'pear' | 'orange' | 'banana';
    person: { name: string; age: number };
    list: number[];
}

/*************
 *  GLOBALS  *
 *************/

/** Configuration File paths. */
const cachePath = path.join(__dirname, '../../.cache');
const filePath = path.join(cachePath, 'test.json');

/** Configuration Draft. */
const draft: Draft<TestData> = {
    animal: Preset('unicorn'),
    fruit: Preset('apple'),
    person: Preset({ name: 'John', age: 21 }),
    list: Preset([1, 2, 3, 4, 5]),
};

/// Base Configuration.
const conf = Config.from(draft, { path: filePath, exposedEvents: true });

/********************
 *  INITIALISATION  *
 ********************/

conf.reset(); // ensure using base data
fs.rmSync(cachePath, { recursive: true, force: true });

/******************
 *  TEST RUNNERS  *
 ******************/

describe('Config', function () {
    // Read Test
    describe('#read()', function () {
        it(`['animal'] should return 'unicorn'`, function () {
            assert.equal(conf.read('animal'), 'unicorn');
        });

        it(`['list'] should have length of 5`, function () {
            assert.equal(conf.read('list').length, 5);
        });
    });

    // Alterations Test (and read after)
    describe('#alter()', function () {
        it(`['fruit'] should become 'banana'`, function () {
            conf.alter('fruit', 'banana');
            assert.equal(conf.read('fruit'), 'banana');
        });

        it(`['person'] should become '{ name: "Jane", age: 25 }'`, function () {
            conf.alter('person', { name: 'Jane', age: 25 });
            const { name, age } = conf.read('person');
            assert.equal(name, 'Jane');
            assert.equal(age, 25);
        });
    });

    // Event-Listener Test
    describe('#once', function () {
        it(`['animal'] should emit alteration of "dog"`, async function () {
            return new Promise<void>((resolve) => {
                // attempt listening for the result
                conf.once('change:animal', (value) => {
                    assert.equal(value, 'dog');
                    resolve();
                });

                // emit the request
                conf.alter('animal', 'dog');
            });
        });
    });

    // Trigger Test
    describe('#trigger', function () {
        it(`['fruit', 'animal'] should emit no change`, async function () {
            await new Promise<void>((resolve) => {
                const fruit = conf.read('fruit');

                // attempt listening for the results
                conf.once('change:fruit', (value) => {
                    assert.equal(value, fruit);
                    resolve();
                });

                // emit the request
                conf.trigger('fruit');
            });

            await new Promise<void>((resolve) => {
                const animal = conf.read('animal');

                // attempt listening for the results
                conf.once('change:animal', (value) => {
                    assert.equal(value, animal);
                    resolve();
                });

                // emit the request
                conf.trigger('animal');
            });
        });
    });

    // File removal / replacement
    describe('@remove', function () {
        it(`should replace instance safely`, function () {
            fs.rmSync(cachePath, { recursive: true, force: true });
            conf.reset();
        });
    });
});
