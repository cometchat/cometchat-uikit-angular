/**
 * File Size Analyzer
 * Scans UIKit source files and flags those exceeding size thresholds.
 * Produces file-size-report.json with violations and god component list.
 */
import * as fs from 'fs';
import * as path from 'path';
import { FileSizeReport, FileSizeViolation } from './types';

const THRESHOLDS: Record<string, number> = {
  'component-ts': 500,
  'template-html': 300,
  'css': 400,
  'service-ts': 400,
};

const GOD_COMPONENT_TS_THRESHOLD = 1000;

function getFileType(filePath: string): string | null {
  const base = path.basename(filePath);
  if (base.endsWith('.component.ts')) return 'component-ts';
  if (base.endsWith('.component.html')) return 'template-html';
  if (base.endsWith('.component.css') || base.endsWith('.css')) return 'css';
  if (base.endsWith('.service.ts')) return 'service-ts';
  return null;
}

function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function scanDirectory(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanDirectory(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

export function analyzeFileSizes(libRoot: string): FileSizeReport {
  const componentsDir = path.join(libRoot, 'components');
  const servicesDir = path.join(libRoot, 'services');
  const baseElementsDir = path.join(libRoot, 'components', 'base-elements');

  const allFiles = [
    ...scanDirectory(componentsDir),
    ...scanDirectory(servicesDir),
  ];

  const violations: FileSizeViolation[] = [];
  const godComponents: FileSizeViolation[] = [];
  let totalScanned = 0;
  const byType: Record<string, number> = {};

  for (const filePath of allFiles) {
    // Skip spec, story, index files
    const base = path.basename(filePath);
    if (base.endsWith('.spec.ts') || base.endsWith('.stories.ts') || base === 'index.ts') continue;

    const fileType = getFileType(filePath);
    if (!fileType) continue;

    totalScanned++;
    const lineCount = countLines(filePath);
    const threshold = THRESHOLDS[fileType];

    if (lineCount > threshold) {
      const relativePath = path.relative(libRoot, filePath);
      const violation: FileSizeViolation = {
        filePath: relativePath,
        fileType: fileType as any,
        lineCount,
        threshold,
        sections: [], // Sections would require AST parsing — kept empty for report
      };
      violations.push(violation);
      byType[fileType] = (byType[fileType] || 0) + 1;

      // God component check
      if (
        (fileType === 'component-ts' && lineCount > GOD_COMPONENT_TS_THRESHOLD) ||
        (fileType === 'template-html' && lineCount > 300)
      ) {
        godComponents.push(violation);
      }
    }
  }

  return {
    violations,
    godComponents,
    summary: {
      totalFilesScanned: totalScanned,
      totalViolations: violations.length,
      godComponentCount: godComponents.length,
      byType,
    },
  };
}
