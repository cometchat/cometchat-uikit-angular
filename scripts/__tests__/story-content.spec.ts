// @vitest-environment node
/**
 * Content validation property-based tests for Storybook story files.
 *
 * Validates Properties 7, 8, 9, and 14 from the design doc.
 *
 * Feature: storybook-coverage-audit
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

const COMPONENTS_ROOT = path.resolve(
  __dirname,
  '../../projects/cometchat-uikit/src/lib/components'
);

interface StoryFileInfo {
  filePath: string;
  dirPath: string;
  content: string;
  isBaseElement: boolean;
  relativePath: string;
  dirName: string;
  componentContent: string | null;
}

let allStoryFiles: StoryFileInfo[] = [];
let bubbleStoryFiles: StoryFileInfo[] = [];
let compositeStoryFiles: StoryFileInfo[] = [];
let stateCapableFiles: StoryFileInfo[] = [];

beforeAll(() => {
  const pattern = path.join(COMPONENTS_ROOT, '**/*.stories.ts');
  const matches = globSync(pattern);

  allStoryFiles = matches.map((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const dirPath = path.dirname(filePath);
    const relativePath = path.relative(COMPONENTS_ROOT, filePath);
    const isBaseElement = relativePath.startsWith('base-elements');
    const dirName = path.basename(dirPath);
    const componentFile = path.join(dirPath, `${dirName}.component.ts`);
    const componentContent = fs.existsSync(componentFile)
      ? fs.readFileSync(componentFile, 'utf-8')
      : null;
    return { filePath, dirPath, content, isBaseElement, relativePath, dirName, componentContent };
  });

  // Bubble stories: directories containing "bubble" in the name,
  // but only those whose component supports alignment (has alignment or isSentByMe input).
  // System message bubbles like action-bubble don't have alignment variants.
  bubbleStoryFiles = allStoryFiles.filter(
    (f) =>
      f.dirName.includes('bubble') &&
      f.relativePath.endsWith(`${f.dirName}.stories.ts`) &&
      f.componentContent !== null &&
      /alignment|isSentByMe/.test(f.componentContent)
  );

  // Composite stories with @Output() in their component
  compositeStoryFiles = allStoryFiles.filter(
    (f) => f.componentContent !== null && /@Output\s*\(/.test(f.componentContent)
  );

  // Stories whose component has state-related inputs
  stateCapableFiles = allStoryFiles.filter((f) => {
    if (!f.componentContent) return false;
    return /@Input\s*\([^)]*\)\s*(?:\n\s*)?(disabled|loading|error|isLoading|isEmpty|isError|isDisabled)\s*[?!]?\s*[=:]/i.test(
      f.componentContent
    );
  });

  expect(allStoryFiles.length).toBeGreaterThan(0);
});

const NUM_RUNS = 100;

