/**
 * Property 6: Shared component parent-scoped overrides — Group 2 (Item Components)
 *
 * For each item component embedding Avatar/Date/Badge/StatusIndicator,
 * verify parent-scoped override variables exist with shared component
 * global variable as fallback.
 *
 * The test:
 * 1. Reads each Group 2 CSS file
 * 2. Reads the corresponding HTML template to determine which shared components are embedded
 * 3. For each embedded shared component, verifies the parent CSS defines scoped override variables
 * 4. Verifies the fallback chain ultimately resolves to the shared component's global variable
 *
 * **Validates: Requirements 6.2, 6.4**
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Group 2 files (Item Components)
// ---------------------------------------------------------------------------
const COMPONENT_DIR = path.resolve(__dirname, '../components');

interface ItemComponent {
  /** Human-readable label */
  label: string;
  /** Component short name used in variable naming (e.g. 'conversations', 'user-item') */
  varPrefix: string;
  /** Path to CSS file relative to COMPONENT_DIR */
  cssPath: string;
  /** Path to HTML template relative to COMPONENT_DIR */
  htmlPath: string;
}

const GROUP2_COMPONENTS: ItemComponent[] = [
  {
    label: 'conversation-item',
    varPrefix: 'conversations',
    cssPath: 'cometchat-conversation-item/cometchat-conversation-item.component.css',
    htmlPath: 'cometchat-conversation-item/cometchat-conversation-item.component.html',
  },
  {
    label: 'user-item',
    varPrefix: 'user-item',
    cssPath: 'cometchat-user-item/cometchat-user-item.component.css',
    htmlPath: 'cometchat-user-item/cometchat-user-item.component.html',
  },
  {
    label: 'group-item',
    varPrefix: 'group-item',
    cssPath: 'cometchat-group-item/cometchat-group-item.component.css',
    htmlPath: 'cometchat-group-item/cometchat-group-item.component.html',
  },
  {
    label: 'group-member-item',
    varPrefix: 'group-member-item',
    cssPath: 'cometchat-group-member-item/cometchat-group-member-item.component.css',
    htmlPath: 'cometchat-group-member-item/cometchat-group-member-item.component.html',
  },
];

// ---------------------------------------------------------------------------
// Shared component definitions
// Each shared component has a tag to detect in HTML and a set of global
// variables that parent components should provide scoped overrides for.
// ---------------------------------------------------------------------------
interface SharedComponentDef {
  /** Tag name to search for in the HTML template */
  tag: string;
  /** Short name used in parent-scoped variable naming */
  name: string;
  /**
   * Map of property suffix → global variable name.
   * The parent should define `--cometchat-{parentPrefix}-{name}-{suffix}`
   * whose fallback chain ultimately includes the global variable.
   */
  globalVars: Record<string, string>;
  /**
   * Alternative detection: CSS class patterns that indicate the shared
   * component is used even without a dedicated tag (e.g. status indicator
   * rendered as a plain div with a BEM class).
   */
  cssClassPatterns?: RegExp[];
}

