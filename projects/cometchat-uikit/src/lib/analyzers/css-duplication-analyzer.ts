/**
 * CSS Duplication Analyzer
 * Scans component CSS files for identical style blocks appearing in multiple files.
 */
import * as fs from 'fs';
import * as path from 'path';
import { CSSReport, CSSDuplicationCluster } from './types';

function scanDir(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...scanDir(full));
    else if (entry.isFile() && entry.name.endsWith('.css') && !entry.name.includes('.spec')) {
      results.push(full);
    }
  }
  return results;
}

function extractRuleBlocks(content: string): string[] {
  // Simple CSS rule block extraction (selector { ... })
  const blocks: string[] = [];
  const regex = /([^{}]+)\{([^{}]+)\}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const declarations = match[2].trim();
    if (declarations.length > 20) { // Only meaningful blocks
      blocks.push(declarations.replace(/\s+/g, ' ').trim());
    }
  }
  return blocks;
}

export function analyzeCssDuplication(libRoot: string): CSSReport {
  const componentsDir = path.join(libRoot, 'components');
  const files = scanDir(componentsDir);

  // Map: normalized declaration block → list of files containing it
  const blockMap = new Map<string, Set<string>>();

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8');
    const relPath = path.relative(libRoot, f);
    const blocks = extractRuleBlocks(content);

    for (const block of blocks) {
      if (!blockMap.has(block)) blockMap.set(block, new Set());
      blockMap.get(block)!.add(relPath);
    }
  }

  const clusters: CSSDuplicationCluster[] = [];
  for (const [block, fileSet] of blockMap) {
    if (fileSet.size > 2) {
      clusters.push({
        pattern: block.substring(0, 200),
        category: 'identical-block',
        files: Array.from(fileSet),
        suggestedConsolidation: 'Extract to shared stylesheet in styles/',
      });
    }
  }

  // Sort by number of files (most duplicated first)
  clusters.sort((a, b) => b.files.length - a.files.length);

  const byCategory: Record<string, number> = {};
  for (const c of clusters) {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  }

  return {
    clusters,
    summary: { totalClusters: clusters.length, byCategory },
  };
}
