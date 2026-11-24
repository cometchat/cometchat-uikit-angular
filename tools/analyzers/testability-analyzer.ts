/**
 * Testability Analyzer
 * Verifies every service, component, and utility has a corresponding .spec.ts file.
 */
import * as fs from 'fs';
import * as path from 'path';
import { TestabilityReport, TestabilityEntry } from './types';

const TYPE_ONLY_FILES = ['localization.interfaces.ts', 'index.ts', 'public-api.ts'];
const SKIP_EXTENSIONS = ['.spec.ts', '.stories.ts', '.css', '.html', '.json', '.md', '.mdx'];

function scanDir(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...scanDir(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) {
      if (!SKIP_EXTENSIONS.some(ext => entry.name.endsWith(ext)) && !TYPE_ONLY_FILES.includes(entry.name)) {
        results.push(full);
      }
    }
  }
  return results;
}

function findSpecFile(sourceFile: string): string | undefined {
  const dir = path.dirname(sourceFile);
  const base = path.basename(sourceFile, '.ts');

  // Standard: foo.component.ts -> foo.component.spec.ts
  const standardSpec = path.join(dir, `${base}.spec.ts`);
  if (fs.existsSync(standardSpec)) return standardSpec;

  // Pipe alternate: calendar-date.pipe.ts -> calendar-date-pipe.spec.ts
  if (base.includes('.pipe')) {
    const altSpec = path.join(dir, `${base.replace('.pipe', '-pipe')}.spec.ts`);
    if (fs.existsSync(altSpec)) return altSpec;
  }

  // Service alternate: foo.service.ts -> foo-service.spec.ts
  if (base.includes('.service')) {
    const altSpec = path.join(dir, `${base.replace('.service', '-service')}.spec.ts`);
    if (fs.existsSync(altSpec)) return altSpec;
  }

  // Check parent testing/ directory
  const testingDir = path.join(dir, '..', 'testing');
  if (fs.existsSync(testingDir)) {
    const testingSpec = path.join(testingDir, `${base}.spec.ts`);
    if (fs.existsSync(testingSpec)) return testingSpec;
  }

  return undefined;
}

export function analyzeTestability(libRoot: string): TestabilityReport {
  const entries: TestabilityEntry[] = [];
  const dirs = ['components', 'services', 'utils'].map(d => path.join(libRoot, d));

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = scanDir(dir);
    for (const f of files) {
      const relPath = path.relative(libRoot, f);
      const specFile = findSpecFile(f);
      const entry: TestabilityEntry = {
        sourceFile: relPath,
        hasSpecFile: !!specFile,
      };
      if (specFile) {
        entry.specFile = path.relative(libRoot, specFile);
        // Count it() blocks
        const specContent = fs.readFileSync(specFile, 'utf-8');
        const itCount = (specContent.match(/\bit\s*\(/g) || []).length;
        entry.minTestCount = itCount;
      }
      entries.push(entry);
    }
  }

  const withSpecs = entries.filter(e => e.hasSpecFile).length;
  return {
    entries,
    summary: {
      totalSources: entries.length,
      withSpecs,
      missingSpecs: entries.length - withSpecs,
    },
  };
}
