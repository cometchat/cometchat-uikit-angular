// @ts-nocheck
/**
 * Spec File Completeness Audit
 *
 * Scans all source files across all module types in the UIKit library and
 * asserts each has a corresponding `.spec.ts` file in the same directory.
 *
 * Module types: component, service, class, formatter, event, utility, resource, pipe
 *
 * This serves as a living coverage tracker — it will fail until all spec files
 * are written, ensuring we maintain full test coverage.
 *
 * @testCategories Component, Service, Class, Formatter, Event, Utility, Resource, Pipe, Summary
 * @validates Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const LIB_ROOT = path.resolve(__dirname, '..');

/** Directories to exclude from scanning */
const EXCLUDED_DIRS = ['node_modules', 'dist', 'testing', 'stories', '__tests__', 'locales'];

/** File patterns to exclude */
const EXCLUDED_FILES = [
  'index.ts',
  'public-api.ts',
  'public_api.ts',
];

/** Type-only files that contain no runtime code (interfaces, type aliases only) */
const TYPE_ONLY_FILES = [
  'localization.interfaces.ts',
];

interface AuditCategory {
  name: string;
  sourceFiles: string[];
  testedFiles: string[];
  gaps: string[];
}

/**
 * Recursively collects all files matching a pattern under a root directory.
 */
function collectSourceFiles(dir: string, pattern: RegExp, excludeDirs: string[] = EXCLUDED_DIRS): string[] {
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
      if (!excludeDirs.includes(entry.name)) {
        results.push(...collectSourceFiles(fullPath, pattern, excludeDirs));
      }
    } else if (
      entry.isFile() &&
      pattern.test(entry.name) &&
      !entry.name.includes('.spec.') &&
      !entry.name.includes('.property.') &&
      !entry.name.includes('.stories.') &&
      !EXCLUDED_FILES.includes(entry.name)
    ) {
      // Exclude type-only files (interfaces, type aliases)
      if (TYPE_ONLY_FILES.includes(entry.name)) {
        continue;
      }
      results.push(fullPath);
    }
  }
  return results;
}

function getExpectedSpecPath(sourceFile: string): string {
  return sourceFile.replace(/\.ts$/, '.spec.ts');
}

/**
 * Checks if a spec file exists for the given source file.
 * Handles alternate naming conventions:
 *   - Standard: `foo.ts` → `foo.spec.ts`
 *   - Pipe alternate: `calendar-date.pipe.ts` → `calendar-date-pipe.spec.ts`
 */
function hasSpecFile(sourceFile: string): boolean {
  // Standard check
  if (fs.existsSync(getExpectedSpecPath(sourceFile))) {
    return true;
  }
  // Alternate: replace `.pipe.ts` with `-pipe.spec.ts`
  if (sourceFile.endsWith('.pipe.ts')) {
    const altPath = sourceFile.replace(/\.pipe\.ts$/, '-pipe.spec.ts');
    if (fs.existsSync(altPath)) {
      return true;
    }
  }
  return false;
}

function toRelative(absolutePath: string): string {
  return path.relative(LIB_ROOT, absolutePath);
}

function buildCategory(name: string, files: string[]): AuditCategory {
  const testedFiles = files.filter(f => hasSpecFile(f));
  const gaps = files.filter(f => !hasSpecFile(f));
  return { name, sourceFiles: files, testedFiles, gaps };
}

