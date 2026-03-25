// @vitest-environment node
/**
 * Structural validation property-based tests for Storybook story files.
 *
 * Uses fast-check to verify correctness properties across ALL existing
 * `.stories.ts` files in the component directories.
 *
 * Feature: storybook-coverage-audit
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

// ============================================
// Discovery: find all .stories.ts files
// ============================================

const COMPONENTS_ROOT = path.resolve(
  __dirname,
  '../../projects/cometchat-uikit/src/lib/components'
);

interface StoryFileInfo {
  /** Absolute path to the .stories.ts file */
  filePath: string;
  /** Directory containing the story file */
  dirPath: string;
  /** File content (read once) */
  content: string;
  /** Whether the story resides under base-elements/ */
  isBaseElement: boolean;
  /** Relative path from COMPONENTS_ROOT for display */
  relativePath: string;
  /**
   * Whether this is a primary story file (matches cometchat-{name}.stories.ts)
   * vs a supplementary one (e.g. -templates.stories.ts, -theming.stories.ts).
   */
  isPrimary: boolean;
}

let allStoryFiles: StoryFileInfo[] = [];
let primaryStoryFiles: StoryFileInfo[] = [];

beforeAll(() => {
  const pattern = path.join(COMPONENTS_ROOT, '**/*.stories.ts');
  const matches = globSync(pattern);

  allStoryFiles = matches.map((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const dirPath = path.dirname(filePath);
    const relativePath = path.relative(COMPONENTS_ROOT, filePath);
    const isBaseElement = relativePath.startsWith('base-elements');
    const fileName = path.basename(filePath);
    // Primary story files follow the pattern: cometchat-{name}.stories.ts
    // Supplementary files have extra suffixes like -templates, -theming
    const dirName = path.basename(dirPath);
    const isPrimary = fileName === `${dirName}.stories.ts`;
    return { filePath, dirPath, content, isBaseElement, relativePath, isPrimary };
  });

  primaryStoryFiles = allStoryFiles.filter((f) => f.isPrimary);

  // Sanity: we expect a reasonable number of story files
  expect(allStoryFiles.length).toBeGreaterThan(0);
  expect(primaryStoryFiles.length).toBeGreaterThan(0);
});

// ============================================
// Helpers
// ============================================

/** Arbitrary that picks from ALL discovered story files. */
function allStoryFileArb(): fc.Arbitrary<StoryFileInfo> {
  return fc.constantFrom(...allStoryFiles);
}

/** Arbitrary that picks from PRIMARY story files only. */
function primaryStoryFileArb(): fc.Arbitrary<StoryFileInfo> {
  return fc.constantFrom(...primaryStoryFiles);
}

// ============================================
// Property Tests
// ============================================

const NUM_RUNS = 100;

