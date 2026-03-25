/**
 * Preservation Property Tests: Runtime Behavior Unchanged After Refactor
 *
 * Property 2: Preservation — For any operation on the groups or users components,
 * the fixed code SHALL produce exactly the same observable behavior as the original code,
 * preserving all existing functionality for end users and consuming developers.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.10, 3.11, 3.12, 3.13, 3.14**
 *
 * These tests verify structural/API preservation properties that can run without the
 * CometChat SDK. They MUST PASS on both unfixed and fixed code.
 *
 * Strategy: File-based static analysis using fast-check property-based testing to verify
 * that component source files preserve their public API contracts across the refactor.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// ==================== Helpers ====================

const LIB_ROOT = path.resolve(__dirname, '../../');
const COMPONENTS_ROOT = path.join(LIB_ROOT, 'components');

function readFileContent(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// ==================== Component Definitions ====================

interface PreservationTarget {
  name: string;
  componentFile: string;
  managerFile: string;
  serviceFile: string;
  /** @Input() property names that MUST exist */
  expectedInputs: string[];
  /** @Output() property names that MUST exist */
  expectedOutputs: string[];
  /** Public/private method names that MUST exist as event handlers */
  expectedMethods: string[];
  /** Lifecycle hooks that MUST be implemented */
  expectedLifecycleHooks: string[];
  /** Manager class method signatures that MUST be preserved (in manager OR service) */
  managerMethods: string[];
  /** Manager class name */
  managerClassName: string;
}

const GROUPS_TARGET: PreservationTarget = {
  name: 'CometChatGroupsComponent',
  componentFile: path.join(COMPONENTS_ROOT, 'cometchat-groups', 'cometchat-groups.component.ts'),
  managerFile: path.join(COMPONENTS_ROOT, 'cometchat-groups', 'groups.manager.ts'),
  serviceFile: path.join(LIB_ROOT, 'services', 'groups.service.ts'),
  expectedInputs: [
    'hideSearch',
    'hideError',
    'hideGroupType',
    'showScrollbar',
    'groupsRequestBuilder',
    'searchRequestBuilder',
    'activeGroup',
    'selectionMode',
    'options',
    'headerView',
    'menuView',
    'loadingView',
    'emptyView',
    'errorView',
    'itemView',
    'leadingView',
    'titleView',
    'subtitleView',
    'trailingView',
    'listItemTemplate',
    'emptyStateTemplate',
    'errorStateTemplate',
    'loadingStateTemplate',
  ],
  expectedOutputs: ['itemClick', 'select', 'error', 'selectionChange'],
  expectedMethods: [
    'handleLoadMore',
    'onSearch',
    'handleGroupClick',
    'handleSelectionChange',
    'trackByGroup',
    'getMemberCountText',
    'getGroupType',
  ],
  expectedLifecycleHooks: ['ngOnInit', 'ngOnDestroy'],
  managerMethods: ['fetchNext', 'attachListeners', 'attachConnectionListener'],
  managerClassName: 'GroupsManager',
};

const USERS_TARGET: PreservationTarget = {
  name: 'CometChatUsersComponent',
  componentFile: path.join(COMPONENTS_ROOT, 'cometchat-users', 'cometchat-users.component.ts'),
  managerFile: path.join(COMPONENTS_ROOT, 'cometchat-users', 'users.manager.ts'),
  serviceFile: path.join(LIB_ROOT, 'services', 'users.service.ts'),
  expectedInputs: [
    'hideSearch',
    'hideError',
    'hideUserStatus',
    'showScrollbar',
    'showSectionHeader',
    'showSelectedUsersPreview',
    'usersRequestBuilder',
    'searchRequestBuilder',
    'searchKeyword',
    'sectionHeaderKey',
    'activeUser',
    'selectionMode',
    'options',
    'headerView',
    'menuView',
    'loadingView',
    'emptyView',
    'errorView',
    'itemView',
    'leadingView',
    'titleView',
    'subtitleView',
    'trailingView',
    'listItemTemplate',
    'emptyStateTemplate',
    'errorStateTemplate',
    'loadingStateTemplate',
  ],
  expectedOutputs: ['itemClick', 'select', 'error', 'empty', 'selectionChange'],
  expectedMethods: [
    'handleLoadMore',
    'onSearch',
    'handleUserClick',
    'handleSelectionChange',
    'trackByUser',
    'shouldShowSectionHeader',
    'getSectionHeaderValue',
  ],
  expectedLifecycleHooks: ['ngOnInit', 'ngOnDestroy'],
  managerMethods: ['fetchNext', 'attachConnectionListener'],
  managerClassName: 'UsersManager',
};

