/**
 * CometChat environment configuration.
 *
 * Single source of truth for all credentials used by:
 * - Sample app (main.ts)
 * - E2E tests (Playwright)
 * - Storybook (stories that initialize CometChat)
 *
 * IMPORTANT: Do not commit real credentials to source control.
 * Copy this file to environment.local.ts and add it to .gitignore,
 * or override via environment variables (E2E_APP_ID, E2E_AUTH_KEY, etc.)
 */
export const environment = {
  /** CometChat App ID — from https://app.cometchat.com */
  appId: 'appId',

  /** CometChat Region (us, eu, in) */
  region: 'region',

  /** CometChat Auth Key — used by the sample app and E2E login */
  authKey: 'authKey',

  /** CometChat REST API Key — used by E2E test setup to create/delete test data */
  apiKey: 'apiKey',

  /** Primary test user UID — used by E2E tests to log in */
  userUid: 'userUid',

  /** Secondary test user UID — used by E2E tests for real-time messaging */
  userUid2: 'userUid2',
};
