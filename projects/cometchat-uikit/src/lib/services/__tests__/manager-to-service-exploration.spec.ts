/**
 * Bug Condition Exploration Test: Manager Classes Used Instead of Injectable Services
 *
 * Property 1: Bug Condition — For any component where isBugCondition(component) holds,
 * the component SHALL use an @Injectable() Angular service obtained via inject(),
 * with Signal-based state, initialize()/cleanup() lifecycle methods, and
 * attachListeners()/detachListeners() methods, following the GroupMembersService pattern.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.7, 1.8**
 *
 * This test is EXPECTED TO FAIL on unfixed code because:
 * - GroupsService and UsersService do not exist yet
 * - The components use `new GroupsManager(...)` and `new UsersManager(...)` instead of DI
 * - The manager files exist as non-Angular classes
 *
 * After the fix, this test will PASS because:
 * - GroupsService and UsersService will be @Injectable() services
 * - Components will use inject() instead of new
 * - Manager files will be deleted
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// ==================== Helpers ====================

const LIB_ROOT = path.resolve(__dirname, '../../');
const COMPONENTS_ROOT = path.join(LIB_ROOT, 'components');
const SERVICES_ROOT = path.join(LIB_ROOT, 'services');

/**
 * Reads a file's content, returns null if not found.
 */
function readFileContent(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Checks if a file exists on disk.
 */
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// ==================== Component Definitions ====================

interface ComponentUnderTest {
  name: string;
  componentDir: string;
  componentFile: string;
  managerFile: string;
  serviceName: string;
  serviceFile: string;
  managerClassName: string;
}

const COMPONENTS_UNDER_TEST: ComponentUnderTest[] = [
  {
    name: 'CometChatGroupsComponent',
    componentDir: path.join(COMPONENTS_ROOT, 'cometchat-groups'),
    componentFile: path.join(COMPONENTS_ROOT, 'cometchat-groups', 'cometchat-groups.component.ts'),
    managerFile: path.join(COMPONENTS_ROOT, 'cometchat-groups', 'groups.manager.ts'),
    serviceName: 'GroupsService',
    serviceFile: path.join(SERVICES_ROOT, 'groups.service.ts'),
    managerClassName: 'GroupsManager',
  },
  {
    name: 'CometChatUsersComponent',
    componentDir: path.join(COMPONENTS_ROOT, 'cometchat-users'),
    componentFile: path.join(COMPONENTS_ROOT, 'cometchat-users', 'cometchat-users.component.ts'),
    managerFile: path.join(COMPONENTS_ROOT, 'cometchat-users', 'users.manager.ts'),
    serviceName: 'UsersService',
    serviceFile: path.join(SERVICES_ROOT, 'users.service.ts'),
    managerClassName: 'UsersManager',
  },
];

// ==================== Arbitrary ====================

/**
 * Arbitrary that picks one of the two components under test.
 * Scoped to the two concrete failing cases per the task description.
 */
const componentArbitrary = fc.constantFrom(...COMPONENTS_UNDER_TEST);

// ==================== Property Tests ====================

describe('Property 1: Bug Condition — Manager Classes Used Instead of Injectable Services', () => {
  /**
   * Sub-property 1a: The @Injectable() service file SHALL exist.
   *
   * On unfixed code this FAILS because groups.service.ts and users.service.ts
   * do not exist yet.
   *
   * **Validates: Requirements 1.7, 1.8, 2.7, 2.8**
   */
  it('service file SHALL exist for each component that had a manager class', () => {
    fc.assert(
      fc.property(componentArbitrary, (comp) => {
        expect(
          fileExists(comp.serviceFile),
          `${comp.serviceName} should exist at ${comp.serviceFile}`
        ).toBe(true);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Sub-property 1b: The manager file SHALL NOT exist after the fix.
   *
   * On unfixed code this FAILS because groups.manager.ts and users.manager.ts
   * still exist.
   *
   * **Validates: Requirements 1.7, 1.8**
   */
  it('manager file SHALL NOT exist for each component', () => {
    fc.assert(
      fc.property(componentArbitrary, (comp) => {
        expect(
          fileExists(comp.managerFile),
          `${comp.managerClassName} file should be deleted: ${comp.managerFile}`
        ).toBe(false);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Sub-property 1c: The component SHALL NOT instantiate the manager via `new`.
   *
   * On unfixed code this FAILS because the components contain
   * `new GroupsManager(...)` and `new UsersManager(...)`.
   *
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
   */
  it('component SHALL NOT contain `new ManagerClass(...)` instantiation', () => {
    fc.assert(
      fc.property(componentArbitrary, (comp) => {
        const content = readFileContent(comp.componentFile);
        expect(content, `Component file should exist: ${comp.componentFile}`).not.toBeNull();

        const pattern = new RegExp(`new\\s+${comp.managerClassName}\\s*\\(`);
        expect(
          pattern.test(content!),
          `${comp.name} should NOT contain 'new ${comp.managerClassName}(...)' — use inject(${comp.serviceName}) instead`
        ).toBe(false);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Sub-property 1d: The component SHALL use inject() to obtain the service.
   *
   * On unfixed code this FAILS because the components don't inject
   * GroupsService or UsersService.
   *
   * **Validates: Requirements 2.1, 2.2**
   */
  it('component SHALL use inject(ServiceName) for dependency injection', () => {
    fc.assert(
      fc.property(componentArbitrary, (comp) => {
        const content = readFileContent(comp.componentFile);
        expect(content, `Component file should exist: ${comp.componentFile}`).not.toBeNull();

        const injectPattern = new RegExp(`inject\\s*\\(\\s*${comp.serviceName}\\s*\\)`);
        expect(
          injectPattern.test(content!),
          `${comp.name} should contain 'inject(${comp.serviceName})'`
        ).toBe(true);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Sub-property 1e: The service SHALL be @Injectable() with Signal-based state
   * and initialize()/cleanup() lifecycle methods.
   *
   * On unfixed code this FAILS because the service files don't exist.
   *
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
   */
  it('service SHALL be @Injectable() with Signal state and lifecycle methods', () => {
    fc.assert(
      fc.property(componentArbitrary, (comp) => {
        const content = readFileContent(comp.serviceFile);
        expect(content, `Service file should exist: ${comp.serviceFile}`).not.toBeNull();

        // Must be @Injectable()
        expect(content, `${comp.serviceName} must have @Injectable() decorator`).toContain(
          '@Injectable()'
        );

        // Must use signal() for reactive state
        expect(content, `${comp.serviceName} must use signal() for state`).toMatch(
          /signal\s*[<(]/
        );

        // Must have initialize() method
        expect(content, `${comp.serviceName} must have initialize() method`).toMatch(
          /initialize\s*\(/
        );

        // Must have cleanup() method
        expect(content, `${comp.serviceName} must have cleanup() method`).toMatch(
          /cleanup\s*\(/
        );
      }),
      { numRuns: 10 }
    );
  });
});
