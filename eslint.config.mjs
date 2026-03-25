// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config({
  files: ['projects/cometchat-uikit/**/*.ts', 'projects/sample-app/**/*.ts'],
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.stylistic,
    ...angular.configs.tsRecommended,
    prettier,
  ],
  plugins: {
    'unused-imports': unusedImports,
  },
  processor: angular.processInlineTemplates,
  rules: {
    '@angular-eslint/directive-selector': [
      'error',
      {
        type: 'attribute',
        prefix: 'app',
        style: 'camelCase',
      },
    ],
    '@angular-eslint/component-selector': [
      'error',
      {
        type: 'element',
        prefix: ['app', 'cometchat'],
        style: 'kebab-case',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-function': 'warn',
    'unused-imports/no-unused-imports': 'error',
    'prettier/prettier': 'error',
  },
}, {
  // Relaxed rules for test files
  files: ['**/*.spec.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
  },
}, {
  files: ['projects/**/*.html'],
  extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  rules: {},
}, {
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.angular/**',
    'uikit-react/**', // Exclude React project
    'scripts/**',
  ],
}, storybook.configs["flat/recommended"]);
