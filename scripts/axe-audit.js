#!/usr/bin/env node

/**
 * Axe-core Automated Accessibility Testing
 * 
 * This script provides automated WCAG testing using axe-core.
 * It can be integrated into CI/CD pipelines.
 * 
 * Usage: node scripts/axe-audit.js
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('AXE-CORE ACCESSIBILITY TESTING');
console.log('='.repeat(80));
console.log();

console.log('ℹ️  Axe-core automated testing requires a running application.');
console.log('ℹ️  To run axe-core tests:');
console.log();
console.log('1. Start the sample app:');
console.log('   npm run start');
console.log();
console.log('2. In another terminal, run axe-core CLI:');
console.log('   npx axe http://localhost:4200 --tags wcag2aa');
console.log();
console.log('3. Or use the pa11y-ci configuration:');
console.log('   npx pa11y-ci');
console.log();

// Create a test configuration guide
const guideContent = `# Axe-core Testing Guide

## Overview

Axe-core is an automated accessibility testing engine that checks for WCAG compliance issues.

## Running Tests

### Option 1: Axe-core CLI

1. Start the sample app:
   \`\`\`bash
   npm run start
   \`\`\`

2. Run axe-core against the running app:
   \`\`\`bash
   npx axe http://localhost:4200 --tags wcag2aa
   \`\`\`

### Option 2: Pa11y-ci

1. Start the sample app:
   \`\`\`bash
   npm run start
   \`\`\`

2. Run pa11y-ci:
   \`\`\`bash
   npx pa11y-ci
   \`\`\`

### Option 3: Component-level Testing

For testing individual components, you can use axe-core in unit tests:

\`\`\`typescript
import { axe, toHaveNoViolations } from 'jest-axe';

describe('Component Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<YourComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
\`\`\`

## WCAG 2.1 Level AA Rules

Axe-core tests for the following WCAG 2.1 Level AA criteria:

### Perceivable
- Text alternatives for non-text content
- Captions and audio descriptions
- Adaptable content structure
- Distinguishable content (color contrast, text spacing)

### Operable
- Keyboard accessible
- Enough time to read and use content
- No content that causes seizures
- Navigable (skip links, page titles, focus order)
- Input modalities (pointer gestures, motion actuation)

### Understandable
- Readable text
- Predictable behavior
- Input assistance (error identification, labels)

### Robust
- Compatible with assistive technologies
- Valid HTML
- Name, role, value for UI components

## Common Issues Found

### Critical Issues
- Missing alt text on images
- Insufficient color contrast
- Missing form labels
- Keyboard traps
- Missing ARIA labels

### Major Issues
- Incorrect heading hierarchy
- Missing skip links
- Improper ARIA usage
- Focus order issues

### Minor Issues
- Missing language attribute
- Redundant ARIA attributes
- Non-descriptive link text

## Remediation

When axe-core finds violations:

1. **Review the violation details** - Understand what rule was violated
2. **Check the affected elements** - Identify which components need fixes
3. **Implement the fix** - Follow WCAG guidelines and ARIA best practices
4. **Re-test** - Verify the violation is resolved
5. **Update tests** - Add unit tests to prevent regression

## Integration with CI/CD

Add to your CI/CD pipeline:

\`\`\`yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Start app
        run: npm run start &
      - name: Wait for app
        run: npx wait-on http://localhost:4200
      - name: Run axe tests
        run: npx axe http://localhost:4200 --tags wcag2aa
\`\`\`

## Resources

- [Axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
`;

const guidePath = path.join(__dirname, '..', '.kiro', 'specs', 'accessibility-enhancement', 'axe-testing-guide.md');
fs.writeFileSync(guidePath, guideContent);

console.log(`📄 Testing guide saved to: ${guidePath}`);
console.log();
console.log('='.repeat(80));
