#!/usr/bin/env node
// Lint the STAGED content of the given files (what the commit will contain), not the working
// copy. Used by the pre-commit hook. ESLint's bulk suppressions (eslint-suppressions.json) only
// apply to files linted from disk, so they are applied here the same way: per file and rule, the
// first `count` errors are the accepted baseline and only errors beyond it block.
//
//   node scripts/lint-staged.mjs <file>...
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { ESLint } from 'eslint';

const files = process.argv.slice(2);
const baseline = existsSync('eslint-suppressions.json') ? JSON.parse(readFileSync('eslint-suppressions.json', 'utf8')) : {};
const eslint = new ESLint();
const formatter = await eslint.loadFormatter('stylish');

/** Errors beyond the file's suppressed count for their rule. */
export function newErrors(messages, suppressed = {}) {
  const byRule = new Map();
  for (const m of messages.filter((x) => x.severity === 2)) {
    const rule = m.ruleId ?? 'fatal';
    byRule.set(rule, [...(byRule.get(rule) ?? []), m]);
  }
  const out = [];
  for (const [rule, ms] of byRule) out.push(...ms.slice(suppressed[rule]?.count ?? 0));
  return out;
}

let failed = false;
for (const file of files) {
  const code = execFileSync('git', ['show', `:${file}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const [result] = await eslint.lintText(code, { filePath: file, warnIgnored: false });
  if (!result) continue; // ignored by the config
  const extra = newErrors(result.messages, baseline[file]);
  if (extra.length) {
    failed = true;
    process.stdout.write(formatter.format([{ ...result, messages: extra, errorCount: extra.length, warningCount: 0, fatalErrorCount: 0 }]));
  }
}
process.exit(failed ? 1 : 0);
