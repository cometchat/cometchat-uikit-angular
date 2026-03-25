/**
 * Pattern Consistency Analyzer
 * Scans for @Output naming violations, inline styles, hardcoded text,
 * hardcoded CSS values, and non-standalone components.
 */
import * as fs from 'fs';
import * as path from 'path';
import { PatternReport, PatternViolation } from './types';

function scanDir(dir: string, ext: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...scanDir(full, ext));
    else if (entry.isFile() && entry.name.endsWith(ext) && !entry.name.endsWith('.spec.ts') && !entry.name.endsWith('.stories.ts') && entry.name !== 'index.ts') {
      results.push(full);
    }
  }
  return results;
}

function checkOutputNaming(filePath: string, content: string, violations: PatternViolation[], relPath: string) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/@Output\(\)\s+(on[A-Z]\w*)/);
    if (match) {
      violations.push({
        filePath: relPath,
        line: i + 1,
        violationType: 'output-naming',
        description: `@Output() "${match[1]}" starts with "on" prefix`,
        suggestedFix: `Rename to "${match[1].replace(/^on/, '').charAt(0).toLowerCase() + match[1].replace(/^on/, '').slice(1)}Click" or similar action verb`,
      });
    }
  }
}

function checkInlineStyles(filePath: string, content: string, violations: PatternViolation[], relPath: string) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/\sstyle\s*=\s*"[^"]+"/i.test(lines[i]) && !lines[i].includes('[style')) {
      violations.push({
        filePath: relPath,
        line: i + 1,
        violationType: 'inline-style',
        description: 'Inline style attribute found in template',
        suggestedFix: 'Move styles to component CSS file using BEM class',
      });
    }
  }
}

function checkStandalone(filePath: string, content: string, violations: PatternViolation[], relPath: string) {
  if (!content.includes('@Component(')) return;
  // Check if standalone: true is present
  const componentMatch = content.match(/@Component\(\s*\{([^}]*)\}/s);
  if (componentMatch && !componentMatch[1].includes('standalone')) {
    violations.push({
      filePath: relPath,
      line: 1,
      violationType: 'non-standalone',
      description: 'Component missing standalone: true',
      suggestedFix: 'Add standalone: true to @Component decorator',
    });
  }
}

function checkHardcodedCssValues(filePath: string, content: string, violations: PatternViolation[], relPath: string) {
  const lines = content.split('\n');
  const colorRegex = /#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(/;
  const skipPatterns = [/\/\*/, /\/\//, /var\(/, /@media/, /@keyframes/, /from\s*{/, /to\s*{/];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (skipPatterns.some(p => p.test(line))) continue;
    if (colorRegex.test(line) && (line.includes('color') || line.includes('background') || line.includes('border'))) {
      violations.push({
        filePath: relPath,
        line: i + 1,
        violationType: 'hardcoded-css-value',
        description: `Hardcoded color value found: ${line.substring(0, 80)}`,
        suggestedFix: 'Replace with CSS variable from css-variables.css',
      });
    }
  }
}

export function analyzePatterns(libRoot: string): PatternReport {
  const violations: PatternViolation[] = [];
  const componentsDir = path.join(libRoot, 'components');

  // Check TS files for output naming and standalone
  const tsFiles = scanDir(componentsDir, '.ts');
  for (const f of tsFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    const relPath = path.relative(libRoot, f);
    checkOutputNaming(f, content, violations, relPath);
    checkStandalone(f, content, violations, relPath);
  }

  // Check HTML files for inline styles
  const htmlFiles = scanDir(componentsDir, '.html');
  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    const relPath = path.relative(libRoot, f);
    checkInlineStyles(f, content, violations, relPath);
  }

  // Check CSS files for hardcoded values
  const cssFiles = scanDir(componentsDir, '.css');
  for (const f of cssFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    const relPath = path.relative(libRoot, f);
    checkHardcodedCssValues(f, content, violations, relPath);
  }

  const byType: Record<string, number> = {};
  for (const v of violations) {
    byType[v.violationType] = (byType[v.violationType] || 0) + 1;
  }

  return {
    violations,
    summary: { totalViolations: violations.length, byType },
  };
}
