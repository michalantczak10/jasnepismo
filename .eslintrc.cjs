module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  globals: {
    JSZip: 'readonly',
    mammoth: 'readonly',
    pdfjsLib: 'readonly',
    Tesseract: 'readonly',
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
