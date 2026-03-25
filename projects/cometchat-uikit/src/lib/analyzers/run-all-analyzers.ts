/**
 * Master Analysis Runner
 * Executes all analyzers and writes JSON reports to the reports directory.
 * Usage: npx ts-node projects/cometchat-uikit/src/lib/analyzers/run-all-analyzers.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { analyzeFileSizes } from './file-size-analyzer';
import { analyzePatterns } from './pattern-analyzer';
import { analyzeSubscriptions } from './subscription-analyzer';
import { analyzeChangeDetection } from './change-detection-analyzer';
import { analyzeErrorHandling } from './error-handling-analyzer';
import { analyzeCssDuplication } from './css-duplication-analyzer';
import { analyzeEventSystem } from './event-system-analyzer';
import { analyzeDI } from './di-analyzer';
import { analyzeTestability } from './testability-analyzer';

const LIB_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.resolve(__dirname, '../../../../../.kiro/specs/code-review-refactoring/reports');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeReport(name: string, data: any) {
  ensureDir(REPORTS_DIR);
  const filePath = path.join(REPORTS_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ ${name}.json written (${JSON.stringify(data.summary || {})}) `);
}

export function runAllAnalyzers() {
  console.log('🔍 Running all analyzers on:', LIB_ROOT);
  console.log('📁 Reports directory:', REPORTS_DIR);
  console.log('');

  // 1. File Size Analysis
  const fileSizeReport = analyzeFileSizes(LIB_ROOT);
  writeReport('file-size-report', fileSizeReport);

  // 2. Pattern Consistency Analysis
  const patternReport = analyzePatterns(LIB_ROOT);
  writeReport('pattern-violations-report', patternReport);

  // 3. Subscription/Leak Analysis
  const leakReport = analyzeSubscriptions(LIB_ROOT);
  writeReport('subscription-leak-report', leakReport);

  // 4. Change Detection Analysis
  const cdReport = analyzeChangeDetection(LIB_ROOT);
  writeReport('change-detection-report', cdReport);

  // 5. Error Handling Analysis
  const errorReport = analyzeErrorHandling(LIB_ROOT);
  writeReport('error-handling-report', errorReport);

  // 6. CSS Duplication Analysis
  const cssReport = analyzeCssDuplication(LIB_ROOT);
  writeReport('css-duplication-report', cssReport);

  // 7. Event System Analysis
  const eventReport = analyzeEventSystem(LIB_ROOT);
  writeReport('event-system-report', eventReport);

  // 8. DI Correctness Analysis
  const diReport = analyzeDI(LIB_ROOT);
  writeReport('di-correctness-report', diReport);

  // 9. Testability Analysis
  const testabilityReport = analyzeTestability(LIB_ROOT);
  writeReport('testability-report', testabilityReport);

  console.log('\n✅ All analyzers complete.');
}

// Run if executed directly
if (require.main === module) {
  runAllAnalyzers();
}
