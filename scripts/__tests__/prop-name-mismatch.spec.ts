// @vitest-environment node
/**
 * Bug condition exploration property-based test for prop name mismatches.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 *
 * Property 1: Fault Condition — MDX Event Bindings Use Incorrect `on` Prefix
 *
 * For any event binding `(eventName)` in a docs `.mdx` code example where the
 * referenced component has an `@Output()` declaration, the binding name SHALL
 * exactly match the `@Output()` property name (without `on` prefix).
 *
 * Bug condition: A binding uses `(onXxx)` where component has `@Output() xxx`
 * but NOT `@Output() onXxx`.
 *
 * This test is EXPECTED TO FAIL on unfixed code — failure confirms the bug exists.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

// ============================================
// Constants
// ============================================

const REPO_ROOT = path.resolve(__dirname, '../..');
const COMPONENTS_ROOT = path.join(
  REPO_ROOT,
  'projects/cometchat-uikit/src/lib/components'
);

/** Directories containing .mdx files to scan */
const MDX_DIRS = [
  path.join(REPO_ROOT, 'docs/components'),
  path.join(REPO_ROOT, 'docs/customization'),
  path.join(REPO_ROOT, 'projects/cometchat-uikit/src/lib/stories'),
];

// ============================================
// Types
// ============================================

interface EventBinding {
  /** The MDX file where this binding was found */
  mdxFile: string;
  /** Relative path for display */
  mdxRelative: string;
  /** The event binding name (left side of =), e.g. "onItemClick" */
  bindingName: string;
  /** The component tag where this binding appears, e.g. "cometchat-conversations" */
  componentTag: string;
  /** Line number in the MDX file */
  line: number;
}

interface ComponentOutputs {
  /** All @Output() property names */
  outputs: Set<string>;
  /** All @Input() property names with on-prefix (callback inputs) */
  onPrefixedInputs: Set<string>;
}

// ============================================
// Discovery: Parse MDX files and component sources
// ============================================

let allEventBindings: EventBinding[] = [];
let componentOutputsMap: Map<string, ComponentOutputs> = new Map();

/**
 * Parse a component .ts file to extract @Output() and @Input() on-prefixed names.
 */
function parseComponentOutputs(componentFilePath: string): ComponentOutputs {
  const content = fs.readFileSync(componentFilePath, 'utf-8');
  const outputs = new Set<string>();
  const onPrefixedInputs = new Set<string>();

  // Match @Output() propertyName
  const outputRegex = /@Output\(\)\s+(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = outputRegex.exec(content)) !== null) {
    outputs.add(match[1]);
  }

  // Match @Input() onXxx callback properties (on-prefixed inputs)
  const inputRegex = /@Input\(\)\s+(on[A-Z]\w*)/g;
  while ((match = inputRegex.exec(content)) !== null) {
    onPrefixedInputs.add(match[1]);
  }

  return { outputs, onPrefixedInputs };
}

/**
 * Find the component source file for a given tag name.
 * e.g. "cometchat-conversations" -> .../cometchat-conversations/cometchat-conversations.component.ts
 */
function resolveComponentFile(tag: string): string | null {
  const componentFile = path.join(
    COMPONENTS_ROOT,
    tag,
    `${tag}.component.ts`
  );
  if (fs.existsSync(componentFile)) {
    return componentFile;
  }
  // Also check under base-elements/
  const baseElementFile = path.join(
    COMPONENTS_ROOT,
    'base-elements',
    tag,
    `${tag}.component.ts`
  );
  if (fs.existsSync(baseElementFile)) {
    return baseElementFile;
  }
  return null;
}

/**
 * Extract event bindings with on-prefix from code blocks in an MDX file.
 *
 * We look for patterns like `(onXxx)="..."` inside code fences.
 * We also resolve the nearest `<cometchat-xxx` tag to identify the component.
 */
function extractOnPrefixedEventBindings(mdxFilePath: string): EventBinding[] {
  const content = fs.readFileSync(mdxFilePath, 'utf-8');
  const lines = content.split('\n');
  const mdxRelative = path.relative(REPO_ROOT, mdxFilePath);
  const bindings: EventBinding[] = [];

  let inCodeBlock = false;
  // Track the most recent cometchat tag seen in the current code block
  let currentComponentTag: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect code fence boundaries
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        // Exiting code block
        inCodeBlock = false;
        currentComponentTag = null;
      } else {
        // Entering code block
        inCodeBlock = true;
        currentComponentTag = null;
      }
      continue;
    }

    if (!inCodeBlock) continue;

    // Track the most recent <cometchat-xxx tag
    const tagMatch = line.match(/<(cometchat-[\w-]+)/);
    if (tagMatch) {
      currentComponentTag = tagMatch[1];
    }

    // Find (onXxx)="..." event bindings on the LEFT side of =
    const bindingRegex = /\((on[A-Z][a-zA-Z]*)\)\s*=/g;
    let bindingMatch: RegExpExecArray | null;
    while ((bindingMatch = bindingRegex.exec(line)) !== null) {
      if (currentComponentTag) {
        bindings.push({
          mdxFile: mdxFilePath,
          mdxRelative,
          bindingName: bindingMatch[1],
          componentTag: currentComponentTag,
          line: i + 1,
        });
      }
    }
  }

  return bindings;
}

