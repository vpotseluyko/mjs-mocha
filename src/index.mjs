#!/usr/bin/env node --experimental-modules

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
const testFiles = (files, i = 0) => {
  if (i >= files.length) {
    return null;
  }

  const testFilePath = path.join(path.join(__dirname, 'temp'), `${getRandomString()}.mjs`);
  const testFile = fs.createWriteStream(testFilePath);

  const mochaStream = fs.createReadStream(path.join(__dirname, 'src', 'mocha.mjs'));
  mochaStream.pipe(testFile, { end: false });
  mochaStream.on('end', () => {
    fs.createReadStream(files[i]).pipe(testFile);
  })

  const test = cp.spawn('node', [
    '--experimental-modules',
    '--loader', path.join(__dirname, 'src', 'loader.mjs'),
    testFilePath
  ], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MOCHA_BASE_FILE: files[i],
      MOCHA_COPY_FILE: testFilePath,
    }
  });

  let output;

  // eslint-disable-next-line no-return-assign
  test.stdout.on('data', data => output += data);
  // eslint-disable-next-line no-return-assign
  test.stderr.on('data', data => output += data);
  test.on('close', () => {
    // eslint-disable-next-line no-console
    console.log(output);
    fs.unlinkSync(testFilePath);
    testFiles(files, i + 1);
  });
};

testFiles(getTestFiles(path.resolve()));
