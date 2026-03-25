import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * Property-Based Tests for Localized String Retrieval
 *
 * Feature: comprehensive-test-suite, Property 6: Localized String Retrieval
 *
 * For any component that uses the translate pipe or CometChatLocalize.getLocalizedString(),
 * the rendered output SHALL contain translated strings from the active language bundle,
 * not raw translation keys.
 *
 * **Validates: Requirements 2.6**
 */

// ─── Localization Key → Expected Translation Mappings ───
// Each component entry defines the localization keys it uses and the
// expected English translations. The mock classes call CometChatLocalize
// directly, mirroring how the real components resolve translations.

interface LocalizedComponentEntry {
  /** Component name */
  name: string;
  /** Factory that creates a mock component with localized defaults */
  factory: () => any;
  /** Renders the component to a DOM element */
  render: (comp: any) => HTMLElement;
  /** Localization keys the component uses — these should NOT appear as raw text */
  keys: string[];
  /** Expected translated strings that SHOULD appear in the rendered output */
  expectedStrings: string[];
}

// ─── Mock Classes ───

class MockConfirmDialogComponent {
  title = CometChatLocalize.getLocalizedString('conversation_delete_title');
  messageText = CometChatLocalize.getLocalizedString('conversation_delete_subtitle');
  cancelButtonText = CometChatLocalize.getLocalizedString('conversation_delete_confirm_no');
  confirmButtonText = CometChatLocalize.getLocalizedString('conversation_delete_confirm_yes');
  isError = false;

  get errorMessage(): string {
    return CometChatLocalize.getLocalizedString('conversation_delete_error');
  }
}

class MockFlagMessageDialogComponent {
  get dialogTitle(): string {
    return CometChatLocalize.getLocalizedString('flag_message_title');
  }
  get dialogSubtitle(): string {
    return CometChatLocalize.getLocalizedString('flag_message_subtitle');
  }
  get remarkLabel(): string {
    return CometChatLocalize.getLocalizedString('flag_message_remark_label');
  }
  get remarkOptional(): string {
    return CometChatLocalize.getLocalizedString('flag_message_remark_optional');
  }
  get confirmButtonText(): string {
    return CometChatLocalize.getLocalizedString('flag_message_confirm_yes');
  }
  get cancelButtonText(): string {
    return CometChatLocalize.getLocalizedString('flag_message_confirm_no');
  }
}

class MockSearchBarComponent {
  placeholderText = CometChatLocalize.getLocalizedString('search_placeholder');

  get clearButtonAriaLabel(): string {
    return CometChatLocalize.getLocalizedString('accessibility_clear_search');
  }
}

class MockMessagePreviewComponent {
  get deletedMessageText(): string {
    return CometChatLocalize.getLocalizedString('message_deleted');
  }
  get closeLabel(): string {
    return CometChatLocalize.getLocalizedString('close');
  }
}

class MockChangeScopeComponent {
  cancelText = CometChatLocalize.getLocalizedString('change_scope_confirm_no');
  get errorMessage(): string {
    return CometChatLocalize.getLocalizedString('change_scope_error');
  }
}

// ─── Render Functions ───

function renderConfirmDialog(comp: MockConfirmDialogComponent): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="cometchat-confirm-dialog" role="dialog" aria-modal="true">
      <div class="cometchat-confirm-dialog__content">
        <div class="cometchat-confirm-dialog__content-title">${comp.title}</div>
        <div class="cometchat-confirm-dialog__content-description">${comp.messageText}</div>
      </div>
      <div class="cometchat-confirm-dialog__button-group">
        <button class="cometchat-confirm-dialog__cancel">${comp.cancelButtonText}</button>
        <button class="cometchat-confirm-dialog__confirm">${comp.confirmButtonText}</button>
      </div>
    </div>`;
  return container;
}

function renderFlagMessageDialog(comp: MockFlagMessageDialogComponent): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="cometchat-flag-message-dialog" role="dialog" aria-modal="true">
      <div class="cometchat-flag-message-dialog__title">${comp.dialogTitle}</div>
      <div class="cometchat-flag-message-dialog__subtitle">${comp.dialogSubtitle}</div>
      <label class="cometchat-flag-message-dialog__remark-label">
        ${comp.remarkLabel} <span>(${comp.remarkOptional})</span>
      </label>
      <div class="cometchat-flag-message-dialog__actions">
        <button class="cometchat-flag-message-dialog__cancel">${comp.cancelButtonText}</button>
        <button class="cometchat-flag-message-dialog__confirm">${comp.confirmButtonText}</button>
      </div>
    </div>`;
  return container;
}

