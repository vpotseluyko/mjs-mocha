/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable no-return-assign */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-console */

// override env to turn on test env. Must come before(!) everything
process.env.NODE_ENV = 'test';

// current describe environment, changed with every call to describe()
let current = {
  "name": "xy",
  "describes": [],
  "tests": [],
  "hooks": {
    "before": [],
    "after": [],
    "beforeEach": [],
    "afterEach": []
  }
};

global.before = (fn) => {
  current.hooks.before = [].concat(current.hooks.before, [fn]);
};
global.after = (fn) => {
  current.hooks.after = [].concat(current.hooks.after, [fn]);
};
global.beforeEach = (fn) => {
  current.hooks.beforeEach = [].concat(current.hooks.beforeEach, [fn]);
};
global.afterEach = (fn) => {
  current.hooks.afterEach = [].concat(current.hooks.afterEach, [fn]);
};

global.it = (name, callback) => {
  current.tests = [].concat(current.tests, [{ name, callback }]);
};

global.describe = (name, callback) => {
  let previous = current;
  current = {
    name,
    "describes": [],
    "tests": [],
    "hooks": {
      "before": [],
      "after": [],
      "beforeEach": [],
      "afterEach": []
    }
  };

  callback();
  
  previous.describes = [].concat(previous.describes, [current]);
  current = previous;
};

const spaces = (num) => {
  let result = "";
  for (let i = 0; i < num; i++) {
    result += " ";
  }
  return result;
};

const color = (code, str) => {
  return code + str + "\x1b[0m";
} 

const callHooks = async(arr) => {
  for (let i = 0; i < arr.length; i++) {
    await arr[i]();
  }
};

process.nextTick(() => {
  let indent = 2;
  let success = 0;
  let error = 0;

  const processLevel = async(level) => {
    await callHooks(level.hooks.before);

    for (let i = 0; i < level.tests.length; i++) {
      const test = level.tests[i];

      await callHooks(level.hooks.beforeEach);

      try {
        await test.callback();
        console.log(color("\x1b[32m", `${spaces(indent)}✔ ${test.name} passed`));
        success++;
      } catch (e) {
        console.log(color("\x1b[31m", `${spaces(indent)}✗ ${test.name} failed`));
        console.log(e);
        error++;
      }

      await callHooks(level.hooks.afterEach);
    }

    for (let i = 0; i < level.describes.length; i++) {
      console.log(color("\x1b[33m", `${spaces(indent)}${level.describes[i].name}:`));
      
      indent += 2;
      await processLevel(level.describes[i]);
      indent -= 2;
      
      console.log("");
    }

    await callHooks(level.hooks.after);
  };

  processLevel(current)
    .then(() => {
      if (error === 0) {
        console.log(color("\x1b[32m", ` ✔ All ${success} tests passed`));
        process.exit(0);
      } else {
        console.log(color("\x1b[31m", ` ✗ ${error}/${success + error} failed`));
        process.exit(1);
      }
    }).catch((e) => {
      console.error(e);
      process.exit(1);
    });
});
