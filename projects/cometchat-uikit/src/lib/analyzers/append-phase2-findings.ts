import * as fs from 'fs';
import * as path from 'path';

const REPORT_PATH = path.resolve(
  __dirname,
  '../../../../../.kiro/specs/angular-v5-uikit-code-review/findings-report.json'
);

interface Finding {
  id: string;
  severity: 'Critical' | 'Major' | 'Minor';
  requirement: string;
  area: string;
  file: string;
  line: number;
  description: string;
  suggestedFix: string;
  status: 'Open' | 'Fixed' | 'Deferred';
  fixStrategy: string;
}

const phase2Findings: Finding[] = [

  // ===== Task 10: Accessibility =====
  // 10.1 - Interactive element focusability / accessible names
  {
    id: 'F-A11Y-0001',
    severity: 'Major',
    requirement: 'Req 4.6',
    area: 'accessibility',
    file: 'projects/cometchat-uikit/src/lib/components/cometchat-users/cometchat-users.component.html',
    line: 1,
    description: 'CometChatUsers error state is missing a retry action button. Users component shows error title/subtitle but no retry button, unlike CometChatConversations which has a "Try Again" button.',
    suggestedFix: 'Add a retry button to the error template that calls handleRetryClick() to re-fetch users.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-A11Y-0002',
    severity: 'Major',
    requirement: 'Req 4.6',
    area: 'accessibility',
    file: 'projects/cometchat-uikit/src/lib/components/cometchat-groups/cometchat-groups.component.html',
    line: 1,
    description: 'CometChatGroups error state is missing a retry action button. Groups component shows error title/subtitle but no retry button.',
    suggestedFix: 'Add a retry button to the error template that calls handleRetryClick() to re-fetch groups.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  // 10.2 - Overlay focus trap and Escape key
  {
    id: 'F-A11Y-0003',
    severity: 'Major',
    requirement: 'Req 4.2',
    area: 'accessibility',
    file: 'projects/cometchat-uikit/src/lib/components/cometchat-action-sheet/cometchat-action-sheet.component.ts',
    line: 93,
    description: 'CometChatActionSheet does not implement a focus trap. The component handles Escape key and arrow navigation but explicitly states "Tab: Allow natural tab order (no focus trap)", allowing focus to escape the overlay.',
    suggestedFix: 'Inject FocusTrapService and activate it on open, deactivate on close. This prevents focus from leaving the action sheet while it is open.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-A11Y-0004',
    severity: 'Major',
    requirement: 'Req 4.2',
    area: 'accessibility',
    file: 'projects/cometchat-uikit/src/lib/components/cometchat-context-menu/cometchat-context-menu.component.ts',
    line: 1,
    description: 'CometChatContextMenu does not implement a focus trap. Focus can escape the context menu overlay via Tab key.',
    suggestedFix: 'Inject FocusTrapService and activate it when the context menu opens, deactivate when it closes.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  // 10.3 - List arrow-key navigation
  {
    id: 'F-A11Y-0005',
    severity: 'Major',
    requirement: 'Req 4.3',
    area: 'accessibility',
    file: 'projects/cometchat-uikit/src/lib/components/cometchat-users/cometchat-users.component.ts',
    line: 1,
    description: 'CometChatUsers does not directly wire ListNavigationService for arrow-key navigation. It delegates to CometChatPaginatedList which handles navigation, but the Users component itself does not expose keyboard navigation configuration.',
    suggestedFix: 'Verify CometChatPaginatedList handles arrow-key navigation for all list components including Users. If not, wire ListNavigationService directly.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-A11Y-0006',
    severity: 'Major',
    requirement: 'Req 4.3',
    area: 'accessibility',
    file: 'projects/cometchat-uikit/src/lib/components/cometchat-groups/cometchat-groups.component.ts',
    line: 1,
    description: 'CometChatGroups does not directly wire ListNavigationService for arrow-key navigation. It delegates to CometChatPaginatedList.',
    suggestedFix: 'Verify CometChatPaginatedList handles arrow-key navigation for Groups. If not, wire ListNavigationService directly.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  // 10.4 - aria-live regions
  {
    id: 'F-A11Y-0007',
    severity: 'Major',
    requirement: 'Req 4.6',
    area: 'accessibility',
    file: 'projects/cometchat-uikit/src/lib/components/cometchat-conversations/cometchat-conversations.component.html',
    line: 1,
    description: 'CometChatConversations has no aria-live region for announcing new conversation updates (e.g., new message badge, unread count changes) to screen readers.',
    suggestedFix: 'Add an aria-live="polite" region that announces new conversation activity, e.g., "New message from [user]".',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  // 10.6 - Message status icon accessibility (already has aria-label per audit - PASS)
  // 10.7 - EmojiKeyboard and StickersKeyboard grid navigation (PASS - both implemented)
  // ===== Task 11: DX and Public API =====
  // 11.1 - CometChatUIKit static init/login API (PASS - both static and instance methods exist)
  // 11.2 - ChatStateService wiring (PASS - Conversations, MessageList, MessageHeader, MessageComposer all use it)
  // 11.3 - MessageBubbleConfigService API (PASS - setMessageTemplates accepts Record<MessageTypeKey, BubblePartMap>)
  {
    id: 'F-DX-0001',
    severity: 'Major',
    requirement: 'Req 3.8',
    area: 'dx',
    file: 'projects/cometchat-uikit/src/lib/components/cometchat-message-list/cometchat-message-list.component.ts',
    line: 1,
    description: 'CometChatMessageList has a large number of @Input() properties (>20) with no defaults, increasing integration complexity. Many inputs like user, group, messagesRequestBuilder, messageTemplate, etc. are required for full functionality.',
    suggestedFix: 'Provide sensible defaults for all optional inputs. Document which inputs are truly required vs optional. Consider grouping related inputs into a configuration object.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-DX-0002',
    severity: 'Major',
    requirement: 'Req 3.8',
    area: 'dx',
    file: 'projects/cometchat-uikit/src/lib/components/cometchat-message-composer/cometchat-message-composer.component.ts',
    line: 1,
    description: 'CometChatMessageComposer has a large number of @Input() properties (>15) with no defaults, increasing integration complexity.',
    suggestedFix: 'Provide sensible defaults for all optional inputs. Document which inputs are truly required vs optional.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  // 11.5 - public-api.ts exports
  {
    id: 'F-DX-0003',
    severity: 'Major',
    requirement: 'Req 12.1',
    area: 'public-api',
    file: 'projects/cometchat-uikit/src/public-api.ts',
    line: 1,
    description: 'public-api.ts does not export CometChatCallButtons, CometChatCallLogs, CometChatIncomingCall, CometChatOutgoingCall, CometChatOngoingCall components individually — they are only accessible via the wildcard `export * from ./lib/components`. This makes tree-shaking less effective and the public API surface implicit.',
    suggestedFix: 'Add explicit named exports for all consumer-facing components, services, and types. Avoid relying solely on wildcard re-exports from barrel files.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  // 11.6 - ng-package.json and tsconfig strict mode
  {
    id: 'F-DX-0004',
    severity: 'Major',
    requirement: 'Req 7.6',
    area: 'dx',
    file: 'projects/cometchat-uikit/tsconfig.lib.prod.json',
    line: 1,
    description: 'tsconfig.lib.prod.json does not explicitly set strict: true, noImplicitAny: true, or strictNullChecks: true. These are inherited from the root tsconfig.json but not enforced at the library level, meaning a root tsconfig change could silently weaken type safety.',
    suggestedFix: 'Add explicit "strict": true, "noImplicitAny": true, "strictNullChecks": true to tsconfig.lib.prod.json compilerOptions to ensure library-level enforcement.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  // 11.7 - standalone components (PASS - all components use standalone: true per Phase 1 audit)
  // ===== Task 12: Sample App =====
  {
    id: 'F-SAPP-0001',
    severity: 'Critical',
    requirement: 'Req 11.8',
    area: 'sample-app',
    file: 'projects/sample-app/src/main.ts',
    line: 11,
    description: 'Hardcoded APP_ID "" found in sample app main.ts. Real credentials should never be committed to source control.',
    suggestedFix: 'Move APP_ID to projects/sample-app/src/environments/environment.ts and reference it as environment.appId. Add environment.ts to .gitignore.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-SAPP-0002',
    severity: 'Critical',
    requirement: 'Req 11.8',
    area: 'sample-app',
    file: 'projects/sample-app/src/main.ts',
    line: 13,
    description: 'Hardcoded AUTH_KEY "0cbf4d625ef2b877732039f9976c128459878ad4" found in sample app main.ts. Auth keys are sensitive credentials and must not be committed to source control.',
    suggestedFix: 'Move AUTH_KEY to projects/sample-app/src/environments/environment.ts and reference it as environment.authKey. Add environment.ts to .gitignore and provide environment.example.ts.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-SAPP-0003',
    severity: 'Major',
    requirement: 'Req 11.3',
    area: 'sample-app',
    file: 'projects/sample-app/src/app',
    line: 1,
    description: 'Sample app does not demonstrate a complete integrated chat flow (Conversations + MessageHeader + MessageList + MessageComposer) in a single unified view. Pages are isolated demos rather than a cohesive chat experience.',
    suggestedFix: 'Add a "full-chat" demo page that combines CometChatConversations, CometChatMessageHeader, CometChatMessageList, and CometChatMessageComposer in a single layout, wired via ChatStateService.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-SAPP-0004',
    severity: 'Major',
    requirement: 'Req 11.4',
    area: 'sample-app',
    file: 'projects/sample-app/src/app',
    line: 1,
    description: 'Sample app does not demonstrate theme switching via data-theme attribute toggle. The theming-page exists but does not show runtime light/dark switching.',
    suggestedFix: 'Add a theme toggle button that sets document.documentElement.setAttribute("data-theme", "dark"/"light") and demonstrates the CSS variable cascade.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-SAPP-0005',
    severity: 'Major',
    requirement: 'Req 11.5',
    area: 'sample-app',
    file: 'projects/sample-app/src/app',
    line: 1,
    description: 'Sample app does not demonstrate language switching via CometChatLocalize.setLanguage(). No localization demo page exists.',
    suggestedFix: 'Add a language switcher component that calls CometChatLocalize.setLanguage("fr") / setLanguage("en") and shows the UI updating in real time.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  // ===== Task 13: Error Handling =====
  // 13.1 - SDK calls wrapped in error handling
  {
    id: 'F-ERR-0001',
    severity: 'Major',
    requirement: 'Req 14.4',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/services/dialog-focus-manager.service.ts',
    line: 72,
    description: 'DialogFocusManager uses console.warn() directly instead of CometChatLogger. Service-level logging should use the centralized logger for consistent log level control.',
    suggestedFix: 'Replace console.warn() with CometChatLogger.warn("DialogFocusManager", message) to use the centralized logging infrastructure.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-ERR-0002',
    severity: 'Major',
    requirement: 'Req 14.4',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/services/focus-trap.service.ts',
    line: 67,
    description: 'FocusTrapService uses console.warn() directly instead of CometChatLogger.',
    suggestedFix: 'Replace console.warn() with CometChatLogger.warn("FocusTrapService", message).',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-ERR-0003',
    severity: 'Major',
    requirement: 'Req 14.4',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/services/conversations.service.ts',
    line: 501,
    description: 'ConversationsService uses console.warn() directly instead of CometChatLogger.',
    suggestedFix: 'Replace console.warn() with CometChatLogger.warn("ConversationsService", message).',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-ERR-0004',
    severity: 'Major',
    requirement: 'Req 14.4',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/services/message-bubble-config.service.ts',
    line: 582,
    description: 'MessageBubbleConfigService uses console.warn() directly instead of CometChatLogger.',
    suggestedFix: 'Replace console.warn() with CometChatLogger.warn("MessageBubbleConfigService", message).',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-ERR-0005',
    severity: 'Major',
    requirement: 'Req 14.4',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/services/message-header.service.ts',
    line: 367,
    description: 'MessageHeaderService uses console.warn() directly instead of CometChatLogger.',
    suggestedFix: 'Replace console.warn() with CometChatLogger.warn("MessageHeaderService", message).',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-ERR-0006',
    severity: 'Major',
    requirement: 'Req 14.4',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/services/message-list.service.ts',
    line: 1930,
    description: 'MessageListService uses console.warn() and console.error() in multiple places instead of CometChatLogger. At least 15 occurrences found.',
    suggestedFix: 'Replace all console.warn() and console.error() calls with CometChatLogger.warn("MessageListService", ...) and CometChatLogger.error("MessageListService", ...).',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-ERR-0007',
    severity: 'Minor',
    requirement: 'Req 14.4',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/services/selection-manager.class.ts',
    line: 132,
    description: 'SelectionManager uses console.warn() directly instead of CometChatLogger.',
    suggestedFix: 'Replace console.warn() with CometChatLogger.warn("SelectionManager", message).',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-ERR-0008',
    severity: 'Minor',
    requirement: 'Req 14.4',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/services/link-manager.class.ts',
    line: 79,
    description: 'LinkManager uses console.warn() directly instead of CometChatLogger.',
    suggestedFix: 'Replace console.warn() with CometChatLogger.warn("LinkManager", message).',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-ERR-0009',
    severity: 'Minor',
    requirement: 'Req 14.4',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/services/format-manager.class.ts',
    line: 1015,
    description: 'FormatManager uses console.warn() directly instead of CometChatLogger.',
    suggestedFix: 'Replace console.warn() with CometChatLogger.warn("FormatManager", message).',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-ERR-0010',
    severity: 'Minor',
    requirement: 'Req 14.4',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/services/rich-text-editor.class.ts',
    line: 1440,
    description: 'RichTextEditor class uses console.warn() directly instead of CometChatLogger.',
    suggestedFix: 'Replace console.warn() with CometChatLogger.warn("RichTextEditor", message).',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  // 13.3 - Error state rendering in list components
  {
    id: 'F-ERR-0011',
    severity: 'Major',
    requirement: 'Req 14.3',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/components/cometchat-users/cometchat-users.component.html',
    line: 154,
    description: 'CometChatUsers error state renders a localized error message but has no retry action button. Users cannot recover from an error without refreshing the page.',
    suggestedFix: 'Add a "Try Again" button to the error template that calls a handleRetryClick() method to re-initialize the users request and re-fetch.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
  {
    id: 'F-ERR-0012',
    severity: 'Major',
    requirement: 'Req 14.3',
    area: 'error-handling',
    file: 'projects/cometchat-uikit/src/lib/components/cometchat-groups/cometchat-groups.component.html',
    line: 120,
    description: 'CometChatGroups error state renders a localized error message but has no retry action button. Users cannot recover from an error without refreshing the page.',
    suggestedFix: 'Add a "Try Again" button to the error template that calls a handleRetryClick() method to re-initialize the groups request and re-fetch.',
    status: 'Open',
    fixStrategy: 'Inline',
  },
];

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));

// Append new findings
report.findings.push(...phase2Findings);

// Recount
const bySeverity: Record<string, number> = { Critical: 0, Major: 0, Minor: 0 };
const byArea: Record<string, number> = {};
for (const f of report.findings) {
  bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
  byArea[f.area] = (byArea[f.area] || 0) + 1;
}
report.totalFindings = report.findings.length;
report.bySeverity = bySeverity;
report.byArea = byArea;
report.generatedAt = new Date().toISOString();

fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(`Updated findings-report.json: ${report.totalFindings} total findings`);
console.log('By severity:', bySeverity);
