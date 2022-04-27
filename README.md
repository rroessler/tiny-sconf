tiny-sconf
==========

A versatile and efficient JSON configuration library that exposes typed schema's and event emitters for changes/updates.

Install
-------

```bash
npm install tiny-sconf
```

Usage
-----

```javascript
const { Config, Preset } = require('tiny-sconf').tiny;

const conf = Config.from({
    animal: Preset('unicorn'),
    fruit: Preset('apple'),
    list: Preset([1, 2, 3])
}, { path: "path/to/desired/cache.json" })

conf.alter('animal', 'dog');
console.log(conf.read('animal')); // => 'dog'

conf.overwrite({ animal: 'cat', fruit: 'banana', list: [0, 1, 2] });
console.log(conf.read()); // => <full-draft>

conf.reset();
console.log(conf.read()); // => back to presets
```

```typescript
import { tiny } from 'tiny-sconf';

// Better Configuration Typing
interface IConfigData {
    name: 'John' | 'Jane' | 'Jack' | 'Jill';
    age: number;
}

const conf = Config.from<IConfigData>({
    name: 'John',
    age: 25
}, { path: "path/to/desired/cache.json" })
```

License
-------
[MIT](https://opensource.org/licenses/MIT)