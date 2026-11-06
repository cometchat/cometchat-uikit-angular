/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { DurationShardSequencer } from './scripts/ci/unit-shard-sequencer.mjs';

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
    exclude: ['**/node_modules/**'],
    setupFiles: ['./vitest.setup.mjs'],
    testTimeout: 30000,
    pool: 'forks',
    fileParallelism: false,
    sequence: {
      concurrent: false,
      // --shard splits by recorded run time, not file count (ENG-40609).
      sequencer: DurationShardSequencer,
    },
    reporters: ['default', ['json', { outputFile: 'test-results/vitest-full-results.json' }]],
    coverage: {
      provider: 'istanbul',
      reportOnFailure: true,
      // json writes coverage-final.json: per-line data for the PR gate's changed-lines check.
      reporter: ['text', 'html', 'lcov', 'json-summary', 'json'],
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
        // Unused: extracted in ENG-34651, but each component kept its own copy of these helpers, so
        // nothing in the library (or its public API) imports them and they are not in the package.
        // Their tests were removed with them as dead tests; delete the files when convenient.
        '**/cometchat-group-members.scope-utils.ts',
        '**/cometchat-message-bubble.aria-utils.ts',
        '**/cometchat-message-composer.toolbar-utils.ts',
        '**/cometchat-message-bubble.call-utils.ts',
        '**/cometchat-message-header.typing-utils.ts',
        '**/cometchat-conversations.keyboard.ts',
        '**/cometchat-groups.utils.ts',
        '**/cometchat-users.section-utils.ts',
        '**/cometchat-message-list.date-utils.ts',
        '**/cometchat-conversations.sound-utils.ts',
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
