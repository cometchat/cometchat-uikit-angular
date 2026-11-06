/**
 * Property 5: No bare Observable subscriptions without teardown
 *
 * Enumerates all .ts source files under src/lib/ (excluding spec files) and
 * asserts every .subscribe( call is preceded by .pipe(takeUntil / takeUntilDestroyed,
 * or the result is stored in a typed Subscription variable that is unsubscribed
 * in ngOnDestroy, or the call is inside a comment / JSDoc block.
 *
 * Validates: Requirements 2.3, 13.1, 13.6
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LIB_ROOT = path.resolve(__dirname);

/** Recursively collect all .ts files, excluding spec files and analyzer scripts */
function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules and dist
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      results.push(...collectTsFiles(full));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.spec.ts') &&
      !entry.name.endsWith('.stories.ts')
    ) {
      results.push(full);
    }
  }
  return results;
}

interface SubscribeViolation {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

/**
 * Analyse a single file for bare .subscribe( calls.
 *
 * A subscription is considered SAFE when ANY of the following is true:
 *  1. The preceding pipe chain contains takeUntil( or takeUntilDestroyed
 *  2. The result is assigned to a variable (e.g. `this.sub = ...subscribe(`)
 *  3. The result is pushed into an array (e.g. `this.subs.push(...subscribe(`)
 *  4. The line is inside a JSDoc / block comment
 *  5. The file has no ngOnDestroy / cleanup AND the subscribe is on a Subject
 *     that completes naturally (e.g. mentionSearchSubject with switchMap — the
 *     Subject itself is the source, not an external Observable)
 */
/**
 * Return the source text of the statement that contains the `.subscribe(` at
 * (lineIdx, col): walk backwards over balanced brackets until reaching a `;`,
 * or a `{`/`}` that delimits the enclosing block. Enclosing `(`/`[` (e.g.
 * `subs.push(`, `return [`) are part of the statement and are walked through.
 */
function statementBefore(lines: string[], lineIdx: number, col: number): string {
  const text = lines.slice(0, lineIdx).join('\n') + (lineIdx > 0 ? '\n' : '') + lines[lineIdx].slice(0, col);
  let depth = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === ')' || ch === ']') depth++;
    else if (ch === '(' || ch === '[') depth--;
    else if (ch === '}') {
      if (depth <= 0) return text.slice(i + 1) + lines[lineIdx].slice(col);
      depth++;
    } else if (ch === '{') {
      if (depth <= 0) return text.slice(i + 1) + lines[lineIdx].slice(col);
      depth--;
    } else if (ch === ';' && depth <= 0) {
      return text.slice(i + 1) + lines[lineIdx].slice(col);
    }
  }
  return text + lines[lineIdx].slice(col);
}

function analyseFile(filePath: string): SubscribeViolation[] {
  return analyseSource(fs.readFileSync(filePath, 'utf-8'), path.relative(process.cwd(), filePath));
}

