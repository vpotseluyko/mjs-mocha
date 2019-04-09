#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const getRandomString = () => Math.random().toString(36).substring(7);

const getTestFiles = (dir) => {
  const files = fs.readdirSync(dir);

  return [
    ...files
      .filter(f => f.match(/\.(test|spec)\.mjs$/))
      .map(f => path.join(dir, f)),
    ...files
      .filter(f => fs.statSync(path.join(dir, f)).isDirectory())
      .filter(f => !f.match(/(node_modules|\.git)/))
      .map(d => getTestFiles(path.join(dir, d)))
      .reduce((acc, val) => acc.concat(val), []),
  ];
};

const clearOrCreateDir = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);

    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      fs.unlinkSync(path.join(dirPath, file));
    }
  } else {
    fs.mkdirSync(dirPath);
  }
};

// eslint-disable-next-line consistent-return
const runTest = (file, customNodeArgs) => new Promise((resolve, reject) => {
  clearOrCreateDir(path.join(__dirname, '..', 'temp'));

  const testFilePath = path.join(__dirname, '..', 'temp', `${getRandomString()}.mjs`);
  const testFile = fs.createWriteStream(testFilePath);

  const mochaStream = fs.createReadStream(path.join(__dirname, 'mocha.mjs'));
  mochaStream.pipe(testFile, { end: false });
  mochaStream.on('end', () => {
    fs.createReadStream(file).pipe(testFile);
  });

  // NodeJS on Windows doesn`t understand path with backslashes at --loader param 🤨
  const loaderPath = path.join(path.relative(path.resolve(), __dirname), 'loader.mjs').replace(/\\/g, '/');

  const test = cp.spawn('node', [
    ...customNodeArgs,
    '--no-warnings',
    '--experimental-modules',
    '--loader',
    loaderPath,
    testFilePath,
  ], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MOCHA_BASE_FILE: file,
      MOCHA_COPY_FILE: testFilePath,
    },
  });

  let output = '';

  // eslint-disable-next-line no-return-assign
  test.stdout.on('data', data => output += data);
  // eslint-disable-next-line no-return-assign
  test.stderr.on('data', data => output += data);

  test.on('exit', (code) => {
    fs.unlinkSync(testFilePath);

    if (!code) {
      resolve(output);
    } else {
      const mochaFile = fs.readFileSync(path.join(__dirname, 'mocha.mjs'), 'utf8');
      const mochaFileLinesCount = mochaFile.split('\n').length;

      const formatedOutput = output.replace(new RegExp(`(${testFilePath}:)(.+):`), (match, fileName, lineNumber) => `${file}:${+lineNumber - mochaFileLinesCount + 1}:`);

      reject(formatedOutput);
    }
  });
});

const run = async () => {
  const customNodeArgs = process.argv.slice(2).filter(arg => arg.startsWith('-'));
  const customFiles = process.argv.slice(2).filter(arg => !arg.startsWith('-'));

  let files = getTestFiles(path.resolve());
  let errors = 0;

  if (customFiles.length) {
    files = files.filter(file => customFiles.some(customFile => file.includes(customFile)));
  }

  for (let i = 0; i < files.length; i++) {
    try {
      const output = await runTest(files[i], customNodeArgs);
      console.log(output);
    } catch (err) {
      console.error(err);
      errors++;
    }
  }

  if (errors) {
    console.log('\x1b[0m', '\x1b[31m');
    console.log(` ✗ ${errors}/${files.length} test suites failed`);
    console.log('\x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[0m', '\x1b[32m');
    console.log(` ✔ All ${files.length} test suites passed`);
    console.log('\x1b[0m');
  }
};

run();