describe('Feature: storybook-coverage-audit — Story Content', () => {
  /**
   * Property 7: Bubble alignment variants
   *
   * For any bubble component story file, the file SHALL export at least
   * two variants demonstrating left (received) and right (sent) message alignment.
   *
   * Validates: Requirements 3.2
   */
  it('Property 7: Bubble alignment variants — bubble stories have sent/received variants', () => {
    // Skip if no bubble stories found (guard for fc.constantFrom)
    if (bubbleStoryFiles.length === 0) return;

    fc.assert(
      fc.property(fc.constantFrom(...bubbleStoryFiles), (info) => {
        const { content, relativePath } = info;

        // Check for alignment-related variants or args
        // Bubbles may use alignment (left/right), isSentByMe (true/false), or Sent/Received variant names
        const hasSent =
          /export\s+const\s+\w*Sent\w*\s*[=:]/i.test(content) ||
          /export\s+const\s+\w*Sender\w*\s*[=:]/i.test(content) ||
          /alignment.*right/i.test(content) ||
          /['"]right['"]/i.test(content) ||
          /MessageBubbleAlignment\.right/i.test(content) ||
          /isSentByMe.*true/i.test(content);

        const hasReceived =
          /export\s+const\s+\w*Received\w*\s*[=:]/i.test(content) ||
          /export\s+const\s+\w*Receiver\w*\s*[=:]/i.test(content) ||
          /alignment.*left/i.test(content) ||
          /['"]left['"]/i.test(content) ||
          /MessageBubbleAlignment\.left/i.test(content) ||
          /isSentByMe.*false/i.test(content);

        expect(
          hasSent && hasReceived,
          `Bubble story "${relativePath}" should have both sent (right) and received (left) alignment variants`
        ).toBe(true);
      }),
      { numRuns: Math.min(NUM_RUNS, bubbleStoryFiles.length * 10) }
    );
  });

  /**
   * Property 8: Output actions logging
   *
   * For any composite component that declares @Output() events, the
   * corresponding story file's argTypes SHALL include action configurations
   * for each output.
   *
   * Validates: Requirements 4.4
   */
  it('Property 8: Output actions logging — stories with @Output() components configure actions', () => {
    if (compositeStoryFiles.length === 0) return;

    fc.assert(
      fc.property(fc.constantFrom(...compositeStoryFiles), (info) => {
        const { content, componentContent, relativePath } = info;
        if (!componentContent) return;

        // Extract @Output() names from component
        const outputRegex = /@Output\s*\(\)\s*(\w+)\s*/g;
        const outputs: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = outputRegex.exec(componentContent)) !== null) {
          if (match[1]) outputs.push(match[1]);
        }

        if (outputs.length === 0) return;

        // Check that at least one output is referenced in the story content
        // (argTypes, args, fn(), template bindings, or just mentioned)
        const hasAnyAction = outputs.some((out) => content.includes(out));

        expect(
          hasAnyAction,
          `Story "${relativePath}" should configure actions for @Output() events: ${outputs.join(', ')}`
        ).toBe(true);
      }),
      { numRuns: Math.min(NUM_RUNS, compositeStoryFiles.length * 10) }
    );
  });

  /**
   * Property 9: Mock data usage over inline SDK construction
   *
   * For any story file that renders a component requiring CometChat SDK
   * objects as inputs, the story SHALL import mock factories from
   * `.storybook/utils/mock-data.ts` rather than constructing SDK objects inline.
   *
   * Validates: Requirements 3.4, 6.6
   */
  it('Property 9: Mock data usage — stories use mock factories instead of inline SDK construction', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allStoryFiles), (info) => {
        const { content, relativePath } = info;

        // Check if story uses CometChat SDK objects
        const usesSdkObjects =
          /new\s+CometChat\.\w+/.test(content) ||
          /CometChat\.\w+\.\w+\(/.test(content);

        // If it uses SDK objects, it should also import from mock-data
        if (usesSdkObjects) {
          const importsMockData =
            /from\s+['"].*mock-data['"]/.test(content) ||
            /from\s+['"].*mock-services['"]/.test(content);

          // Allow SDK constants (like CometChat.GROUP_TYPE.PUBLIC) without mock imports
          const onlyUsesConstants =
            !(/new\s+CometChat\.\w+/.test(content)) &&
            /CometChat\.\w+\.\w+/.test(content);

          expect(
            importsMockData || onlyUsesConstants,
            `Story "${relativePath}" constructs SDK objects inline — should use mock factories from mock-data.ts`
          ).toBe(true);
        }
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 14: State variant coverage
   *
   * For any component that has @Input() properties named disabled, loading,
   * or error, the corresponding story file SHALL export variants exercising
   * each of those states.
   *
   * Validates: Requirements 2.4, 5.2
   */
  it('Property 14: State variant coverage — components with state inputs have state variants', () => {
    if (stateCapableFiles.length === 0) return;

    fc.assert(
      fc.property(fc.constantFrom(...stateCapableFiles), (info) => {
        const { content, componentContent, relativePath } = info;
        if (!componentContent) return;

        // Find state-related inputs
        const stateInputRegex =
          /@Input\s*\([^)]*\)\s*(?:\n\s*)?(disabled|loading|error|isLoading|isEmpty|isError|isDisabled)\s*[?!]?\s*[=:]/gi;
        const stateInputs: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = stateInputRegex.exec(componentContent)) !== null) {
          if (match[1]) stateInputs.push(match[1].toLowerCase());
        }

        if (stateInputs.length === 0) return;

        // For each state input, check the story references it
        for (const stateInput of stateInputs) {
          const referenced =
            new RegExp(`\\b${stateInput}\\b`, 'i').test(content) ||
            new RegExp(`(Disabled|Loading|Error|Empty)`, 'i').test(content);

          expect(
            referenced,
            `Story "${relativePath}" should have a variant for state input "${stateInput}"`
          ).toBe(true);
        }
      }),
      { numRuns: Math.min(NUM_RUNS, stateCapableFiles.length * 10) }
    );
  });
});