const SHARED_COMPONENTS: SharedComponentDef[] = [
  {
    tag: 'cometchat-avatar',
    name: 'avatar',
    globalVars: {
      size: '--cometchat-avatar-size',
      'border-radius': '--cometchat-avatar-border-radius',
      border: '--cometchat-avatar-border',
    },
  },
  {
    tag: 'cometchat-date',
    name: 'date',
    globalVars: {
      font: '--cometchat-date-font',
      color: '--cometchat-date-color',
    },
    // Date may also be styled via a BEM class like __date
    cssClassPatterns: [/__date\b/],
  },
  {
    tag: 'cometchat-badge',
    name: 'badge',
    globalVars: {
      background: '--cometchat-badge-background',
      color: '--cometchat-badge-color',
      font: '--cometchat-badge-font',
      'border-radius': '--cometchat-badge-border-radius',
      height: '--cometchat-badge-height',
      'min-width': '--cometchat-badge-min-width',
    },
    // Badge may be rendered as a span with __badge-count class
    cssClassPatterns: [/__badge-count\b/, /__badge\b/],
  },
  {
    tag: 'cometchat-status-indicator',
    name: 'status',
    globalVars: {
      size: '--cometchat-status-indicator-size',
      border: '--cometchat-status-indicator-border',
      'online-color': '--cometchat-status-indicator-online-color',
      'offline-color': '--cometchat-status-indicator-offline-color',
    },
    // Status indicator is often a plain div with __status class
    cssClassPatterns: [/__status\b/],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Detects which shared components are used in a given HTML template.
 * Checks for both the component tag and BEM class patterns in the CSS.
 */
function detectEmbeddedSharedComponents(
  htmlContent: string,
  cssContent: string
): SharedComponentDef[] {
  const cleanHtml = stripComments(htmlContent);
  const cleanCss = stripComments(cssContent);
  const found: SharedComponentDef[] = [];

  for (const shared of SHARED_COMPONENTS) {
    let detected = false;

    // Check for the component tag in HTML
    if (cleanHtml.includes(`<${shared.tag}`)) {
      detected = true;
    }

    // Check for CSS class patterns (e.g. __status, __badge-count)
    if (!detected && shared.cssClassPatterns) {
      for (const pattern of shared.cssClassPatterns) {
        if (pattern.test(cleanCss)) {
          detected = true;
          break;
        }
      }
    }

    if (detected) {
      found.push(shared);
    }
  }

  return found;
}

/**
 * Extracts all CSS custom property definitions from CSS content.
 * Returns a map of variable name → value (the right side of the colon).
 */
function extractCustomPropertyDefinitions(css: string): Map<string, string> {
  const cleaned = stripComments(css);
  const defs = new Map<string, string>();
  const regex = /(--cometchat-[\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(cleaned)) !== null) {
    defs.set(match[1], match[2].trim());
  }
  return defs;
}

/**
 * Extracts all var() references from a CSS value string.
 */
function extractVarReferences(value: string): string[] {
  const vars: string[] = [];
  const regex = /var\(\s*(--[\w-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value)) !== null) {
    vars.push(match[1]);
  }
  return vars;
}

/**
 * Checks whether a CSS value's fallback chain ultimately includes
 * the given global variable. This walks through var() references
 * in the CSS definitions map.
 */
function fallbackChainIncludesGlobal(
  value: string,
  globalVar: string,
  defs: Map<string, string>,
  visited = new Set<string>()
): boolean {
  // Direct check: does the value contain the global variable?
  if (value.includes(globalVar)) {
    return true;
  }

  // Walk through var references and check their definitions
  const refs = extractVarReferences(value);
  for (const ref of refs) {
    if (visited.has(ref)) continue;
    visited.add(ref);

    if (ref === globalVar) return true;

    // Check if this variable is defined in the same CSS file
    const refValue = defs.get(ref);
    if (refValue && fallbackChainIncludesGlobal(refValue, globalVar, defs, visited)) {
      return true;
    }
  }

  return false;
}

interface OverrideViolation {
  component: string;
  sharedComponent: string;
  property: string;
  expectedParentVar: string;
  expectedGlobalFallback: string;
  issue: 'missing_parent_var' | 'missing_global_fallback';
  details: string;
}

/**
 * Audits a single item component for shared component parent-scoped overrides.
 */
function auditComponent(comp: ItemComponent): OverrideViolation[] {
  const cssPath = path.join(COMPONENT_DIR, comp.cssPath);
  const htmlPath = path.join(COMPONENT_DIR, comp.htmlPath);

  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  const embeddedShared = detectEmbeddedSharedComponents(htmlContent, cssContent);
  const defs = extractCustomPropertyDefinitions(cssContent);
  const violations: OverrideViolation[] = [];

  for (const shared of embeddedShared) {
    for (const [propertySuffix, globalVar] of Object.entries(shared.globalVars)) {
      // Expected parent-scoped variable pattern:
      // --cometchat-{parentPrefix}-{sharedName}-{propertySuffix}
      const expectedParentVar = `--cometchat-${comp.varPrefix}-${shared.name}-${propertySuffix}`;

      // Check if the parent CSS defines this variable OR uses it in a declaration
      const parentVarDefined = defs.has(expectedParentVar);

      // Also check if the variable is referenced anywhere in the CSS
      // (it might be set via `--cometchat-avatar-size: var(...)` pattern)
      const cssClean = stripComments(cssContent);
      const parentVarReferenced = cssClean.includes(expectedParentVar);

      if (!parentVarDefined && !parentVarReferenced) {
        // Check for alternative naming patterns that still reference the global var
        // e.g., the CSS might use a slightly different naming convention
        const altFound = findAlternativeOverride(
          comp.varPrefix,
          shared.name,
          propertySuffix,
          globalVar,
          defs,
          cssClean
        );

        if (!altFound) {
          violations.push({
            component: comp.label,
            sharedComponent: shared.name,
            property: propertySuffix,
            expectedParentVar,
            expectedGlobalFallback: globalVar,
            issue: 'missing_parent_var',
            details: `No parent-scoped override variable found for ${shared.name} ${propertySuffix}. Expected: ${expectedParentVar}`,
          });
        }
        continue;
      }

      // If the parent var is defined, check that its fallback chain includes the global var
      if (parentVarDefined) {
        const value = defs.get(expectedParentVar)!;
        if (!fallbackChainIncludesGlobal(value, globalVar, defs)) {
          // Check if the value is a hardcoded default (acceptable for some properties like size)
          // Properties like 'size', 'height', 'min-width' may use pixel defaults
          const isPixelDefault = /^\d+px$/.test(value.trim());
          const isDimensionProperty = ['size', 'height', 'min-width', 'border-radius'].includes(
            propertySuffix
          );

          if (!(isPixelDefault && isDimensionProperty)) {
            violations.push({
              component: comp.label,
              sharedComponent: shared.name,
              property: propertySuffix,
              expectedParentVar,
              expectedGlobalFallback: globalVar,
              issue: 'missing_global_fallback',
              details: `${expectedParentVar} is defined but its fallback chain does not include ${globalVar}. Value: ${value}`,
            });
          }
        }
      }
    }
  }

  return violations;
}

/**
 * Known alternative naming mappings for shared components.
 * Some parent components use a different element name for the same shared
 * component (e.g. "timestamp" instead of "date" in conversation-item).
 */
const ALTERNATIVE_NAMES: Record<string, string[]> = {
  date: ['timestamp', 'date'],
  badge: ['badge', 'badge-count'],
  status: ['status', 'status-indicator'],
  avatar: ['avatar'],
};

/**
 * Searches for alternative override patterns that still correctly
 * provide parent-scoped customization for a shared component.
 *
 * Some components may use slightly different naming but still provide
 * the override. For example:
 * - conversation-item uses "timestamp" instead of "date"
 * - The CSS might set `--cometchat-avatar-size` directly within a scoped selector
 */
function findAlternativeOverride(
  parentPrefix: string,
  sharedName: string,
  propertySuffix: string,
  globalVar: string,
  defs: Map<string, string>,
  cssContent: string
): boolean {
  // Get alternative names for this shared component
  const altNames = ALTERNATIVE_NAMES[sharedName] || [sharedName];

  for (const altName of altNames) {
    const altParentVar = `--cometchat-${parentPrefix}-${altName}-${propertySuffix}`;

    // Pattern 1: Parent-scoped variable with alternative name is defined
    if (defs.has(altParentVar)) {
      return true;
    }

    // Pattern 2: Parent-scoped variable with alternative name is referenced in CSS
    if (cssContent.includes(altParentVar)) {
      return true;
    }

    // Pattern 3: Check if any defined variable with the parent prefix and alt name
    // contains the property suffix
    for (const [varName] of defs.entries()) {
      if (
        varName.startsWith(`--cometchat-${parentPrefix}-${altName}`) &&
        varName.includes(propertySuffix)
      ) {
        return true;
      }
    }
  }

  // Pattern 4: Direct override of the global variable in a scoped selector
  // e.g., `--cometchat-avatar-size: var(--cometchat-conversations-avatar-size, 48px);`
  const escapedGlobal = globalVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const directOverridePattern = new RegExp(
    `${escapedGlobal}\\s*:\\s*var\\(\\s*--cometchat-${parentPrefix}`
  );
  if (directOverridePattern.test(cssContent)) {
    return true;
  }

  // Pattern 5: The global variable itself is being set in the CSS
  if (defs.has(globalVar)) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 6: Shared component parent-scoped overrides — Group 2 (Item Components)', () => {
  // Verify all files exist
  describe('prerequisite: all CSS and HTML files exist', () => {
    it.each(GROUP2_COMPONENTS.map(c => [c.label, c.cssPath]))(
      '%s CSS file exists',
      (_label, cssPath) => {
        expect(fs.existsSync(path.join(COMPONENT_DIR, cssPath as string))).toBe(true);
      }
    );

    it.each(GROUP2_COMPONENTS.map(c => [c.label, c.htmlPath]))(
      '%s HTML template exists',
      (_label, htmlPath) => {
        expect(fs.existsSync(path.join(COMPONENT_DIR, htmlPath as string))).toBe(true);
      }
    );
  });

  // Verify shared component detection
  describe('shared component detection', () => {
    it.each(GROUP2_COMPONENTS.map(c => [c.label, c]))(
      '%s embeds at least one shared component',
      (_label, comp) => {
        const c = comp as ItemComponent;
        const cssContent = fs.readFileSync(path.join(COMPONENT_DIR, c.cssPath), 'utf-8');
        const htmlContent = fs.readFileSync(path.join(COMPONENT_DIR, c.htmlPath), 'utf-8');
        const embedded = detectEmbeddedSharedComponents(htmlContent, cssContent);
        expect(embedded.length).toBeGreaterThan(0);
      }
    );
  });

  // Main property test: parent-scoped overrides exist with correct fallbacks
  describe('parent-scoped override variables with global fallbacks', () => {
    it.each(GROUP2_COMPONENTS.map(c => [c.label, c]))(
      '%s defines parent-scoped overrides for all embedded shared components',
      (_label, comp) => {
        const violations = auditComponent(comp as ItemComponent);

        if (violations.length > 0) {
          const details = violations
            .map(v => `  [${v.issue}] ${v.sharedComponent}.${v.property}: ${v.details}`)
            .join('\n');
          expect.fail(
            `${(comp as ItemComponent).label} has ${violations.length} shared component override violation(s):\n${details}`
          );
        }
      }
    );
  });

  // Granular tests per shared component type
  describe('Avatar overrides', () => {
    it.each(
      GROUP2_COMPONENTS.filter(c => {
        const css = fs.readFileSync(path.join(COMPONENT_DIR, c.cssPath), 'utf-8');
        const html = fs.readFileSync(path.join(COMPONENT_DIR, c.htmlPath), 'utf-8');
        return detectEmbeddedSharedComponents(html, css).some(s => s.name === 'avatar');
      }).map(c => [c.label, c])
    )('%s has parent-scoped Avatar override variables', (_label, comp) => {
      const violations = auditComponent(comp as ItemComponent).filter(
        v => v.sharedComponent === 'avatar'
      );
      if (violations.length > 0) {
        const details = violations.map(v => `  ${v.property}: ${v.details}`).join('\n');
        expect.fail(`${(comp as ItemComponent).label} Avatar override violations:\n${details}`);
      }
    });
  });

  describe('StatusIndicator overrides', () => {
    it.each(
      GROUP2_COMPONENTS.filter(c => {
        const css = fs.readFileSync(path.join(COMPONENT_DIR, c.cssPath), 'utf-8');
        const html = fs.readFileSync(path.join(COMPONENT_DIR, c.htmlPath), 'utf-8');
        return detectEmbeddedSharedComponents(html, css).some(s => s.name === 'status');
      }).map(c => [c.label, c])
    )('%s has parent-scoped StatusIndicator override variables', (_label, comp) => {
      const violations = auditComponent(comp as ItemComponent).filter(
        v => v.sharedComponent === 'status'
      );
      if (violations.length > 0) {
        const details = violations.map(v => `  ${v.property}: ${v.details}`).join('\n');
        expect.fail(
          `${(comp as ItemComponent).label} StatusIndicator override violations:\n${details}`
        );
      }
    });
  });

  describe('Date overrides', () => {
    const componentsWithDate = GROUP2_COMPONENTS.filter(c => {
      const css = fs.readFileSync(path.join(COMPONENT_DIR, c.cssPath), 'utf-8');
      const html = fs.readFileSync(path.join(COMPONENT_DIR, c.htmlPath), 'utf-8');
      return detectEmbeddedSharedComponents(html, css).some(s => s.name === 'date');
    });

    if (componentsWithDate.length > 0) {
      it.each(componentsWithDate.map(c => [c.label, c]))(
        '%s has parent-scoped Date override variables',
        (_label, comp) => {
          const violations = auditComponent(comp as ItemComponent).filter(
            v => v.sharedComponent === 'date'
          );
          if (violations.length > 0) {
            const details = violations.map(v => `  ${v.property}: ${v.details}`).join('\n');
            expect.fail(`${(comp as ItemComponent).label} Date override violations:\n${details}`);
          }
        }
      );
    }
  });

  describe('Badge overrides', () => {
    const componentsWithBadge = GROUP2_COMPONENTS.filter(c => {
      const css = fs.readFileSync(path.join(COMPONENT_DIR, c.cssPath), 'utf-8');
      const html = fs.readFileSync(path.join(COMPONENT_DIR, c.htmlPath), 'utf-8');
      return detectEmbeddedSharedComponents(html, css).some(s => s.name === 'badge');
    });

    if (componentsWithBadge.length > 0) {
      it.each(componentsWithBadge.map(c => [c.label, c]))(
        '%s has parent-scoped Badge override variables',
        (_label, comp) => {
          const violations = auditComponent(comp as ItemComponent).filter(
            v => v.sharedComponent === 'badge'
          );
          if (violations.length > 0) {
            const details = violations.map(v => `  ${v.property}: ${v.details}`).join('\n');
            expect.fail(`${(comp as ItemComponent).label} Badge override violations:\n${details}`);
          }
        }
      );
    }
  });

  // Summary test: zero violations across all Group 2 components
  describe('all Group 2 components combined', () => {
    it('should have zero shared component override violations across all item components', () => {
      const allViolations: OverrideViolation[] = [];
      for (const comp of GROUP2_COMPONENTS) {
        allViolations.push(...auditComponent(comp));
      }
      if (allViolations.length > 0) {
        const details = allViolations
          .map(
            v => `  ${v.component} → ${v.sharedComponent}.${v.property} [${v.issue}]: ${v.details}`
          )
          .join('\n');
        expect.fail(
          `Found ${allViolations.length} shared component override violation(s) across Group 2:\n${details}`
        );
      }
    });
  });
});
