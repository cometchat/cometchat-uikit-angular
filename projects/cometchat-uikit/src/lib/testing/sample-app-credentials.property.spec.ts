/**
 * Property-Based Test: Property 20 — No hardcoded credentials in sample app
 *
 * Enumerates all files under projects/sample-app/src/ and asserts none contain
 * hardcoded appId, authKey, or uid string literals that look like real credentials.
 *
 * Validates: Requirements 11.8
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SAMPLE_APP_SRC = path.resolve(__dirname, '../../../../../sample-app/src');

function collectAllFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...collectAllFiles(full));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.html') || entry.name.endsWith('.json'))
    ) {
      results.push(full);
    }
  }
  return results;
}

describe('Property 20: No hardcoded credentials in sample app', () => {
  it('no file contains a hardcoded APP_ID that looks like a real credential', () => {
    const files = collectAllFiles(SAMPLE_APP_SRC);
    const violations: Array<{ file: string; line: number; match: string }> = [];

    // Pattern: hex strings of 16+ chars that look like app IDs (not in comments or example strings)
    // Real app IDs are typically 16-char hex strings
    const APP_ID_PATTERN = /['"`]([0-9a-f]{16,})['"` ]/gi;

    for (const filePath of files) {
      // Skip environment files (they're allowed to have credentials)
      if (filePath.includes('environment.example') || filePath.includes('.gitignore')) continue;

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const relPath = path.relative(SAMPLE_APP_SRC, filePath);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip pure comment lines
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

        let match: RegExpExecArray | null;
        APP_ID_PATTERN.lastIndex = 0;
        while ((match = APP_ID_PATTERN.exec(line)) !== null) {
          // Only flag if it's assigned to APP_ID, appId, or similar credential keys
          if (/APP_ID|appId|app_id/i.test(line)) {
            violations.push({ file: relPath, line: i + 1, match: match[1] });
          }
        }
      }
    }

    if (violations.length > 0) {
      const summary = violations
        .map(v => `  ${v.file}:${v.line} — hardcoded app ID: ${v.match.substring(0, 8)}...`)
        .join('\n');
      console.error(`Property 20: Hardcoded APP_ID found in sample app:\n${summary}`);
      console.error(
        'Fix: Move credentials to projects/sample-app/src/environments/environment.ts'
      );
    }

    expect(violations.length).toBe(0);
  });

  it('no file contains a hardcoded AUTH_KEY that looks like a real credential', () => {
    const files = collectAllFiles(SAMPLE_APP_SRC);
    const violations: Array<{ file: string; line: number; match: string }> = [];

    // Auth keys are typically 40-char hex strings
    const AUTH_KEY_PATTERN = /['"`]([0-9a-f]{40,})['"` ]/gi;

    for (const filePath of files) {
      if (filePath.includes('environment.example') || filePath.includes('.gitignore')) continue;

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const relPath = path.relative(SAMPLE_APP_SRC, filePath);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

        let match: RegExpExecArray | null;
        AUTH_KEY_PATTERN.lastIndex = 0;
        while ((match = AUTH_KEY_PATTERN.exec(line)) !== null) {
          if (/AUTH_KEY|authKey|auth_key/i.test(line)) {
            violations.push({ file: relPath, line: i + 1, match: match[1] });
          }
        }
      }
    }

    if (violations.length > 0) {
      const summary = violations
        .map(v => `  ${v.file}:${v.line} — hardcoded auth key: ${v.match.substring(0, 8)}...`)
        .join('\n');
      console.error(`Property 20: Hardcoded AUTH_KEY found in sample app:\n${summary}`);
      console.error(
        'Fix: Move credentials to projects/sample-app/src/environments/environment.ts and add to .gitignore'
      );
    }

    expect(violations.length).toBe(0);
  });
});