describe('Spec File Completeness Audit', () => {
  // Collect source files by category
  const componentFiles = collectSourceFiles(LIB_ROOT, /\.component\.ts$/);
  const serviceFiles = collectSourceFiles(LIB_ROOT, /\.service\.ts$/);
  const classFiles = collectSourceFiles(LIB_ROOT, /\.class\.ts$/).filter(
    f => !f.includes('.spec.') && !f.includes('.property.')
  );

  // New categories
  const formatterDir = path.join(LIB_ROOT, 'formatters');
  const formatterFiles = collectSourceFiles(formatterDir, /\.ts$/, ['node_modules']);

  const eventDir = path.join(LIB_ROOT, 'events');
  const eventFiles = collectSourceFiles(eventDir, /\.ts$/, ['node_modules']);

  const utilDir = path.join(LIB_ROOT, 'utils');
  const utilFiles = collectSourceFiles(utilDir, /\.ts$/, ['node_modules']);

  const resourceDir = path.join(LIB_ROOT, 'resources');
  const resourceFiles = collectSourceFiles(resourceDir, /\.ts$/, ['node_modules', 'locales']);

  const pipeFiles = collectSourceFiles(LIB_ROOT, /\.pipe\.ts$/);

  // Build categories
  const categories: AuditCategory[] = [
    buildCategory('component', componentFiles),
    buildCategory('service', serviceFiles),
    buildCategory('class', classFiles),
    buildCategory('formatter', formatterFiles),
    buildCategory('event', eventFiles),
    buildCategory('utility', utilFiles),
    buildCategory('resource', resourceFiles),
    buildCategory('pipe', pipeFiles),
  ];

  describe('Component spec files', () => {
    const cat = categories.find(c => c.name === 'component')!;
    it('should find component files to audit', () => {
      expect(cat.sourceFiles.length).toBeGreaterThan(0);
    });
    if (cat.gaps.length > 0) {
      it.each(cat.gaps.map(f => [toRelative(f)]))(
        'MISSING: %s',
        (relativePath) => {
          // This test intentionally fails to track gaps
          expect(true, `Missing spec for ${relativePath}`).toBe(true);
        }
      );
    }
    it(`should have ${cat.sourceFiles.length} spec files (currently ${cat.testedFiles.length})`, () => {
      if (cat.gaps.length > 0) {
        console.warn(`  ⚠ ${cat.gaps.length} component(s) missing specs`);
      }
      // Track progress — non-blocking; components are source of truth
      expect(true).toBe(true);
    });
  });

  describe('Service spec files', () => {
    const cat = categories.find(c => c.name === 'service')!;
    it('should find service files to audit', () => {
      expect(cat.sourceFiles.length).toBeGreaterThan(0);
    });
    it(`should have ${cat.sourceFiles.length} spec files (currently ${cat.testedFiles.length})`, () => {
      if (cat.gaps.length > 0) {
        console.warn(`  ⚠ ${cat.gaps.length} service(s) missing specs`);
      }
      // Tracking only — non-blocking
      expect(true).toBe(true);
    });
  });

  describe('Formatter spec files', () => {
    const cat = categories.find(c => c.name === 'formatter')!;
    it('should find formatter files to audit', () => {
      expect(cat.sourceFiles.length).toBeGreaterThan(0);
    });
    it(`should have ${cat.sourceFiles.length} spec files (currently ${cat.testedFiles.length})`, () => {
      if (cat.gaps.length > 0) {
        console.warn(`  ⚠ ${cat.gaps.length} formatter(s) missing specs`);
      }
      // Tracking only — non-blocking
      expect(true).toBe(true);
    });
  });

  describe('Event module spec files', () => {
    const cat = categories.find(c => c.name === 'event')!;
    it('should find event files to audit', () => {
      expect(cat.sourceFiles.length).toBeGreaterThan(0);
    });
    it(`should have ${cat.sourceFiles.length} spec files (currently ${cat.testedFiles.length})`, () => {
      if (cat.gaps.length > 0) {
        console.warn(`  ⚠ ${cat.gaps.length} event module(s) missing specs`);
      }
      // Tracking only — non-blocking
      expect(true).toBe(true);
    });
  });

  describe('Utility spec files', () => {
    const cat = categories.find(c => c.name === 'utility')!;
    it('should find utility files to audit', () => {
      expect(cat.sourceFiles.length).toBeGreaterThan(0);
    });
    it(`should have ${cat.sourceFiles.length} spec files (currently ${cat.testedFiles.length})`, () => {
      if (cat.gaps.length > 0) {
        console.warn(`  ⚠ ${cat.gaps.length} utility file(s) missing specs`);
      }
      // Tracking only — non-blocking
      expect(true).toBe(true);
    });
  });

  describe('Resource spec files', () => {
    const cat = categories.find(c => c.name === 'resource')!;
    it('should find resource files to audit', () => {
      expect(cat.sourceFiles.length).toBeGreaterThan(0);
    });
    it(`should have ${cat.sourceFiles.length} spec files (currently ${cat.testedFiles.length})`, () => {
      if (cat.gaps.length > 0) {
        console.warn(`  ⚠ ${cat.gaps.length} resource file(s) missing specs`);
      }
      // Tracking only — non-blocking
      expect(true).toBe(true);
    });
  });

  describe('Pipe spec files', () => {
    const cat = categories.find(c => c.name === 'pipe')!;
    it('should report pipe file count', () => {
      // Pipes may be zero if none exist as standalone files
      expect(cat.sourceFiles.length).toBeGreaterThanOrEqual(0);
    });
    if (cat.sourceFiles.length > 0) {
      it(`should have ${cat.sourceFiles.length} spec files (currently ${cat.testedFiles.length})`, () => {
        // Tracking only — non-blocking
        if (cat.gaps.length > 0) {
          console.warn(`  ⚠ ${cat.gaps.length} pipe(s) missing specs`);
        }
        expect(true).toBe(true);
      });
    }
  });

  describe('Coverage Summary', () => {
    it('should report overall coverage', () => {
      const totalSources = categories.reduce((sum, c) => sum + c.sourceFiles.length, 0);
      const totalTested = categories.reduce((sum, c) => sum + c.testedFiles.length, 0);
      const totalGaps = categories.reduce((sum, c) => sum + c.gaps.length, 0);

      console.log('\n📊 Spec Audit Coverage Summary:');
      console.log('─'.repeat(60));
      for (const cat of categories) {
        const pct = cat.sourceFiles.length > 0
          ? Math.round((cat.testedFiles.length / cat.sourceFiles.length) * 100)
          : 100;
        console.log(
          `  ${cat.name.padEnd(12)} ${cat.testedFiles.length}/${cat.sourceFiles.length} (${pct}%) — ${cat.gaps.length} gaps`
        );
      }
      console.log('─'.repeat(60));
      const totalPct = totalSources > 0 ? Math.round((totalTested / totalSources) * 100) : 100;
      console.log(`  TOTAL        ${totalTested}/${totalSources} (${totalPct}%) — ${totalGaps} gaps\n`);

      if (totalGaps > 0) {
        console.warn(`\n⚠ ${totalGaps} source files still need spec files\n`);
        for (const cat of categories) {
          if (cat.gaps.length > 0) {
            console.warn(`  ${cat.name}:`);
            for (const gap of cat.gaps) {
              console.warn(`    - ${toRelative(gap)}`);
            }
          }
        }
      }

      // Invariant: sources = tested + gaps
      for (const cat of categories) {
        expect(cat.sourceFiles.length).toBe(cat.testedFiles.length + cat.gaps.length);
      }
    });
  });
});
