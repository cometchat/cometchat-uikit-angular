/**
 * Property 6: Composite components expose all required template slot inputs.
 *
 * Each composite component (Conversations, MessageList, MessageComposer,
 * MessageHeader, Users, Groups, GroupMembers) must declare @Input() for:
 *   - listItemTemplate
 *   - emptyStateTemplate
 *   - errorStateTemplate
 *   - loadingStateTemplate
 *
 * Validates: Requirement 3.2
 */
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const REQUIRED_SLOTS = [
  'listItemTemplate',
  'emptyStateTemplate',
  'errorStateTemplate',
  'loadingStateTemplate',
] as const;

type RequiredSlot = (typeof REQUIRED_SLOTS)[number];

const COMPOSITE_COMPONENTS: { name: string; dir: string }[] = [
  { name: 'Conversations', dir: 'cometchat-conversations' },
  { name: 'MessageList', dir: 'cometchat-message-list' },
  { name: 'MessageComposer', dir: 'cometchat-message-composer' },
  { name: 'MessageHeader', dir: 'cometchat-message-header' },
  { name: 'Users', dir: 'cometchat-users' },
  { name: 'Groups', dir: 'cometchat-groups' },
  { name: 'GroupMembers', dir: 'cometchat-group-members' },
];

const COMPONENTS_ROOT = path.resolve(__dirname, '../');
const REPORT_PATH = path.join(
  process.cwd(),
  '.kiro/specs/angular-v5-uikit-code-review/findings-report.json'
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the set of @Input() property names declared in a TypeScript source.
 * Handles both:
 *   @Input() propName: Type
 *   @Input() propName = value
 *   @Input('alias') propName
 */
function extractInputNames(source: string): Set<string> {
  const names = new Set<string>();
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/@Input\s*\(/.test(lines[i])) {
      // Try same line
      const sameLine = lines[i].match(/@Input[^)]*\)\s+(\w+)/);
      if (sameLine) {
        names.add(sameLine[1]);
        continue;
      }
      // Try next non-empty line
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const nextLine = lines[j].match(/^\s*(\w+)\s*[=:?!]/);
        if (nextLine) {
          names.add(nextLine[1]);
          break;
        }
      }
    }
  }
  return names;
}

// ---------------------------------------------------------------------------
// Finding writer
// ---------------------------------------------------------------------------

function appendFinding(finding: object): void {
  try {
    const raw = fs.readFileSync(REPORT_PATH, 'utf-8');
    const report = JSON.parse(raw);
    report.findings.push(finding);
    report.totalFindings = report.findings.length;
    const f = finding as any;
    report.bySeverity[f.severity] = (report.bySeverity[f.severity] ?? 0) + 1;
    report.byArea[f.area] = (report.byArea[f.area] ?? 0) + 1;
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  } catch {
    // Non-fatal
  }
}

function nextFindingId(prefix: string): string {
  try {
    const raw = fs.readFileSync(REPORT_PATH, 'utf-8');
    const report = JSON.parse(raw);
    const existing = report.findings
      .map((f: any) => f.id)
      .filter((id: string) => id.startsWith(prefix))
      .map((id: string) => parseInt(id.replace(prefix + '-', ''), 10))
      .filter((n: number) => !isNaN(n));
    const max = existing.length > 0 ? Math.max(...existing) : 0;
    return `${prefix}-${String(max + 1).padStart(4, '0')}`;
  } catch {
    return `${prefix}-0001`;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 6 — Composite components expose required template slot inputs', () => {
  interface SlotViolation {
    component: string;
    file: string;
    missingSlots: RequiredSlot[];
  }

  const violations: SlotViolation[] = [];

  for (const comp of COMPOSITE_COMPONENTS) {
    const compDir = path.join(COMPONENTS_ROOT, comp.dir);
    const tsFile = path.join(compDir, `${comp.dir}.component.ts`);

    if (!fs.existsSync(tsFile)) {
      violations.push({
        component: comp.name,
        file: tsFile,
        missingSlots: [...REQUIRED_SLOTS],
      });
      continue;
    }

    const source = fs.readFileSync(tsFile, 'utf-8');
    const declaredInputs = extractInputNames(source);
    const missing = REQUIRED_SLOTS.filter((slot) => !declaredInputs.has(slot));

    if (missing.length > 0) {
      violations.push({
        component: comp.name,
        file: tsFile,
        missingSlots: missing as RequiredSlot[],
      });
    }
  }

  it('should find no composite components missing required template slot inputs', () => {
    if (violations.length > 0) {
      for (const v of violations) {
        const relPath = path.relative(process.cwd(), v.file);
        for (const slot of v.missingSlots) {
          appendFinding({
            id: nextFindingId('F-PROP'),
            severity: 'Major',
            requirement: '3.2',
            area: 'dx',
            file: relPath,
            line: null,
            description: `Composite component "${v.component}" is missing required @Input() template slot: "${slot}". Consumers cannot customise this view without this input.`,
            suggestedFix: `Add \`@Input() ${slot}: TemplateRef<any> | null = null;\` to the component class and render it in the template using \`<ng-container *ngTemplateOutlet="${slot}"\`>.`,
            status: 'Open',
            fixStrategy: 'Inline',
          });
        }
      }
    }

    expect(violations).toHaveLength(0);
  });

  it('should check all 7 composite components', () => {
    expect(COMPOSITE_COMPONENTS).toHaveLength(7);
  });
});