const TARGETS: PreservationTarget[] = [GROUPS_TARGET, USERS_TARGET];

// ==================== Arbitraries ====================

const targetArbitrary = fc.constantFrom(...TARGETS);

const groupsInputArbitrary = fc.constantFrom(...GROUPS_TARGET.expectedInputs);
const usersInputArbitrary = fc.constantFrom(...USERS_TARGET.expectedInputs);
const groupsOutputArbitrary = fc.constantFrom(...GROUPS_TARGET.expectedOutputs);
const usersOutputArbitrary = fc.constantFrom(...USERS_TARGET.expectedOutputs);
const groupsMethodArbitrary = fc.constantFrom(...GROUPS_TARGET.expectedMethods);
const usersMethodArbitrary = fc.constantFrom(...USERS_TARGET.expectedMethods);

// ==================== Property Tests ====================

describe('Property 2: Preservation — Component Source Files Exist and Are Valid', () => {
  /**
   * Sub-property 2.1: Component files SHALL exist and contain @Component decorator.
   *
   * **Validates: Requirements 3.1, 3.2, 3.12**
   */
  it('component files SHALL exist and be valid Angular components', () => {
    fc.assert(
      fc.property(targetArbitrary, (target) => {
        const content = readFileContent(target.componentFile);
        expect(content, `${target.name} file should exist`).not.toBeNull();
        expect(content, `${target.name} must have @Component decorator`).toContain('@Component(');
        expect(content, `${target.name} must be standalone`).toContain('standalone: true');
        expect(content, `${target.name} must use OnPush change detection`).toContain(
          'ChangeDetectionStrategy.OnPush'
        );
      }),
      { numRuns: 10 }
    );
  });
});

