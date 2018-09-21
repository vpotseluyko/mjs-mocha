#!/bin/sh
// eslint-disable-next-line spaced-comment, lines-around-directive, semi
':' //; exec node --experimental-modules "$0" "$@"

/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */

import fs from 'fs';
import path from 'path';
import cp from 'child_process';
import __dirname from '../dirname';

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

// eslint-disable-next-line consistent-return
const runTest = file => new Promise((resolve, reject) => {
  const testFilePath = path.join(__dirname, 'temp', `${getRandomString()}.mjs`);
  const testFile = fs.createWriteStream(testFilePath);

  const mochaStream = fs.createReadStream(path.join(__dirname, 'src', 'mocha.mjs'));
  mochaStream.pipe(testFile, { end: false });
  mochaStream.on('end', () => {
    fs.createReadStream(file).pipe(testFile);
  });

  const test = cp.spawn('node', [
    '--experimental-modules',
    '--loader',
    path.join(__dirname, 'src', 'loader.mjs'),
    testFilePath,
  ], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MOCHA_BASE_FILE: file,
      MOCHA_COPY_FILE: testFilePath,
    },
  });

  let output;

  // eslint-disable-next-line no-return-assign
  test.stdout.on('data', data => output += data);
  // eslint-disable-next-line no-return-assign
  test.stderr.on('data', data => output += data);

  test.on('exit', (code) => {
    fs.unlinkSync(testFilePath);

    if (!code) {
      resolve(output);
    } else {
      reject(output);
    }
  });
});

const run = async () => {
  const files = getTestFiles(path.resolve());
  let errors = 0;

  for (let i = 0; i < files.length; i++) {
    try {
      const output = await runTest(files[i]);
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
    console.log(' ✔ All test suites passed');
    console.log('\x1b[0m');
  }
};

run();
