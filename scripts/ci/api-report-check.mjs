#!/usr/bin/env node
// CI 3 api-diff (ENG-40479): compare the public API report api-extractor just wrote
// (`api-extractor run --local` overwrites api/cometchat-uikit.api.md) with the committed one.
//
// The Angular build writes inferred union types in an order that can differ between machines
// ("loading" | "error" vs "error" | "loading"), so both sides are normalised first: the members of
// every union are sorted. Any other difference is a real API change and fails, with a diff. For an
// intended change, commit the regenerated report in the same PR so the change is reviewed.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const REPORT = 'api/cometchat-uikit.api.md';

/** Sort the members of each union, at every bracket depth, so member order doesn't matter. */
export function normalise(text) {
  const OPEN = { '(': ')', '[': ']', '{': '}', '<': '>' };
  let i = 0;
  function group(close) {
    // Parts are separated by ',' or ';' at this depth; each part may be a union split by '|'.
    const parts = [];
    let part = [''];
    const push = (s) => (part[part.length - 1] += s);
    while (i < text.length) {
      const c = text[i];
      if (c === '=' && text[i + 1] === '>') { push('=>'); i += 2; continue; }
      if (close && c === close) { i++; break; }
      if (OPEN[c]) { i++; push(c + group(OPEN[c]) + OPEN[c]); continue; }
      if (c === '|' && close !== null) { part.push(''); i++; continue; }
      if ((c === ',' || c === ';' || c === '\n') ) { parts.push(part, c); part = ['']; i++; continue; }
      push(c);
      i++;
    }
    parts.push(part);
    return parts.map((p) => (typeof p === 'string' ? p : p.length > 1 ? sortUnion(p) : p[0])).join('');
  }
  // The first member may carry a prefix such as "    x: " or "type T = "; keep it in place and sort
  // only the union members after the last top-level ':' or '=' (not '=>').
  function sortUnion(members) {
    const first = members[0];
    let cut = -1;
    let depth = 0;
    for (let k = 0; k < first.length; k++) {
      const c = first[k];
      if ('([{<'.includes(c)) depth++;
      else if (')]}>'.includes(c) && first[k - 1] !== '=') depth--;
      else if (depth === 0 && (c === ':' || (c === '=' && first[k + 1] !== '>'))) cut = k;
    }
    const prefix = cut >= 0 ? first.slice(0, cut + 1) + ' ' : '';
    const rest = [cut >= 0 ? first.slice(cut + 1) : first, ...members.slice(1)].map((m) => m.trim()).sort();
    return (cut >= 0 ? prefix.replace(/\s+$/, ' ') : first.match(/^\s*/)[0]) + rest.join(' | ');
  }
  // Normalise line by line.
  return text
    .split('\n')
    .map((line) => {
      i = 0;
      const saved = text;
      text = line;
      const out = group('\u0000');
      text = saved;
      return out;
    })
    .join('\n');
}

const committed = execFileSync('git', ['show', `HEAD:${REPORT}`], { encoding: 'utf8', maxBuffer: 64 << 20 });
const current = readFileSync(REPORT, 'utf8');
const a = normalise(committed).split('\n');
const b = normalise(current).split('\n');

if (a.length === b.length && a.every((line, k) => line === b[k])) {
  const raw = committed === current ? '' : ' (only union member order differs from the committed report)';
  console.log(`✓ public API unchanged${raw}`);
  process.exit(0);
}

console.error('✗ The public API changed. Lines that differ (normalised):');
const max = Math.max(a.length, b.length);
let shown = 0;
for (let k = 0; k < max && shown < 60; k++) {
  if (a[k] !== b[k]) {
    if (a[k] !== undefined) console.error(`- ${a[k]}`);
    if (b[k] !== undefined) console.error(`+ ${b[k]}`);
    shown++;
  }
}
console.error(
  `\nIf intended: npx ng build cometchat-uikit && npx -y @microsoft/api-extractor@7.59.4 run --local, then commit ${REPORT} in this PR.`
);
process.exit(1);
