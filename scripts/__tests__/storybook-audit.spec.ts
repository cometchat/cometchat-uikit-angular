// @vitest-environment node
/**
 * Property-based tests for the Storybook Coverage Audit script.
 *
 * Uses fast-check to verify correctness properties of the audit logic.
 *
 * Feature: storybook-coverage-audit
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  type AuditResult,
  type ComponentDirInfo,
  auditComponentFromInfo,
  generateReport,
  extractInputsFromContent,
  extractStoryVariantsFromContent,
  findMissingVariantsFromContent,
} from '../storybook-audit.js';

// ============================================
// Generators
// ============================================

/** Generates a valid Angular-style identifier (camelCase, no special chars). */
const identifierArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z][a-z]{2,11}$/)
  .filter((s) => s.length >= 3);

/** Generates a component directory name like `cometchat-avatar`. */
const componentDirNameArb: fc.Arbitrary<string> = identifierArb.map(
  (name: string) => `cometchat-${name}`
);

/**
 * Generates synthetic @Input() decorator lines for a component file.
 * Returns [inputNames[], componentContent].
 */
function genComponentContent(inputNames: string[]): string {
  const lines = [
    `import { Component, Input } from '@angular/core';`,
    `@Component({ selector: 'test', template: '' })`,
    `export class TestComponent {`,
  ];
  for (const name of inputNames) {
    lines.push(`  @Input() ${name}: string = '';`);
  }
  lines.push(`}`);
  return lines.join('\n');
}

/**
 * Generates a synthetic story file content that covers specific input names.
 * coveredInputs are referenced in args blocks; uncoveredInputs are not.
 */
function genStoryContent(coveredInputs: string[], variantNames: string[] = ['Default']): string {
  const lines = [
    `import type { Meta, StoryObj } from '@storybook/angular';`,
    `const meta: Meta<any> = { title: 'Components/Test', tags: ['autodocs'] };`,
    `export default meta;`,
    `type Story = StoryObj<any>;`,
  ];
  for (const variant of variantNames) {
    const argsEntries = coveredInputs.map((inp) => `${inp}: 'value'`).join(', ');
    lines.push(`export const ${variant}: Story = { args: { ${argsEntries} } };`);
  }
  return lines.join('\n');
}

/**
 * Generates a ComponentDirInfo with no story (missing component).
 */
const missingComponentArb: fc.Arbitrary<ComponentDirInfo> = fc.record({
  dirName: componentDirNameArb,
  inputNames: fc.array(identifierArb, { minLength: 0, maxLength: 5 }),
}).map(({ dirName, inputNames }: { dirName: string; inputNames: string[] }) => ({
  dirPath: `/fake/components/${dirName}`,
  dirName,
  componentContent: genComponentContent(inputNames),
  storyContent: null,
  storyPath: null,
}));

/**
 * Generates a ComponentDirInfo with a story that covers ALL inputs (fully covered).
 */
const coveredComponentArb: fc.Arbitrary<ComponentDirInfo> = fc.record({
  dirName: componentDirNameArb,
  inputNames: fc.array(identifierArb, { minLength: 0, maxLength: 5 }),
}).map(({ dirName, inputNames }: { dirName: string; inputNames: string[] }) => ({
  dirPath: `/fake/components/${dirName}`,
  dirName,
  componentContent: genComponentContent(inputNames),
  storyContent: genStoryContent(inputNames),
  storyPath: `/fake/components/${dirName}/${dirName}.stories.ts`,
}));

/**
 * Generates a ComponentDirInfo with a story that does NOT cover some inputs (partially covered).
 * Guarantees at least 1 covered and 1 uncovered input.
 */
