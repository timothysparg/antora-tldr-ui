// ESLint flat config (CJS variant for compatibility)
// Uses Standard v17 as a base and applies UI‑specific tweaks.
const { FlatCompat } = require('@eslint/eslintrc')
const compat = new FlatCompat({ baseDirectory: __dirname })

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // 1) Global ignores first (flat config ordering matters)
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'preview-dist/**',
      'src/js/vendor/**',
      '**/*.min.js',
    ],
  },

  // 2) Base: JavaScript Standard Style (compat for flat config)
  ...compat.extends('standard'),

  // 3) Project-wide rules and linter options
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // Keep existing project conventions
      'arrow-parens': ['error', 'always'],
      'comma-dangle': [
        'error',
        { arrays: 'always-multiline', objects: 'always-multiline', imports: 'always-multiline', exports: 'always-multiline' },
      ],
      'no-restricted-properties': [
        'error',
        { property: 'substr', message: 'Use String#slice instead.' },
      ],
      // Match prior leniency on line length (warn)
      'max-len': ['warn', { code: 120, tabWidth: 2, ignoreUrls: true, ignoreStrings: false, ignoreTemplateLiterals: false }],
      'spaced-comment': 'off',
      radix: ['error', 'always'],
    },
  },

  // 4) Browser environment for UI code
  {
    files: ['src/js/**/*.js', 'preview-src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
      },
    },
  },

  // 5) Node ESM (Vite configs and build-time plugins)
  {
    files: ['vite.config.js', 'preview-src/vite.config.js', 'plugins/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
  },

  // 6) Node CJS
  {
    files: ['postcss.config.cjs', 'index.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
  },
]
