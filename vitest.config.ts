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
    include: ['projects/**/*.spec.ts', 'scripts/**/*.spec.ts', '.storybook/__tests__/**/*.spec.ts'],
    exclude: ['**/node_modules/**'],
    setupFiles: ['./vitest.setup.mjs'],
    testTimeout: 30000,
    pool: 'forks',
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    reporters: ['default', ['json', { outputFile: 'test-results/failed-tests.json' }]],
  },
  // Uncomment this to use the local UI Kit path instead of the npm path
  // resolve: {
  //   alias: {
  //     '@cometchat/chat-uikit-angular': resolve(__dirname, 'projects/cometchat-uikit/src/public-api.ts'),
  //   },
  // },
});