describe('Property 2: Preservation — @Input() Properties Preserved (Req 3.12)', () => {
  /**
   * Sub-property 2.2a: CometChatGroupsComponent SHALL have all expected @Input() properties.
   *
   * **Validates: Requirements 3.12**
   */
  it('CometChatGroupsComponent SHALL preserve all @Input() properties', () => {
    const content = readFileContent(GROUPS_TARGET.componentFile);
    expect(content).not.toBeNull();

    fc.assert(
      fc.property(groupsInputArbitrary, (inputName) => {
        // The input must appear as a property name in the file
        const inputPattern = new RegExp(`\\b${inputName}\\b`);
        expect(
          inputPattern.test(content!),
          `Groups component must have @Input property '${inputName}'`
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Sub-property 2.2b: CometChatUsersComponent SHALL have all expected @Input() properties.
   *
   * **Validates: Requirements 3.12**
   */
  it('CometChatUsersComponent SHALL preserve all @Input() properties', () => {
    const content = readFileContent(USERS_TARGET.componentFile);
    expect(content).not.toBeNull();

    fc.assert(
      fc.property(usersInputArbitrary, (inputName) => {
        const inputPattern = new RegExp(`\\b${inputName}\\b`);
        expect(
          inputPattern.test(content!),
          `Users component must have @Input property '${inputName}'`
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Preservation — @Output() Events Preserved (Req 3.10)', () => {
  /**
   * Sub-property 2.3a: CometChatGroupsComponent SHALL have all expected @Output() events.
   *
   * **Validates: Requirements 3.10**
   */
  it('CometChatGroupsComponent SHALL preserve all @Output() events', () => {
    const content = readFileContent(GROUPS_TARGET.componentFile);
    expect(content).not.toBeNull();

    fc.assert(
      fc.property(groupsOutputArbitrary, (outputName) => {
        // Must have the output as an EventEmitter
        const emitterPattern = new RegExp(`${outputName}\\s*=\\s*new\\s+EventEmitter`);
        expect(
          emitterPattern.test(content!),
          `Groups component must have @Output() '${outputName}' as EventEmitter`
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Sub-property 2.3b: CometChatUsersComponent SHALL have all expected @Output() events.
   *
   * **Validates: Requirements 3.10**
   */
  it('CometChatUsersComponent SHALL preserve all @Output() events', () => {
    const content = readFileContent(USERS_TARGET.componentFile);
    expect(content).not.toBeNull();

    fc.assert(
      fc.property(usersOutputArbitrary, (outputName) => {
        const emitterPattern = new RegExp(`${outputName}\\s*=\\s*new\\s+EventEmitter`);
        expect(
          emitterPattern.test(content!),
          `Users component must have @Output() '${outputName}' as EventEmitter`
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Preservation — Event Handler Methods Preserved (Req 3.5, 3.6, 3.14)', () => {
  /**
   * Sub-property 2.4a: CometChatGroupsComponent SHALL have all expected event handler methods.
   *
   * **Validates: Requirements 3.5, 3.14**
   */
  it('CometChatGroupsComponent SHALL preserve all event handler methods', () => {
    const content = readFileContent(GROUPS_TARGET.componentFile);
    expect(content).not.toBeNull();

    fc.assert(
      fc.property(groupsMethodArbitrary, (methodName) => {
        const methodPattern = new RegExp(`${methodName}\\s*\\(`);
        expect(
          methodPattern.test(content!),
          `Groups component must have method '${methodName}()'`
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Sub-property 2.4b: CometChatUsersComponent SHALL have all expected event handler methods.
   *
   * **Validates: Requirements 3.6, 3.14**
   */
  it('CometChatUsersComponent SHALL preserve all event handler methods', () => {
    const content = readFileContent(USERS_TARGET.componentFile);
    expect(content).not.toBeNull();

    fc.assert(
      fc.property(usersMethodArbitrary, (methodName) => {
        const methodPattern = new RegExp(`${methodName}\\s*\\(`);
        expect(
          methodPattern.test(content!),
          `Users component must have method '${methodName}()'`
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Preservation — Lifecycle Hooks Preserved (Req 3.13)', () => {
  /**
   * Sub-property 2.5: Both components SHALL implement OnInit and OnDestroy lifecycle hooks.
   *
   * **Validates: Requirements 3.13**
   */
  it('components SHALL implement OnInit and OnDestroy for proper lifecycle management', () => {
    fc.assert(
      fc.property(targetArbitrary, (target) => {
        const content = readFileContent(target.componentFile);
        expect(content).not.toBeNull();

        for (const hook of target.expectedLifecycleHooks) {
          const hookPattern = new RegExp(`${hook}\\s*\\(\\s*\\)`);
          expect(
            hookPattern.test(content!),
            `${target.name} must implement lifecycle hook '${hook}()'`
          ).toBe(true);
        }

        // Must implement the interfaces
        expect(content, `${target.name} must implement OnInit`).toMatch(/implements.*OnInit/);
        expect(content, `${target.name} must implement OnDestroy`).toMatch(/implements.*OnDestroy/);
      }),
      { numRuns: 10 }
    );
  });
});

describe('Property 2: Preservation — Manager/Service Method Signatures Preserved (Req 3.1, 3.2, 3.3, 3.4)', () => {
  /**
   * Sub-property 2.6: The fetchNext, attachListeners, and attachConnectionListener
   * method signatures SHALL exist in either the manager file OR the service file.
   * This ensures the SDK interaction API is preserved across the refactor.
   *
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   */
  it('fetchNext/attachListeners/attachConnectionListener SHALL exist in manager OR service', () => {
    fc.assert(
      fc.property(targetArbitrary, (target) => {
        // Read both manager and service files — at least one must exist
        const managerContent = readFileContent(target.managerFile);
        const serviceContent = readFileContent(target.serviceFile);

        expect(
          managerContent !== null || serviceContent !== null,
          `Either ${target.managerClassName} or its replacement service must exist`
        ).toBe(true);

        // The source of truth is whichever file exists
        const source = serviceContent ?? managerContent!;

        for (const method of target.managerMethods) {
          const methodPattern = new RegExp(`${method}\\s*\\(`);
          expect(
            methodPattern.test(source),
            `Method '${method}()' must exist in manager or service for ${target.name}`
          ).toBe(true);
        }
      }),
      { numRuns: 10 }
    );
  });
});

describe('Property 2: Preservation — Search Debouncing Pattern Preserved (Req 3.3, 3.4)', () => {
  /**
   * Sub-property 2.7: Both components SHALL use debounceTime for search input.
   *
   * **Validates: Requirements 3.3, 3.4**
   */
  it('components SHALL use debounceTime for search input debouncing', () => {
    fc.assert(
      fc.property(targetArbitrary, (target) => {
        const content = readFileContent(target.componentFile);
        expect(content).not.toBeNull();

        // Must use debounceTime (from rxjs)
        expect(content, `${target.name} must use debounceTime for search`).toContain(
          'debounceTime'
        );

        // Must have a search subject
        expect(content, `${target.name} must have a searchSubject$`).toContain('searchSubject$');

        // Must have onSearch method
        expect(content, `${target.name} must have onSearch method`).toMatch(/onSearch\s*\(/);
      }),
      { numRuns: 10 }
    );
  });
});

describe('Property 2: Preservation — Selection Mode Support Preserved (Req 3.10)', () => {
  /**
   * Sub-property 2.8: Both components SHALL support SelectionMode enum values.
   *
   * **Validates: Requirements 3.10**
   */
  it('components SHALL reference SelectionMode for selection support', () => {
    fc.assert(
      fc.property(targetArbitrary, (target) => {
        const content = readFileContent(target.componentFile);
        expect(content).not.toBeNull();

        // Must import and use SelectionMode
        expect(content, `${target.name} must use SelectionMode`).toContain('SelectionMode');

        // Must have selectionMode input
        expect(content, `${target.name} must have selectionMode property`).toMatch(
          /selectionMode/
        );

        // Must have handleSelectionChange method
        expect(content, `${target.name} must have handleSelectionChange`).toMatch(
          /handleSelectionChange\s*\(/
        );
      }),
      { numRuns: 10 }
    );
  });
});

describe('Property 2: Preservation — Template Slot Pattern Preserved (Req 3.11)', () => {
  /**
   * Sub-property 2.9: Both components SHALL have TemplateRef-typed inputs for custom views.
   *
   * **Validates: Requirements 3.11**
   */
  it('components SHALL preserve TemplateRef input slots for custom templates', () => {
    const templateSlots = [
      'headerView',
      'loadingView',
      'emptyView',
      'errorView',
      'itemView',
      'leadingView',
      'titleView',
      'subtitleView',
      'trailingView',
    ];
    const slotArbitrary = fc.constantFrom(...templateSlots);

    fc.assert(
      fc.property(targetArbitrary, slotArbitrary, (target, slot) => {
        const content = readFileContent(target.componentFile);
        expect(content).not.toBeNull();

        // Each template slot must exist as a property
        const slotPattern = new RegExp(`\\b${slot}\\b`);
        expect(
          slotPattern.test(content!),
          `${target.name} must have template slot '${slot}'`
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Preservation — Users-Specific Features Preserved (Req 3.17, 3.18)', () => {
  /**
   * Sub-property 2.10: CometChatUsersComponent SHALL preserve section header and
   * selected users preview features.
   *
   * **Validates: Requirements 3.17, 3.18**
   */
  it('CometChatUsersComponent SHALL preserve section headers and selected users preview', () => {
    const content = readFileContent(USERS_TARGET.componentFile);
    expect(content).not.toBeNull();

    // Section header support
    expect(content, 'Must have showSectionHeader input').toContain('showSectionHeader');
    expect(content, 'Must have sectionHeaderKey input').toContain('sectionHeaderKey');
    expect(content, 'Must have shouldShowSectionHeader method').toMatch(
      /shouldShowSectionHeader\s*\(/
    );
    expect(content, 'Must have getSectionHeaderValue method').toMatch(
      /getSectionHeaderValue\s*\(/
    );

    // Selected users preview support
    expect(content, 'Must have showSelectedUsersPreview input').toContain(
      'showSelectedUsersPreview'
    );
  });
});
