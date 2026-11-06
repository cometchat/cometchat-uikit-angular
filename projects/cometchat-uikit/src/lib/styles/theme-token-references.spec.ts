/**
 * Every theme variable a component reads must resolve.
 *
 * A `var(--cometchat-x)` whose variable is defined nowhere and that carries no
 * fallback makes its whole declaration invalid at computed-value time, so the
 * property silently falls back to its initial value: a menu loses its shadow,
 * a focus ring disappears. Component-level hooks such as
 * `var(--cometchat-composer-gap, var(--cometchat-spacing-2))` are fine as long
 * as the last value in the chain resolves.
 *
 * "Defined" means declared (`--cometchat-x: …`) in any stylesheet, template or
 * script under src/, so tokens set by the theme, a component's :host or code
 * all count.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

const SRC_DIR = path.resolve(__dirname, '../..');

const SOURCE_FILES = globSync('**/*.{css,ts,html}', {
  cwd: SRC_DIR,
  absolute: true,
  ignore: ['**/*.spec.ts', '**/*.stories.ts'],
}).sort();

/** Blank out comments, keeping their line breaks so reported line numbers stay right. */
const stripComments = (text: string): string =>
  text.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ''));

const DEFINED = new Set(
  SOURCE_FILES.flatMap((file) =>
    [...stripComments(fs.readFileSync(file, 'utf8')).matchAll(/(--cometchat-[a-z0-9-]+)\s*:/g)].map((m) => m[1])
  )
);

/** `var(--cometchat-x)` with nothing after the name: the chain ends on it. */
const TERMINAL_REFERENCE = /var\(\s*(--cometchat-[a-z0-9-]+)\s*\)/g;

/** Every terminal reference to a variable that is defined nowhere, as `file:line name`. */
function unresolvedReferences(): string[] {
  const found: string[] = [];
  for (const file of SOURCE_FILES.filter((f) => f.endsWith('.css'))) {
    stripComments(fs.readFileSync(file, 'utf8'))
      .split('\n')
      .forEach((line, i) => {
        for (const [, name] of line.matchAll(TERMINAL_REFERENCE)) {
          if (!DEFINED.has(name)) found.push(`${path.relative(SRC_DIR, file)}:${i + 1} ${name}`);
        }
      });
  }
  return found;
}

describe('theme token references', () => {
  it('finds the theme and component stylesheets', () => {
    expect(SOURCE_FILES.filter((f) => f.endsWith('.css')).length).toBeGreaterThan(50);
    expect(DEFINED.has('--cometchat-primary-color')).toBe(true);
  });

  it('every var(--cometchat-*) without a fallback names a defined variable', () => {
    expect(unresolvedReferences()).toEqual([]);
  });
});
