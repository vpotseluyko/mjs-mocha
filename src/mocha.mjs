/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable no-return-assign */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-console */

// override env to turn on test env. Must come before(!) everything
process.env.NODE_ENV = 'test';

const tests = [];

let success = 0;
let error = 0;

const hooks = {
  before: async () => {},
  after: async () => {},
  beforeEach: async () => {},
  afterEach: async () => {},
};
global.before = fn => hooks.before = fn;
global.after = fn => hooks.after = fn;
global.beforeEach = fn => hooks.beforeEach = fn;
global.afterEach = fn => hooks.afterEach = fn;

const it = (name, callback) => {
  tests.push({ [name]: callback });
};

const launch = async (i, test) => {
  for (const key in test) {
    if (!test.hasOwnProperty(key)) return;
    console.log('\x1b[1m', '\x1b[37m');
    console.log(` ➤ ${i}) ${key}`);
    try {
      await test[key]();
      console.log('\x1b[0m', '\x1b[32m');
      console.log(`     ✔ ${key} passed`);
      success++;
    } catch (e) {
      console.log('\x1b[0m', '\x1b[31m');
      console.log(`     ✗ ${key} failed`);
      console.log(e);
      error++;
    }
  }
};

const describe = async (name, callback) => {
  try {
    console.log('\x1b[33m%s\x1b[0m', `Registering tests for ${name}`);

    callback();

    await hooks.before();

    for (let i = 0; i < tests.length; i++) {
      await hooks.beforeEach();

      await launch(i + 1, tests[i]);

      await hooks.afterEach();
    }

    await hooks.after();

    // reset seq
    console.log('\x1b[0m');

    if (success === tests.length) {
      console.log('\x1b[0m', '\x1b[32m');
      console.log(` ✔ All ${success} tests passed`);
      console.log('\x1b[0m');
      process.exit(0);
    } else {
      console.log('\x1b[0m', '\x1b[31m');
      console.log(` ✗ ${error}/${tests.length} failed`);
      console.log('\x1b[0m');
      process.exit(1);
    }
    console.log('\x1b[0m');
  } catch (e) {
    console.error(e);

    process.exit(1);
  }
};


global.it = it;
global.describe = describe;