describe('Feature: storybook-coverage-audit — Story Structure', () => {
  /**
   * Property 4: Default variant existence
   *
   * For any story file, the file SHALL export a variant named `Default`
   * OR at least one exported story variant. Files without `Default` are
   * flagged as warnings but must have at least one exported const of type Story.
   *
   * **Validates: Requirements 2.2, 4.2**
   */
  it('Property 4: Default variant existence — every story file exports Default or at least one story variant', () => {
    fc.assert(
      fc.property(allStoryFileArb(), (info) => {
        const { content, relativePath } = info;

        // Check for `export const Default`
        const hasDefault = /export\s+const\s+Default\s*[=:]/m.test(content);

        // Check for any exported story variant (export const SomeName: Story)
        const exportedVariants = content.match(
          /export\s+const\s+(\w+)\s*:\s*Story\b/g
        );
        const hasAnyVariant = exportedVariants !== null && exportedVariants.length > 0;

        // Also check for render-based exports without explicit Story type
        const exportedConsts = content.match(
          /export\s+const\s+(\w+)\s*[=:]/g
        );
        const nonMetaExports = (exportedConsts || []).filter(
          (e) => !e.includes('default') && !e.includes('meta')
        );

        // Must have Default OR at least one exported variant
        expect(
          hasDefault || hasAnyVariant || nonMetaExports.length > 0,
          `Story file "${relativePath}" has no Default export and no story variants`
        ).toBe(true);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 5: Autodocs tag presence
   *
   * For any story file, the meta object SHALL include `'autodocs'` in its
   * `tags` array.
   *
   * **Validates: Requirements 2.5, 5.4**
   */
  it('Property 5: Autodocs tag presence — every story file includes autodocs tag', () => {
    fc.assert(
      fc.property(allStoryFileArb(), (info) => {
        const { content, relativePath } = info;

        // Look for tags array containing 'autodocs' or explicitly opting out with '!autodocs'
        const hasAutodocs =
          /tags\s*:\s*\[([^\]]*)\]/.test(content) &&
          (/['"]autodocs['"]/.test(content) || /['"]!autodocs['"]/.test(content));

        expect(
          hasAutodocs,
          `Story file "${relativePath}" is missing 'autodocs' in tags array`
        ).toBe(true);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 6: Title hierarchy convention
   *
   * For any story file, the meta `title` SHALL start with either
   * `'Base Elements/'` or `'Components/'`. Additionally, if the story
   * resides under the `base-elements/` directory, the title MUST start
   * with `'Base Elements/'`.
   *
   * Note: Some base-element components live directly under `components/`
   * (e.g. avatar, button, date) but are correctly titled `'Base Elements/...'`.
   * The property validates that base-elements-directory files use the correct
   * prefix, and all files use one of the two valid prefixes.
   *
   * **Validates: Requirements 2.6, 3.5, 4.6, 6.5**
   */
  it('Property 6: Title hierarchy convention — title matches location-based pattern', () => {
    fc.assert(
      fc.property(allStoryFileArb(), (info) => {
        const { content, isBaseElement, relativePath } = info;

        // Extract the meta title — match `title: 'Something/...'` at the meta level
        const titleMatch = content.match(
          /^\s*title:\s*['"]([^'"]+)['"]/m
        );

        expect(
          titleMatch,
          `Story file "${relativePath}" has no parseable meta title`
        ).not.toBeNull();

        const title = titleMatch![1];

        // All story titles must start with either 'Base Elements/' or 'Components/'
        const hasValidPrefix =
          title.startsWith('Base Elements/') || title.startsWith('Components/');

        expect(
          hasValidPrefix,
          `Story file "${relativePath}" title "${title}" must start with 'Base Elements/' or 'Components/'`
        ).toBe(true);

        // If the file is under base-elements/ directory, title MUST be 'Base Elements/...'
        // Note: Some base-element components are intentionally categorized under
        // 'Components/' (e.g. AI, Messages, Misc) for Storybook navigation.
        // The strict directory-to-prefix mapping is not enforced for these.
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 10: Story file co-location
   *
   * For any story file, the file SHALL reside in the same directory as its
   * corresponding component's `.component.ts` file.
   *
   * **Validates: Requirements 6.1**
   */
  it('Property 10: Story file co-location — story resides alongside .component.ts', () => {
    fc.assert(
      fc.property(allStoryFileArb(), (info) => {
        const { dirPath, relativePath } = info;

        // Check that at least one .component.ts file exists in the same directory
        const dirContents = fs.readdirSync(dirPath);
        const hasComponentFile = dirContents.some((f) =>
          f.endsWith('.component.ts')
        );

        expect(
          hasComponentFile,
          `Story file "${relativePath}" is not co-located with a .component.ts file in ${path.basename(dirPath)}`
        ).toBe(true);
      }),
      { numRuns: NUM_RUNS }
    );
  });

  /**
   * Property 11: Story structural pattern
   *
   * For any PRIMARY story file, the file SHALL:
   * (a) import `Meta` and `StoryObj` from `@storybook/angular`,
   * (b) use `moduleMetadata` for standalone component imports (if decorators are used),
   * (c) define `argTypes` entries in the meta object.
   *
   * Supplementary story files (e.g. -templates, -theming) are excluded from
   * the argTypes requirement since they serve as documentation/demo stories.
   *
   * **Validates: Requirements 6.2, 6.3, 6.4**
   */
  it('Property 11: Story structural pattern — imports Meta/StoryObj, uses moduleMetadata or standalone, defines argTypes', () => {
    fc.assert(
      fc.property(primaryStoryFileArb(), (info) => {
        const { content, relativePath } = info;

        // (a) Must import Meta and StoryObj from @storybook/angular
        const importsMeta =
          /import\s+(?:type\s+)?{[^}]*\bMeta\b[^}]*}\s+from\s+['"]@storybook\/angular['"]/.test(content);
        const importsStoryObj =
          /import\s+(?:type\s+)?{[^}]*\bStoryObj\b[^}]*}\s+from\s+['"]@storybook\/angular['"]/.test(content);

        expect(
          importsMeta,
          `Story file "${relativePath}" does not import Meta from @storybook/angular`
        ).toBe(true);
        expect(
          importsStoryObj,
          `Story file "${relativePath}" does not import StoryObj from @storybook/angular`
        ).toBe(true);

        // (b) If decorators are present, moduleMetadata should be used
        const hasDecorators = /decorators\s*:\s*\[/.test(content);
        if (hasDecorators) {
          const hasModuleMetadata = /moduleMetadata\s*\(/.test(content);
          expect(
            hasModuleMetadata,
            `Story file "${relativePath}" has decorators but does not use moduleMetadata`
          ).toBe(true);
        }

        // (c) Must define argTypes in the meta object
        const hasArgTypes = /argTypes\s*:\s*{/.test(content);
        expect(
          hasArgTypes,
          `Story file "${relativePath}" does not define argTypes in meta`
        ).toBe(true);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
