module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Personnalisation des règles
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'max-len': ['error', { code: 120 }],
    'no-param-reassign': ['error', { props: false }],
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
    }],
    'import/prefer-default-export': 'off',
    'linebreak-style': 'off',
  },
  overrides: [
    {
      files: ['*.js'],
      excludedFiles: ['*.config.js'],
    },
  ],
};