// ============================================
// Setup: discover all bindings and component outputs
// ============================================

beforeAll(() => {
  // 1. Discover all .mdx files
  const mdxFiles: string[] = [];
  for (const dir of MDX_DIRS) {
    if (fs.existsSync(dir)) {
      const files = globSync(path.join(dir, '**/*.mdx'));
      mdxFiles.push(...files);
    }
  }

  // 2. Extract all on-prefixed event bindings from MDX files
  for (const mdxFile of mdxFiles) {
    const bindings = extractOnPrefixedEventBindings(mdxFile);
    allEventBindings.push(...bindings);
  }

  // 3. Build component outputs map
  const uniqueTags = new Set(allEventBindings.map((b) => b.componentTag));
  for (const tag of uniqueTags) {
    const componentFile = resolveComponentFile(tag);
    if (componentFile) {
      componentOutputsMap.set(tag, parseComponentOutputs(componentFile));
    }
  }
});

// ============================================
// Helpers
// ============================================

/**
 * Check if a binding is a bug condition per the design doc:
 * - binding uses (onXxx) where component has @Output() xxx but NOT @Output() onXxx
 * - AND the binding name is NOT an @Input() callback property
 */
function isBugCondition(binding: EventBinding): boolean {
  const componentInfo = componentOutputsMap.get(binding.componentTag);
  if (!componentInfo) return false;

  const bindingName = binding.bindingName; // e.g. "onItemClick"

  // If this is an @Input() callback property, it's NOT a bug
  if (componentInfo.onPrefixedInputs.has(bindingName)) return false;

  // Derive expected output name: remove "on" prefix and lowercase first char
  const withoutOn = bindingName.slice(2); // "ItemClick"
  const expectedName = withoutOn.charAt(0).toLowerCase() + withoutOn.slice(1); // "itemClick"

  // Bug condition: component has @Output() with the non-prefixed name
  // AND does NOT have an @Output() with the on-prefixed name
  return (
    componentInfo.outputs.has(expectedName) &&
    !componentInfo.outputs.has(bindingName)
  );
}

/** Arbitrary that picks from discovered event bindings */
function eventBindingArb(): fc.Arbitrary<EventBinding> {
  return fc.constantFrom(...allEventBindings);
}

// ============================================
// Property-Based Tests
// ============================================

describe('Feature: prop-name-mismatch-fix — Bug Condition Exploration', () => {
  /**
   * Property 1: Fault Condition — Event Bindings Match @Output() Names
   *
   * For any event binding `(eventName)` in a docs `.mdx` code example where
   * the referenced component has an `@Output()` declaration, the binding name
   * SHALL exactly match the `@Output()` property name.
   *
   * This test asserts that NO bug conditions exist. On unfixed code, this will
   * FAIL, surfacing counterexamples that demonstrate the bug.
   *
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
   */
  it('Property 1: all on-prefixed event bindings in MDX files should match actual @Output() names (no bug conditions)', () => {
    // If no on-prefixed event bindings remain, the bug is fully fixed — pass immediately
    if (allEventBindings.length === 0) {
      expect(allEventBindings).toHaveLength(0);
      return;
    }

    fc.assert(
      fc.property(eventBindingArb(), (binding) => {
        const componentInfo = componentOutputsMap.get(binding.componentTag);

        // Skip bindings for components we can't resolve
        if (!componentInfo) return true;

        // Skip @Input() callback properties — these are legitimate on-prefixed names
        if (componentInfo.onPrefixedInputs.has(binding.bindingName)) return true;

        // The binding should NOT be a bug condition
        const buggy = isBugCondition(binding);
        if (buggy) {
          const withoutOn = binding.bindingName.slice(2);
          const expectedName =
            withoutOn.charAt(0).toLowerCase() + withoutOn.slice(1);
          // Provide a descriptive error message as the counterexample
          expect(buggy).toBe(
            false,
            `Bug condition found: (${binding.bindingName}) in ${binding.mdxRelative}:${binding.line} ` +
              `on <${binding.componentTag}> should be (${expectedName}) — ` +
              `component has @Output() ${expectedName} but NOT @Output() ${binding.bindingName}`
          );
        }

        return !buggy;
      }),
      { numRuns: Math.min(allEventBindings.length * 3, 500) }
    );
  });

  /**
   * Supplementary deterministic test: enumerate ALL bug conditions found.
   * This provides a complete list of counterexamples for documentation.
   */
  it('should have zero bug conditions across all MDX event bindings (deterministic check)', () => {
    const bugConditions = allEventBindings.filter(isBugCondition);

    if (bugConditions.length > 0) {
      const summary = bugConditions.map((b) => {
        const withoutOn = b.bindingName.slice(2);
        const expectedName =
          withoutOn.charAt(0).toLowerCase() + withoutOn.slice(1);
        return `  (${b.bindingName}) → (${expectedName}) in ${b.mdxRelative}:${b.line} on <${b.componentTag}>`;
      });

      expect(bugConditions).toHaveLength(
        0,
        `Found ${bugConditions.length} bug conditions:\n${summary.join('\n')}`
      );
    }

    expect(bugConditions).toHaveLength(0);
  });
});