const partiallyCoveredComponentArb: fc.Arbitrary<{
  info: ComponentDirInfo;
  coveredInputs: string[];
  uncoveredInputs: string[];
}> = fc.record({
  dirName: componentDirNameArb,
  coveredInputs: fc.uniqueArray(identifierArb, { minLength: 1, maxLength: 4 }),
  uncoveredInputs: fc.uniqueArray(identifierArb, { minLength: 1, maxLength: 4 }),
}).filter(({ coveredInputs, uncoveredInputs }: { coveredInputs: string[]; uncoveredInputs: string[] }) => {
  // Ensure no overlap between covered and uncovered
  const coveredSet = new Set(coveredInputs);
  return uncoveredInputs.every((u: string) => !coveredSet.has(u));
}).map(({ dirName, coveredInputs, uncoveredInputs }: { dirName: string; coveredInputs: string[]; uncoveredInputs: string[] }) => {
  const allInputs = [...coveredInputs, ...uncoveredInputs];
  return {
    info: {
      dirPath: `/fake/components/${dirName}`,
      dirName,
      componentContent: genComponentContent(allInputs),
      storyContent: genStoryContent(coveredInputs),
      storyPath: `/fake/components/${dirName}/${dirName}.stories.ts`,
    },
    coveredInputs,
    uncoveredInputs,
  };
});

/** Generates any kind of ComponentDirInfo (missing, covered, or partially-covered). */
const anyComponentArb: fc.Arbitrary<ComponentDirInfo> = fc.oneof(
  missingComponentArb,
  coveredComponentArb,
  partiallyCoveredComponentArb.map(({ info }) => info)
);

// ============================================
// Property Tests
// ============================================

const VALID_STATUSES = new Set(['covered', 'partially-covered', 'missing']);
const NUM_RUNS = 100;

describe('Feature: storybook-coverage-audit', () => {
  /**
   * Property 1: Audit completeness
   *
   * For any set of component directories, the audit report SHALL contain
   * exactly one entry per component directory, and each entry SHALL have
   * a status of "covered", "partially-covered", or "missing".
   *
   * **Validates: Requirements 1.1, 1.2**
   */
  it('Property 1: Audit completeness — report contains exactly one entry per component with valid status', () => {
    fc.assert(
      fc.property(
        fc.array(anyComponentArb, { minLength: 0, maxLength: 20 }),
        (components) => {
          // Audit each component
          const results: AuditResult[] = components.map(auditComponentFromInfo);
          const report = generateReport(results);

          // Report has exactly one entry per component
          expect(report.results.length).toBe(components.length);
          expect(report.totalComponents).toBe(components.length);

          // Each entry has a valid status
          for (const result of report.results) {
            expect(VALID_STATUSES.has(result.status)).toBe(true);
          }

          // Counts add up
          expect(report.covered + report.partiallyCovered + report.missing).toBe(
            report.totalComponents
          );
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 2: Missing component detection
   *
   * For any component directory that does not have a corresponding
   * `.stories.ts` file, the audit SHALL classify that component's
   * status as "missing".
   *
   * **Validates: Requirements 1.3**
   */
  it('Property 2: Missing component detection — components without stories are classified as missing', () => {
    fc.assert(
      fc.property(missingComponentArb, (component) => {
        const result = auditComponentFromInfo(component);

        expect(result.status).toBe('missing');
        expect(result.storyExists).toBe(false);
        expect(result.storyPath).toBeNull();
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 3: Partial coverage detection
   *
   * For any component that has a `.stories.ts` file but whose story exports
   * do not cover all `@Input()` properties, the audit SHALL classify that
   * component's status as "partially-covered" and list the missing input names.
   *
   * **Validates: Requirements 1.4**
   */
  it('Property 3: Partial coverage detection — components with incomplete story coverage are partially-covered with missing inputs listed', () => {
    fc.assert(
      fc.property(partiallyCoveredComponentArb, ({ info, uncoveredInputs }) => {
        const result = auditComponentFromInfo(info);

        expect(result.status).toBe('partially-covered');
        expect(result.storyExists).toBe(true);

        // All uncovered inputs should appear in missingVariants
        for (const uncovered of uncoveredInputs) {
          expect(result.missingVariants).toContain(uncovered);
        }

        // missingVariants should not be empty
        expect(result.missingVariants.length).toBeGreaterThan(0);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
