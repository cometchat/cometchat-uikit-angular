#!/usr/bin/env node
// CI 4 mutation (ENG-40612): the lines a PR changed in the in-scope services, as a comma list of
// Stryker `file.ts:start-end` ranges for STRYKER_MUTATE. Mutating whole files is far too slow on
// GitHub runners (one file, 136 mutants: 16 min locally, over 60 min on a runner), so a PR mutates
// only the lines it adds or changes. Prints nothing when it changes none.
//   node scripts/ci/mutation-scope.mjs <base-sha> <head-sha>
import { execFileSync } from 'node:child_process';

const [, , base, head] = process.argv;
const SCOPE = [
  /^projects\/cometchat-uikit\/src\/lib\/services\/html-sanitizer\.service\.ts$/,
  /^projects\/cometchat-uikit\/src\/lib\/services\/message-list\.[\w-]+\.ts$/,
  /^projects\/cometchat-uikit\/src\/lib\/services\/message-composer\.(service|utils)\.ts$/,
  /^projects\/cometchat-uikit\/src\/lib\/services\/(call-buttons|incoming-call|outgoing-call)\.service\.ts$/,
];
const diff = execFileSync('git', ['diff', '--unified=0', '--no-color', '--diff-filter=AM', `${base}...${head}`, '--', 'projects/cometchat-uikit/src/lib/services'], { encoding: 'utf8', maxBuffer: 64 << 20 });
const ranges = [];
let file = null;
for (const line of diff.split('\n')) {
  if (line.startsWith('+++ ')) {
    const f = line.startsWith('+++ b/') ? line.slice(6) : null;
    file = f && !f.endsWith('.spec.ts') && !f.endsWith('.types.ts') && SCOPE.some((r) => r.test(f)) ? f : null;
  } else if (file && line.startsWith('@@')) {
    const m = line.match(/\+(\d+)(?:,(\d+))?/);
    const start = Number(m[1]);
    const count = m[2] === undefined ? 1 : Number(m[2]);
    if (count > 0) ranges.push(`${file}:${start}-${start + count - 1}`);
  }
}
process.stdout.write(ranges.join(','));
