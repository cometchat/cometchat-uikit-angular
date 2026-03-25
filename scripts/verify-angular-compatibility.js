#!/usr/bin/env node

/**
 * Angular Version Compatibility Verification Script
 * 
 * This script verifies that the UIKit components don't use Angular version-specific
 * APIs that would break compatibility with Angular 14-21.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Patterns to check for version-specific APIs
const versionSpecificPatterns = [
  {
    pattern: /\binject\s*\(/g,
    name: 'inject() function',
    since: 'Angular 14',
    severity: 'error',
    description: 'Use constructor injection instead',
  },
  {
    pattern: /standalone\s*:\s*true/g,
    name: 'Standalone components',
    since: 'Angular 14',
    severity: 'warning',
    description: 'Consider using traditional NgModule approach for compatibility',
  },
  {
    pattern: /required\s*:\s*true/g,
    name: 'Required inputs',
    since: 'Angular 16',
    severity: 'warning',
    description: 'Use optional inputs with defaults instead',
  },
  {
    pattern: /\bsignal\s*\(/g,
    name: 'Signals',
    since: 'Angular 16',
    severity: 'error',
    description: 'Use traditional change detection instead',
  },
  {
    pattern: /\bcomputed\s*\(/g,
    name: 'Computed signals',
    since: 'Angular 16',
    severity: 'error',
    description: 'Use traditional change detection instead',
  },
  {
    pattern: /\beffect\s*\(/g,
    name: 'Effects',
    since: 'Angular 16',
    severity: 'error',
    description: 'Use lifecycle hooks instead',
  },
  {
    pattern: /@if\s*\(/g,
    name: 'New control flow @if',
    since: 'Angular 17',
    severity: 'error',
    description: 'Use *ngIf instead',
  },
  {
    pattern: /@for\s*\(/g,
    name: 'New control flow @for',
    since: 'Angular 17',
    severity: 'error',
    description: 'Use *ngFor instead',
  },
  {
    pattern: /@switch\s*\(/g,
    name: 'New control flow @switch',
    since: 'Angular 17',
    severity: 'error',
    description: 'Use *ngSwitch instead',
  },
  {
    pattern: /\binput\s*\(/g,
    name: 'input() function',
    since: 'Angular 17',
    severity: 'error',
    description: 'Use @Input() decorator instead',
  },
  {
    pattern: /\boutput\s*\(/g,
    name: 'output() function',
    since: 'Angular 17',
    severity: 'error',
    description: 'Use @Output() decorator instead',
  },
];

// Directories to scan
const componentsDir = path.join(__dirname, '..', 'projects', '@cometchat/chat-uikit-angular', 'src', 'lib', 'components');

// Results tracking
const results = {
  filesScanned: 0,
  errors: [],
  warnings: [],
  passed: true,
};

/**
 * Recursively get all TypeScript and HTML files
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Check a file for version-specific patterns
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  const issues = [];

  versionSpecificPatterns.forEach((check) => {
    const matches = content.match(check.pattern);
    if (matches) {
      matches.forEach((match) => {
        // Get line number
        const lines = content.substring(0, content.indexOf(match)).split('\n');
        const lineNumber = lines.length;

        const issue = {
          file: relativePath,
          line: lineNumber,
          pattern: check.name,
          match: match.trim(),
          since: check.since,
          severity: check.severity,
          description: check.description,
        };

        if (check.severity === 'error') {
          results.errors.push(issue);
          results.passed = false;
        } else {
          results.warnings.push(issue);
        }

        issues.push(issue);
      });
    }
  });

  return issues;
}

/**
 * Print results
 */
function printResults() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Angular Version Compatibility Check${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`Files scanned: ${results.filesScanned}`);
  console.log(`Errors found: ${colors.red}${results.errors.length}${colors.reset}`);
  console.log(`Warnings found: ${colors.yellow}${results.warnings.length}${colors.reset}\n`);

  if (results.errors.length > 0) {
    console.log(`${colors.red}❌ ERRORS (Breaking Compatibility):${colors.reset}\n`);
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${colors.red}${error.pattern}${colors.reset} (${error.since})`);
      console.log(`   File: ${error.file}:${error.line}`);
      console.log(`   Match: ${error.match}`);
      console.log(`   Fix: ${error.description}\n`);
    });
  }

  if (results.warnings.length > 0) {
    console.log(`${colors.yellow}⚠️  WARNINGS (Potential Compatibility Issues):${colors.reset}\n`);
    results.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${colors.yellow}${warning.pattern}${colors.reset} (${warning.since})`);
      console.log(`   File: ${warning.file}:${warning.line}`);
      console.log(`   Match: ${warning.match}`);
      console.log(`   Recommendation: ${warning.description}\n`);
    });
  }

  if (results.passed && results.warnings.length === 0) {
    console.log(`${colors.green}✅ All checks passed! No version-specific APIs detected.${colors.reset}`);
    console.log(`${colors.green}   The UIKit is compatible with Angular 14-21.${colors.reset}\n`);
  } else if (results.passed) {
    console.log(`${colors.yellow}⚠️  Checks passed with warnings.${colors.reset}`);
    console.log(`${colors.yellow}   Review warnings for potential compatibility improvements.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}❌ Compatibility check failed!${colors.reset}`);
    console.log(`${colors.red}   Fix errors to ensure Angular 14-21 compatibility.${colors.reset}\n`);
  }

  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.blue}Starting Angular version compatibility check...${colors.reset}\n`);

  if (!fs.existsSync(componentsDir)) {
    console.error(`${colors.red}Error: Components directory not found: ${componentsDir}${colors.reset}`);
    process.exit(1);
  }

  const files = getAllFiles(componentsDir);
  results.filesScanned = files.length;

  console.log(`Scanning ${files.length} files...\n`);

  files.forEach((file) => {
    checkFile(file);
  });

  printResults();

  // Exit with error code if compatibility issues found
  process.exit(results.passed ? 0 : 1);
}

// Run the script
main();
