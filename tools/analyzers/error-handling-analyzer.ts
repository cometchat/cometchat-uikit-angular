/**
 * Error Handling Consistency Analyzer
 * Scans for silent catch blocks, missing error states, and unhandled promises.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ErrorHandlingReport, ErrorHandlingViolation } from './types';

function scanDir(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...scanDir(full));
    else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') && !entry.name.endsWith('.stories.ts') && entry.name !== 'index.ts') {
      results.push(full);
    }
  }
  return results;
}

export function analyzeErrorHandling(libRoot: string): ErrorHandlingReport {
  const violations: ErrorHandlingViolation[] = [];
  const dirs = [path.join(libRoot, 'components'), path.join(libRoot, 'services')];

  for (const dir of dirs) {
    const files = scanDir(dir);
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8');
      const relPath = path.relative(libRoot, f);
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check for empty catch blocks
        if (/catch\s*\(/.test(line)) {
          // Look at next few lines for the catch body
          const bodyLines = lines.slice(i + 1, i + 5).map(l => l.trim()).filter(l => l && l !== '{' && l !== '}');
          const hasLogging = bodyLines.some(l =>
            l.includes('CometChatLogger') || l.includes('console.') || l.includes('throw') ||
            l.includes('this.error') || l.includes('emit') || l.includes('state') ||
            l.includes('States.error') || l.includes('fetchState')
          );
          if (!hasLogging && bodyLines.length === 0) {
            violations.push({
              filePath: relPath, line: i + 1,
              type: 'silent-catch',
              description: 'Empty catch block — error silently swallowed',
              suggestedFix: 'Add CometChatLogger.error() call and error state propagation',
            });
          } else if (!hasLogging && bodyLines.every(l => l.startsWith('//'))) {
            violations.push({
              filePath: relPath, line: i + 1,
              type: 'silent-catch',
              description: 'Catch block contains only comments — error silently swallowed',
              suggestedFix: 'Add CometChatLogger.error() call',
            });
          }
        }

        // Check for .then().catch() chains (should use async/await)
        if (/\.then\s*\(/.test(line) && !line.includes('// legacy')) {
          // Check if there's a .catch nearby
          const nextLines = lines.slice(i, i + 5).join(' ');
          if (/\.then\s*\([^)]*\)\s*\.catch/.test(nextLines)) {
            violations.push({
              filePath: relPath, line: i + 1,
              type: 'unhandled-promise',
              description: '.then().catch() chain — prefer async/await with try/catch',
              suggestedFix: 'Convert to async/await with try/catch for consistency',
            });
          }
        }
      }

      // Check for errorView input without error state setting
      if (content.includes('errorView') && content.includes('@Input')) {
        if (!content.includes('States.error') && !content.includes('fetchState') && !content.includes('errorState') && !content.includes('hasError')) {
          violations.push({
            filePath: relPath, line: 1,
            type: 'missing-error-view',
            description: 'Component has errorView input but no error state management',
            suggestedFix: 'Add error state that sets when SDK operations fail',
          });
        }
      }
    }
  }

  const byType: Record<string, number> = {};
  for (const v of violations) {
    byType[v.type] = (byType[v.type] || 0) + 1;
  }

  return {
    violations,
    summary: { totalViolations: violations.length, byType },
  };
}
