import url from 'url';
import path from 'path';

const { URL } = url;

// eslint-disable-next-line import/prefer-default-export
export function resolve(specifier, parentModuleURL, defaultResolve) {
  let base = parentModuleURL;

  if (base) {
    // Convert parentModuleURL to system separator, remove leading backslash
    const normalizedBase = path.join(new URL(base).pathname).replace(/^\\/, '');
    if (normalizedBase === process.env.MOCHA_COPY_FILE) {
      base = `file://${process.env.MOCHA_BASE_FILE}`;
    }
  }

  return defaultResolve(specifier, base);
}
