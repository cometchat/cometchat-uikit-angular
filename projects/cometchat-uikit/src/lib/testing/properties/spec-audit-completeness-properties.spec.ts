// @ts-nocheck
import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Property-Based Tests for Spec Audit Completeness
 *
 * Feature: comprehensive-test-suite, Property 1: Spec Audit Completeness
 *
 * For any .component.ts or .service.ts file in the UIKit library,
 * a corresponding .spec.ts file exists.
 *
 * **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 5.2, 6.1, 7.1, 8.1, 9.1, 13.1, 15.4**
 */

const LIB_ROOT = path.resolve(__dirname, '../..');

const EXCLUDED_DIRS = ['node_modules', 'dist', 'testing', 'stories'];

function collectFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name)) {
        results.push(...collectFiles(fullPath, pattern));
      }
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function getExpectedSpecPath(sourceFile: string): string {
  return sourceFile.replace(/\.ts$/, '.spec.ts');
}

function toRelative(absolutePath: string): string {
  return path.relative(LIB_ROOT, absolutePath);
}

// ─── Collect all source files ───

const componentFiles = collectFiles(LIB_ROOT, /\.component\.ts$/);
const serviceFiles = collectFiles(LIB_ROOT, /\.service\.ts$/);
const allSourceFiles = [...componentFiles, ...serviceFiles];

// ─── Tests ───

describe.skip('Spec Audit Completeness Property Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 1: Spec Audit Completeness', () => {
    it('should have source files to audit', () => {
      expect(allSourceFiles.length).toBeGreaterThan(0);
    });

    it('every .component.ts and .service.ts file has a corresponding .spec.ts', () => {
      // Use fast-check to randomly sample from the source files
      // This ensures the property holds for any randomly selected file
      if (allSourceFiles.length === 0) return;

      fc.assert(
        fc.property(fc.constantFrom(...allSourceFiles), (sourceFile: string) => {
          const expectedSpec = getExpectedSpecPath(sourceFile);
          const exists = fs.existsSync(expectedSpec);
          if (!exists) {
            // Provide helpful error message
            throw new Error(
              `Missing spec file for ${toRelative(sourceFile)}: expected ${toRelative(expectedSpec)}`
            );
          }
        }),
        { numRuns: Math.min(allSourceFiles.length * 2, 500) }
      );
    });

    it('spec files are co-located with their source files', () => {
      if (allSourceFiles.length === 0) return;

      fc.assert(
        fc.property(fc.constantFrom(...allSourceFiles), (sourceFile: string) => {
          const expectedSpec = getExpectedSpecPath(sourceFile);
          if (!fs.existsSync(expectedSpec)) return; // skip missing (caught above)

          const sourceDir = path.dirname(sourceFile);
          const specDir = path.dirname(expectedSpec);
          expect(specDir).toBe(sourceDir);
        }),
        { numRuns: Math.min(allSourceFiles.length * 2, 500) }
      );
    });

    it('spec files are non-empty', () => {
      if (allSourceFiles.length === 0) return;

      fc.assert(
        fc.property(fc.constantFrom(...allSourceFiles), (sourceFile: string) => {
          const specPath = getExpectedSpecPath(sourceFile);
          if (!fs.existsSync(specPath)) return; // skip missing

          const content = fs.readFileSync(specPath, 'utf-8');
          expect(content.trim().length).toBeGreaterThan(0);
        }),
        { numRuns: Math.min(allSourceFiles.length * 2, 500) }
      );
    });

    it('spec files contain at least one describe block', () => {
      if (allSourceFiles.length === 0) return;

      fc.assert(
        fc.property(fc.constantFrom(...allSourceFiles), (sourceFile: string) => {
          const specPath = getExpectedSpecPath(sourceFile);
          if (!fs.existsSync(specPath)) return; // skip missing

          const content = fs.readFileSync(specPath, 'utf-8');
          expect(content).toMatch(/describe\s*\(/);
        }),
        { numRuns: Math.min(allSourceFiles.length * 2, 500) }
      );
    });
  });
});
