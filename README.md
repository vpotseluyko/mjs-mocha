# mjs-mocha
A very simple npm mocha mjs polyfill. No dependencies at all. Very small and light.

## Install
```shell
$ npm i -D mjs-mocha
```

## Usage
### Import

```js
import 'mjs-mocha';

describe('My test', () => {
  ...
})
```

### CLI
Add the script to your `package.json`.

```json
{
  "scripts": {
    "test": "mjs-mocha"
  }
}
```

Then just run `npm test`.

mjs-mocha will run all `*.test.mjs` and `*.spec.mjs` files in your repository.

Also you can specify test files to run by passing them as arguments.

#### Example
project structure:
- src
  - ...
- tests
  - first.test.mjs
  - second.test.mjs
  - third.test.mjs

```shell
mjs-mocha first second
```
