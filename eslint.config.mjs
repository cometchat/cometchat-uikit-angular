// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config({
  files: ['projects/cometchat-uikit/**/*.ts', 'projects/sample-app/**/*.ts'],
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.stylistic,
    ...angular.configs.tsRecommended,
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
    // Turning off Angular's sanitizer is how the markdown XSS happened (LINT2). Only the
    // allow-listed file below may do it, and only after DOMPurify has run.
    'no-restricted-syntax': [
      'error',
      {
        selector: 'MemberExpression[property.name=/^bypassSecurityTrust/]',
        message:
          "Don't bypass Angular's sanitizer. If HTML must be trusted, sanitize it with HtmlSanitizerService and get the call reviewed into the allow-list in eslint.config.mjs.",
      },
    ],
  },
}, {
  // The one place allowed to call bypassSecurityTrust*: it sanitizes with DOMPurify first.
  files: ['projects/cometchat-uikit/src/lib/components/cometchat-markdown-renderer/cometchat-markdown-renderer.component.ts'],
  rules: {
    'no-restricted-syntax': 'off',
  },
}, {
  // Library code logs through CometChatLogger, never console.log. The pre-commit hook checks this
  // too (scripts/pre-commit-checks.sh, check 4), but a hook can be skipped; this puts it in CI's
  // lint job. Specs, stories and the logger itself are exempt.
  files: ['projects/cometchat-uikit/src/lib/**/*.ts'],
  ignores: ['**/*.spec.ts', '**/*.stories.ts', '**/test-setup.ts', '**/utils/CometChatLogger.ts'],
  rules: {
    'no-restricted-properties': [
      'error',
      { object: 'console', property: 'log', message: 'Use CometChatLogger in library code, not console.log.' },
    ],
  },
}, {
  // Relaxed rules for test files
  files: ['**/*.spec.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    // Specs exercise bypassSecurityTrust* on purpose (security regression tests).
    'no-restricted-syntax': 'off',
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
    // Generated output, not source
    'coverage/**',
    'out-tsc/**',
    'test-results/**',
    'playwright-report/**',
    'storybook-static/**',
    // Not linted yet: no TypeScript parser is configured for these folders, so ESLint
    // only reported parse errors here. e2e/ joins once its waitForTimeout calls are
    // burned down (ENG-40475).
    'e2e/**',
    '.storybook/**',
  ],
}, storybook.configs["flat/recommended"]);
