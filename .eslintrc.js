module.exports = {
  root: true,
  env: {
    es6: true,
    jest: true,
    node: true,
    browser: true
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  extends: ['eslint:recommended', 'prettier'],
  globals: {
    chrome: 'readonly',
    browser: 'readonly'
  }
};