function renderSearchBar(comp: MockSearchBarComponent): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="cometchat-search-bar" role="search">
      <input class="cometchat-search-bar__input"
        type="text"
        placeholder="${comp.placeholderText}"
        role="searchbox" />
      <button class="cometchat-search-bar__clear"
        aria-label="${comp.clearButtonAriaLabel}">×</button>
    </div>`;
  return container;
}

function renderMessagePreview(comp: MockMessagePreviewComponent): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="cometchat-message-preview" role="status">
      <div class="cometchat-message-preview__deleted">${comp.deletedMessageText}</div>
      <button class="cometchat-message-preview__close"
        aria-label="${comp.closeLabel}">${comp.closeLabel}</button>
    </div>`;
  return container;
}

function renderChangeScope(comp: MockChangeScopeComponent): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="cometchat-change-scope">
      <div class="cometchat-change-scope__actions">
        <button class="cometchat-change-scope__cancel">${comp.cancelText}</button>
      </div>
    </div>`;
  return container;
}

// ─── Component Registry ───

const LOCALIZED_COMPONENTS: LocalizedComponentEntry[] = [
  {
    name: 'cometchat-confirm-dialog',
    factory: () => new MockConfirmDialogComponent(),
    render: renderConfirmDialog,
    keys: [
      'conversation_delete_title',
      'conversation_delete_subtitle',
      'conversation_delete_confirm_no',
      'conversation_delete_confirm_yes',
    ],
    expectedStrings: ['Delete Conversation?', 'Cancel', 'Delete'],
  },
  {
    name: 'cometchat-flag-message-dialog',
    factory: () => new MockFlagMessageDialogComponent(),
    render: renderFlagMessageDialog,
    keys: [
      'flag_message_title',
      'flag_message_subtitle',
      'flag_message_remark_label',
      'flag_message_remark_optional',
      'flag_message_confirm_yes',
      'flag_message_confirm_no',
    ],
    expectedStrings: ['Report a Message', 'Report', 'Cancel', 'Reason', 'Optional'],
  },
  {
    name: 'cometchat-search-bar',
    factory: () => new MockSearchBarComponent(),
    render: renderSearchBar,
    keys: ['search_placeholder', 'accessibility_clear_search'],
    expectedStrings: ['Search'],
  },
  {
    name: 'cometchat-message-preview',
    factory: () => new MockMessagePreviewComponent(),
    render: renderMessagePreview,
    keys: ['message_deleted', 'close'],
    expectedStrings: ['This message was deleted', 'Close'],
  },
  {
    name: 'cometchat-change-scope',
    factory: () => new MockChangeScopeComponent(),
    render: renderChangeScope,
    keys: ['change_scope_confirm_no'],
    expectedStrings: ['Cancel'],
  },
];

// ─── Tests ───

describe('Localized String Retrieval Property Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: comprehensive-test-suite, Property 6: Localized String Retrieval**
   *
   * *For any* component that uses the translate pipe or CometChatLocalize.getLocalizedString(),
   * the rendered output SHALL contain translated strings from the active language bundle,
   * not raw translation keys.
   *
   * **Validates: Requirements 2.6**
   */
  describe('Property 6: Localized String Retrieval', () => {
    it('should render translated strings, not raw localization keys, for any localized component', () => {
      fc.assert(
        fc.property(fc.constantFrom(...LOCALIZED_COMPONENTS), (entry: LocalizedComponentEntry) => {
          const comp = entry.factory();
          const dom = entry.render(comp);
          const textContent = dom.textContent || '';
          const outerHtml = dom.innerHTML;

          // ── Verify: rendered output contains expected translated strings ──
          for (const expected of entry.expectedStrings) {
            const found = textContent.includes(expected) || outerHtml.includes(expected);
            expect(found).toBe(true);
          }

          // ── Verify: rendered output does NOT contain raw localization keys ──
          // Raw keys follow the pattern: lowercase_with_underscores (e.g. "conversation_delete_title")
          // We check that none of the component's known keys appear as raw text in the output.
          for (const key of entry.keys) {
            // The key should not appear as visible text content.
            // It may appear in CSS class names (which use hyphens, not underscores),
            // so we check textContent specifically.
            expect(textContent).not.toContain(key);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should resolve every localization key to a non-empty translated string', () => {
      // Collect all unique keys across all components
      const allKeys = LOCALIZED_COMPONENTS.flatMap(entry => entry.keys);
      const uniqueKeys = [...new Set(allKeys)];

      fc.assert(
        fc.property(fc.constantFrom(...uniqueKeys), (key: string) => {
          const translated = CometChatLocalize.getLocalizedString(key);

          // Translation should be a non-empty string
          expect(typeof translated).toBe('string');
          expect(translated.length).toBeGreaterThan(0);

          // Translation should NOT equal the raw key
          expect(translated).not.toBe(key);
        }),
        { numRuns: 100 }
      );
    });
  });
});