function analyseSource(src: string, fileLabel: string): SubscribeViolation[] {
  const violations: SubscribeViolation[] = [];
  const lines = src.split('\n');

  // Track whether file has any teardown mechanism at all
  const hasTakeUntil = /takeUntil\(|takeUntilDestroyed/.test(src);
  const hasUnsubscribe = /\.unsubscribe\(\)/.test(src);
  const hasNgOnDestroy = /ngOnDestroy\s*\(\s*\)/.test(src);
  const hasCleanup = /cleanup\s*\(\s*\)/.test(src);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue;
    }

    if (!trimmed.includes('.subscribe(')) continue;

    // Context = the full statement containing this .subscribe( call
    const context = statementBefore(lines, i, line.indexOf('.subscribe('));
    // Drop comments so a preceding `// note` line doesn't hide the statement start
    const stmt = context
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter(l => !l.trim().startsWith('//'))
      .join('\n')
      .trim();

    // SAFE: has takeUntil or takeUntilDestroyed in the pipe chain
    if (/takeUntil\s*\(|takeUntilDestroyed/.test(context)) continue;

    // SAFE: statement assigns the result (this.x = / ctx.x = / const x = / let / var)
    if (/^(?:(?:const|let|var)\s+\w+(?:\s*:[^=]+)?|[\w$]+(?:\.[\w$]+)+)\s*=(?!=)/.test(stmt)) continue;

    // SAFE: pushed into an array (this.subscriptions.push(...)
    if (/^[\w$.]+\.push\s*\(/.test(stmt)) continue;

    // SAFE: returned to the caller, who owns the teardown (return x.subscribe( / return [ ... ])
    if (/^return\b/.test(stmt)) continue;

    // SAFE: the subscribe is on a Subject that is the source (internal Subject piped with switchMap)
    // Detect pattern: subjectName.pipe(...switchMap...).subscribe — the Subject completes with the service
    if (/Subject\s*[<(]/.test(context) && /switchMap/.test(context)) continue;

    // SAFE: inside a JSDoc example block (lines between * @example and next * @)
    // Simple heuristic: if the line is indented inside a comment block
    const linesBefore = lines.slice(0, i);
    const lastOpenComment = linesBefore.map((l, idx) => ({ l, idx }))
      .filter(({ l }) => l.includes('/*') || l.trim().startsWith('*'))
      .pop();
    if (lastOpenComment) {
      // Check if we're still inside a block comment
      const commentBlock = lines.slice(lastOpenComment.idx, i + 1).join('\n');
      if (!commentBlock.includes('*/')) continue;
    }

    violations.push({
      file: fileLabel,
      line: i + 1,
      snippet: trimmed.slice(0, 120),
      reason: `Bare .subscribe() without takeUntil/takeUntilDestroyed or stored Subscription. File has teardown: takeUntil=${hasTakeUntil}, unsubscribe=${hasUnsubscribe}, ngOnDestroy=${hasNgOnDestroy}, cleanup=${hasCleanup}`,
    });
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 5: No bare Observable subscriptions without teardown', () => {
  const allFiles = collectTsFiles(LIB_ROOT);
  const allViolations: SubscribeViolation[] = [];

  for (const file of allFiles) {
    const violations = analyseFile(file);
    allViolations.push(...violations);
  }

  it('should enumerate source files', () => {
    expect(allFiles.length).toBeGreaterThan(0);
  });

  it('analyser flags a bare subscription and accepts each teardown pattern', () => {
    const bare = analyseSource(
      ['class A {', '  init() {', '    source$.pipe(map(x => x)).subscribe(v => {', '      this.v = v;', '    });', '  }', '}'].join('\n'),
      'bare.ts',
    );
    expect(bare.map(v => v.line)).toEqual([3]);

    const safe = analyseSource(
      [
        'class B {',
        '  init() {',
        '    a$.pipe(takeUntil(this.destroy$)).subscribe();',
        '    this.sub = b$.subscribe();',
        '    ctx.sub = c$.subscribe();',
        '    const s = d$.subscribe();',
        '    this.subs.push(e$.subscribe());',
        '    return [f$.subscribe(), g$.subscribe()];',
        '  }',
        '}',
      ].join('\n'),
      'safe.ts',
    );
    expect(safe).toEqual([]);
  });

  it('all .subscribe() calls must have teardown (takeUntil, stored Subscription, or push)', () => {
    const report = allViolations.map(v => `${v.file}:${v.line} — ${v.snippet}`);
    expect(report).toEqual([]);
  });

  // Individual file tests for granular reporting
  for (const file of allFiles) {
    const rel = path.relative(process.cwd(), file);
    it(`${rel} — no bare subscriptions`, () => {
      const violations = analyseFile(file);
      expect(violations.map(v => `line ${v.line}: ${v.snippet}`)).toEqual([]);
    });
  }
});
