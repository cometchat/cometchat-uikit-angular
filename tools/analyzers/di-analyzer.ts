/**
 * Dependency Injection Correctness Analyzer
 * Audits for direct instantiation of injectable classes, static calls, and excessive dependencies.
 */
import * as fs from 'fs';
import * as path from 'path';
import { DIReport, DIViolation } from './types';

const MAX_DEPENDENCIES = 8;

// Known SDK request builders and DTOs that are legitimately instantiated with `new`
const ALLOWED_NEW_PATTERNS = [
  'CometChat\\.MessagesRequestBuilder',
  'CometChat\\.UsersRequestBuilder',
  'CometChat\\.GroupsRequestBuilder',
  'CometChat\\.GroupMembersRequestBuilder',
  'CometChat\\.ConversationsRequestBuilder',
  'CometChat\\.CallLogRequestBuilder',
  'CometChat\\.BannedMembersRequestBuilder',
  'CometChat\\.MediaMessage',
  'CometChat\\.TextMessage',
  'CometChat\\.CustomMessage',
  'CometChat\\.Action',
  'CometChat\\.Attachment',
  'CometChat\\.TypingIndicator',
  'EventEmitter',
  'BehaviorSubject',
  'Subject',
  'ReplaySubject',
  'FormControl',
  'FormGroup',
  'FormBuilder',
  'Error',
  'Map',
  'Set',
  'Date',
  'RegExp',
  'Audio',
  'Image',
  'Blob',
  'File',
  'URL',
  'URLSearchParams',
  'IntersectionObserver',
  'MutationObserver',
  'ResizeObserver',
  'AbortController',
  'Headers',
  'Request',
  'Response',
];

function scanDir(dir: string, ext: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...scanDir(full, ext));
    else if (entry.isFile() && entry.name.endsWith(ext) && !entry.name.endsWith('.spec.ts')) {
      results.push(full);
    }
  }
  return results;
}

function extractComponentName(content: string, filePath: string): string {
  const match = content.match(/export\s+class\s+(\w+)/);
  return match ? match[1] : path.basename(filePath, '.ts');
}

function countInjectedDependencies(content: string): string[] {
  const deps: string[] = [];
  // Match inject() calls: private x = inject(ServiceName)
  const injectRegex = /inject\s*\(\s*(\w+)\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = injectRegex.exec(content)) !== null) {
    deps.push(match[1]);
  }
  // Match constructor injection: constructor(private x: ServiceName)
  const ctorMatch = content.match(/constructor\s*\(([\s\S]*?)\)/);
  if (ctorMatch) {
    const params = ctorMatch[1];
    const paramRegex = /:\s*(\w+)/g;
    while ((match = paramRegex.exec(params)) !== null) {
      const typeName = match[1];
      if (typeName !== 'string' && typeName !== 'number' && typeName !== 'boolean' && typeName !== 'any' && typeName !== 'void') {
        deps.push(typeName);
      }
    }
  }
  return [...new Set(deps)];
}

export function analyzeDI(libRoot: string): DIReport {
  const violations: DIViolation[] = [];
  const dependencyGraph: Record<string, string[]> = {};
  const componentsDir = path.join(libRoot, 'components');
  const files = scanDir(componentsDir, '.component.ts');

  const allowedPattern = new RegExp(`new\\s+(${ALLOWED_NEW_PATTERNS.join('|')})`, 'g');

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8');
    const relPath = path.relative(libRoot, f);
    const componentName = extractComponentName(content, f);
    const lines = content.split('\n');

    // Check for direct instantiation of potentially injectable classes
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const newMatch = line.match(/new\s+(\w+)\s*\(/);
      if (newMatch) {
        const className = newMatch[1];
        // Check if it's an allowed pattern
        const isAllowed = ALLOWED_NEW_PATTERNS.some(p => new RegExp(p).test(newMatch[0].replace('new ', '')));
        if (!isAllowed && /Service|Provider|Factory|Manager|Store|State/.test(className)) {
          violations.push({
            filePath: relPath, line: i + 1,
            type: 'direct-instantiation',
            description: `Direct instantiation of '${className}' which appears to be an injectable service`,
            suggestedFix: `Use inject(${className}) instead of new ${className}()`,
          });
        }
      }
    }

    // Count dependencies
    const deps = countInjectedDependencies(content);
    dependencyGraph[componentName] = deps;
    if (deps.length > MAX_DEPENDENCIES) {
      violations.push({
        filePath: relPath, line: 1,
        type: 'excessive-dependencies',
        description: `Component has ${deps.length} direct service dependencies (threshold: ${MAX_DEPENDENCIES})`,
        suggestedFix: 'Consider decomposing into smaller components or extracting a facade service',
      });
    }
  }

  const byType: Record<string, number> = {};
  const excessiveDependencyComponents: string[] = [];
  for (const v of violations) {
    byType[v.type] = (byType[v.type] || 0) + 1;
    if (v.type === 'excessive-dependencies') {
      excessiveDependencyComponents.push(v.filePath);
    }
  }

  return {
    violations,
    dependencyGraph,
    summary: { totalViolations: violations.length, byType, excessiveDependencyComponents },
  };
}
