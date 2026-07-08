/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    angular({
      tsconfig: 'projects/cometchat-uikit/tsconfig.spec.json',
      include: ['projects/**/*.ts'],
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    // ENG-36336 — the card renderer (`@cometchat/cards`) ships ESM with
    // directory-style re-exports (`export * from './core'`) that Node's native
    // ESM resolver rejects. Inline it so Vite transforms it for any spec that
    // imports a card-rendering component (card bubble, AI-assistant, stream).
    server: {
      deps: {
        inline: [/@cometchat\/cards/, /@cometchat\/cards-angular/],
      },
    },
    include: ['projects/**/*.spec.ts', 'scripts/**/*.spec.ts', '.storybook/__tests__/**/*.spec.ts'],
    exclude: [
      '**/node_modules/**',
      // Excluded from test runs — not yet ready for unit testing
      '**/cometchat-link-popover/**',
      '**/cometchat-popover/**',
      '**/cometchat-typing-indicator/**',
      '**/cometchat-error-boundary/**',
    ],
    setupFiles: ['./vitest.setup.mjs'],
    testTimeout: 30000,
    pool: 'forks',
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    reporters: ['default', ['json', { outputFile: 'test-results/vitest-full-results.json' }]],
    coverage: {
      provider: 'istanbul',
      reportOnFailure: true,
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['projects/cometchat-uikit/src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/*.spec.ts',
        '**/index.ts',
        '**/public-api.ts',
        '**/*.stories.ts',
        '**/environments/**',
        'projects/sample-app/**',
        // Type-only files — no executable logic to measure
        '**/*.types.ts',
        // Vendored third-party audio renderer — not our code
        '**/wavesurfer/**',
        // Internal dev/analysis tooling — not UIKit library code
        '**/analyzers/**',
        // Test infrastructure files — exist to support tests, not to be tested
        '**/test-setup.ts',
        'projects/cometchat-uikit/src/lib/testing/mock-*.ts',
        'projects/cometchat-uikit/src/lib/testing/test-helpers.ts',
        'projects/cometchat-uikit/src/lib/testing/accessibility-test-utils.ts',
        // Thin component-bound delegation files — no independently testable logic;
        // these only wire keyboard/selection/sound events into the host component
        '**/*.keyboard.ts',
        '**/*.selection.ts',
        '**/*.sound-utils.ts',
        '**/*.announce-utils.ts',
        // Excluded components — not yet ready for coverage measurement
        '**/cometchat-link-popover/**',
        '**/cometchat-popover/**',
        '**/cometchat-typing-indicator/**',
        '**/cometchat-error-boundary/**',
      ],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
  // Uncomment this to use the local UI Kit path instead of the npm path
  resolve: {
    alias: {
      '@cometchat/chat-uikit-angular': resolve(__dirname, 'projects/cometchat-uikit/src/public-api.ts'),
    },
  },
});
