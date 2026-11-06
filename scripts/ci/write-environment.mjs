#!/usr/bin/env node
// Write projects/sample-app/src/environments/environment.ts from the E2E_* variables, because the
// sample app reads its App ID, region and Auth Key at startup. E2E jobs pass the `e2e`
// environment's secrets, and their build stays inside the job. The committed environment.ts keeps
// placeholders, and build-sample-app checks that build.
import { writeFileSync } from 'node:fs';

const required = ['E2E_APP_ID', 'E2E_REGION', 'E2E_AUTH_KEY'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`write-environment: missing ${missing.join(', ')}`);
  process.exit(1);
}
const e = (k, fallback = '') => JSON.stringify(process.env[k] ?? fallback);
writeFileSync(
  'projects/sample-app/src/environments/environment.ts',
  `// Written by scripts/ci/write-environment.mjs for this E2E run only. Never commit.
export const environment = {
  appId: ${e('E2E_APP_ID')},
  region: ${e('E2E_REGION')},
  authKey: ${e('E2E_AUTH_KEY')},
  apiKey: '',
  userUid: ${e('E2E_USER_UID', 'cometchat-uid-1')},
  userUid2: ${e('E2E_USER_UID2', 'cometchat-uid-2')},
  agentUid: ${e('E2E_AGENT_UID')},
  agentName: ${e('E2E_AGENT_NAME')},
};
`
);
console.log('write-environment: environment.ts written from E2E_* variables (values not printed)');
