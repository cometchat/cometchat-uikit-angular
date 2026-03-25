/**
 * Analysis Report Interfaces for Code Review & Refactoring
 * Used by all analyzers to produce structured JSON reports.
 */

// ==================== Duplication Analysis (Req 1) ====================
export interface DuplicationLocation {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
}

export interface DuplicationCluster {
  id: string;
  classification: 'identical' | 'near-identical' | 'pattern';
  category: 'event-handling' | 'sdk-calls' | 'utility' | 'template' | 'css';
  description: string;
  locations: DuplicationLocation[];
  suggestedConsolidation: string;
}

export interface DuplicationReport {
  clusters: DuplicationCluster[];
  summary: {
    totalClusters: number;
    byClassification: Record<string, number>;
    byCategory: Record<string, number>;
  };
}

// ==================== File Size Analysis (Req 2) ====================
export interface FileSection {
  name: string;
  startLine: number;
  endLine: number;
  lineCount: number;
  category: 'lifecycle' | 'event-handlers' | 'ui-logic' | 'sdk-interactions' | 'utilities' | 'state-management' | 'imports' | 'decorators' | 'properties';
}

export interface FileSizeViolation {
  filePath: string;
  fileType: 'component-ts' | 'template-html' | 'css' | 'service-ts';
  lineCount: number;
  threshold: number;
  sections: FileSection[];
}

export interface FileSizeReport {
  violations: FileSizeViolation[];
  godComponents: FileSizeViolation[];
  summary: {
    totalFilesScanned: number;
    totalViolations: number;
    godComponentCount: number;
    byType: Record<string, number>;
  };
}

// ==================== Splitting Plan (Req 2, 10) ====================
export interface ExtractedModule {
  name: string;
  type: 'service' | 'sub-component' | 'utility';
  responsibility: string;
  methods: string[];
  estimatedLines: number;
}

export interface DataFlowEntry {
  from: string;
  to: string;
  mechanism: 'input' | 'output' | 'inject' | 'signal';
  description: string;
}

export interface SplittingPlan {
  sourceFile: string;
  primaryComponent: string;
  extractedModules: ExtractedModule[];
  dataFlow: DataFlowEntry[];
}

// ==================== Subscription/Leak Analysis (Req 7) ====================
export interface LeakViolation {
  filePath: string;
  line: number;
  type: 'unmanaged-subscription' | 'unmanaged-dom-listener' | 'unmanaged-timer';
  description: string;
  suggestedFix: string;
}

export interface LeakReport {
  violations: LeakViolation[];
  summary: {
    totalViolations: number;
    byType: Record<string, number>;
    byComponent: Record<string, number>;
  };
}

// ==================== Pattern Consistency Analysis (Req 9) ====================
export interface PatternViolation {
  filePath: string;
  line: number;
  violationType: 'output-naming' | 'bem-css' | 'inline-style' | 'hardcoded-text' | 'hardcoded-css-value' | 'non-standalone';
  description: string;
  suggestedFix: string;
}

export interface PatternReport {
  violations: PatternViolation[];
  summary: {
    totalViolations: number;
    byType: Record<string, number>;
  };
}

// ==================== Change Detection Analysis (Req 6) ====================
export interface ChangeDetectionAuditEntry {
  componentName: string;
  filePath: string;
  currentStrategy: 'Default' | 'OnPush';
  recommendedStrategy: 'Default' | 'OnPush';
  justification: string;
}

export interface ChangeDetectionReport {
  entries: ChangeDetectionAuditEntry[];
  summary: {
    totalComponents: number;
    currentOnPush: number;
    recommendedOnPush: number;
    candidates: number;
  };
}

// ==================== Error Handling Analysis (Req 8) ====================
export interface ErrorHandlingViolation {
  filePath: string;
  line: number;
  type: 'silent-catch' | 'missing-error-state' | 'unhandled-promise' | 'missing-error-view';
  description: string;
  suggestedFix: string;
}

export interface ErrorHandlingReport {
  violations: ErrorHandlingViolation[];
  summary: {
    totalViolations: number;
    byType: Record<string, number>;
  };
}

// ==================== Event System Analysis (Req 14) ====================
export interface EventSubscriptionEntry {
  componentName: string;
  eventBus: string;
  eventName: string;
  hasUnsubscribe: boolean;
  hasContextFilter: boolean;
  purpose: string;
}

export interface EventSystemReport {
  subscriptions: EventSubscriptionEntry[];
  summary: {
    totalSubscriptions: number;
    missingUnsubscribe: number;
    missingContextFilter: number;
    byEventBus: Record<string, number>;
  };
}

// ==================== DI Analysis (Req 11) ====================
export interface DIViolation {
  filePath: string;
  line: number;
  type: 'direct-instantiation' | 'static-call-on-injectable' | 'excessive-dependencies';
  description: string;
  suggestedFix: string;
}

export interface DIReport {
  violations: DIViolation[];
  dependencyGraph: Record<string, string[]>;
  summary: {
    totalViolations: number;
    byType: Record<string, number>;
    excessiveDependencyComponents: string[];
  };
}

// ==================== CSS Duplication Analysis (Req 13) ====================
export interface CSSDuplicationCluster {
  pattern: string;
  category: 'identical-block' | 'layout-pattern';
  files: string[];
  suggestedConsolidation: string;
}

export interface CSSReport {
  clusters: CSSDuplicationCluster[];
  summary: {
    totalClusters: number;
    byCategory: Record<string, number>;
  };
}

// ==================== Testability Report (Req 12) ====================
export interface TestabilityEntry {
  sourceFile: string;
  hasSpecFile: boolean;
  specFile?: string;
  minTestCount?: number;
}

export interface TestabilityReport {
  entries: TestabilityEntry[];
  summary: {
    totalSources: number;
    withSpecs: number;
    missingSpecs: number;
  };
}
