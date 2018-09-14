export function resolve(specifier, parentModuleURL, defaultResolve) {
  let base = parentModuleURL;
  if (base === 'file://' + process.env.MOCHA_COPY_FILE) {
    base = 'file://' + process.env.MOCHA_BASE_FILE;
  }

  return defaultResolve(specifier, base);
}