/**
 * Offline E2E build of the sample app (`ng serve sample-app -c offline-e2e`).
 *
 * Points the SDK at the offline conformance harness's local fake CometChat
 * server (no real App ID or keys) and turns offline support on. Used only by
 * `playwright.offline.config.ts`.
 */
export const environment = {
  appId: 'app1',
  region: 'us',
  authKey: 'fake-server-auth-key',
  apiKey: '',
  userUid: 'alex',
  userUid2: 'sam',
  agentUid: '',
  agentName: '',
  /** Fake server data plane (`OFFLINE_SERVER_PORT`, default 48787). */
  clientHost: '127.0.0.1:48787/v3.0',
  adminHost: '127.0.0.1:48787/v3.0',
  /** Turn on the SDK's offline support. */
  offline: true,
  /** The Calls SDK has no fake server; its failed login would clear the chat session. */
  calling: false,
  /** Install the frame probe (`globalThis.__ccFrameProbe`). */
  frameProbe: true,
};
