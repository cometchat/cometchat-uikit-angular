/**
 * Unit Tests: UIKit Localization Audit
 *
 * Verifies that the localization keys used by all audited components
 * resolve to correct values via CometChatLocalize.getLocalizedString().
 *
 * These are pure TypeScript unit tests — no Angular TestBed or DI required.
 *
 * _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CometChatLocalize } from './cometchat-localize';

import de from './resources/de/translation.json';
import enGb from './resources/en-gb/translation.json';
import enUs from './resources/en-us/translation.json';
import es from './resources/es/translation.json';
import fr from './resources/fr/translation.json';
import hi from './resources/hi/translation.json';
import hu from './resources/hu/translation.json';
import itLang from './resources/it/translation.json';
import ja from './resources/ja/translation.json';
import ko from './resources/ko/translation.json';
import lt from './resources/lt/translation.json';
import ms from './resources/ms/translation.json';
import nl from './resources/nl/translation.json';
import pt from './resources/pt/translation.json';
import ru from './resources/ru/translation.json';
import sv from './resources/sv/translation.json';
import tr from './resources/tr/translation.json';
import zh from './resources/zh/translation.json';
import zhTw from './resources/zh-tw/translation.json';

const allLanguageFiles: Record<string, Record<string, string>> = {
  de,
  'en-gb': enGb,
  'en-us': enUs,
  es,
  fr,
  hi,
  hu,
  it: itLang,
  ja,
  ko,
  lt,
  ms,
  nl,
  pt,
  ru,
  sv,
  tr,
  zh,
  'zh-tw': zhTw,
};

/** The 9 audit keys that must exist in all translation files */
const auditKeys = [
  'media_recorder_aria_label',
  'toast_close_aria_label',
  'action_sheet_aria_label',
  'context_menu_aria_label',
  'link_popover_aria_label',
  'sticker_categories_aria_label',
  'dropdown_placeholder',
  'checkbox_aria_label',
  'file_bubble_unknown_file',
];

// ============================================================
// Task 9.1: Base Element Localization
// _Requirements: 6.1, 6.3_
// ============================================================

describe('Unit Tests: Base Element Localization', () => {
  beforeEach(() => {
    CometChatLocalize.setCurrentLanguage('en-US');
  });

  afterEach(() => {
    CometChatLocalize.setCurrentLanguage('en-US');
  });

  describe('cometchat-media-recorder', () => {
    it('should resolve media_recorder_aria_label to "Voice recorder"', () => {
      expect(CometChatLocalize.getLocalizedString('media_recorder_aria_label')).toBe(
        'Voice recorder'
      );
    });

    it('should resolve media_recorder_aria_label to a non-empty string', () => {
      expect(CometChatLocalize.getLocalizedString('media_recorder_aria_label')).toBeTruthy();
    });
  });

  describe('cometchat-toast', () => {
    it('should resolve toast_close_aria_label to "Close toast notification"', () => {
      expect(CometChatLocalize.getLocalizedString('toast_close_aria_label')).toBe(
        'Close toast notification'
      );
    });

    it('should resolve toast_close_aria_label to a non-empty string', () => {
      expect(CometChatLocalize.getLocalizedString('toast_close_aria_label')).toBeTruthy();
    });
  });

  describe('cometchat-change-scope', () => {
    it('should resolve change_scope_title to "Change Scope"', () => {
      expect(CometChatLocalize.getLocalizedString('change_scope_title')).toBe('Change Scope');
    });

    it('should resolve change_scope_confirm_yes to a non-empty string', () => {
      expect(CometChatLocalize.getLocalizedString('change_scope_confirm_yes')).toBeTruthy();
    });
  });

  describe('cometchat-dropdown', () => {
    it('should resolve dropdown_placeholder to "Select an option"', () => {
      expect(CometChatLocalize.getLocalizedString('dropdown_placeholder')).toBe('Select an option');
    });

    it('should resolve dropdown_placeholder to a non-empty string', () => {
      expect(CometChatLocalize.getLocalizedString('dropdown_placeholder')).toBeTruthy();
    });
  });

  describe('cometchat-checkbox', () => {
    it('should resolve checkbox_aria_label to "Checkbox"', () => {
      expect(CometChatLocalize.getLocalizedString('checkbox_aria_label')).toBe('Checkbox');
    });

    it('should resolve checkbox_aria_label to a non-empty string', () => {
      expect(CometChatLocalize.getLocalizedString('checkbox_aria_label')).toBeTruthy();
    });
  });
});

// ============================================================
// Task 9.2: Main Component Aria-Label Localization
// _Requirements: 6.1_
// ============================================================

describe('Unit Tests: Main Component Aria-Label Localization', () => {
  beforeEach(() => {
    CometChatLocalize.setCurrentLanguage('en-US');
  });

  afterEach(() => {
    CometChatLocalize.setCurrentLanguage('en-US');
  });

  describe('cometchat-action-sheet', () => {
    it('should resolve action_sheet_aria_label to "Actions"', () => {
      expect(CometChatLocalize.getLocalizedString('action_sheet_aria_label')).toBe('Actions');
    });

    it('should resolve action_sheet_aria_label to a non-empty string', () => {
      expect(CometChatLocalize.getLocalizedString('action_sheet_aria_label')).toBeTruthy();
    });
  });

  describe('cometchat-context-menu', () => {
    it('should resolve context_menu_aria_label to "Context menu"', () => {
      expect(CometChatLocalize.getLocalizedString('context_menu_aria_label')).toBe('Context menu');
    });

    it('should resolve context_menu_aria_label to a non-empty string', () => {
      expect(CometChatLocalize.getLocalizedString('context_menu_aria_label')).toBeTruthy();
    });
  });

  describe('cometchat-link-popover', () => {
    it('should resolve link_popover_aria_label to "Link actions"', () => {
      expect(CometChatLocalize.getLocalizedString('link_popover_aria_label')).toBe('Link actions');
    });

    it('should resolve link_popover_aria_label to a non-empty string', () => {
      expect(CometChatLocalize.getLocalizedString('link_popover_aria_label')).toBeTruthy();
    });
  });

  describe('cometchat-stickers-keyboard', () => {
    it('should resolve sticker_categories_aria_label to "Sticker categories"', () => {
      expect(CometChatLocalize.getLocalizedString('sticker_categories_aria_label')).toBe(
        'Sticker categories'
      );
    });

    it('should resolve sticker_categories_aria_label to a non-empty string', () => {
      expect(CometChatLocalize.getLocalizedString('sticker_categories_aria_label')).toBeTruthy();
    });
  });
});

// ============================================================
// Task 9.3: Fallback Removal Verification
// _Requirements: 6.1, 6.4_
// ============================================================

describe('Unit Tests: Fallback Removal Verification', () => {
  beforeEach(() => {
    CometChatLocalize.setCurrentLanguage('en-US');
  });

  afterEach(() => {
    CometChatLocalize.setCurrentLanguage('en-US');
  });

  describe('cometchat-fullscreen-viewer', () => {
    it('should resolve "audio_bubble_play" key to a non-empty string without fallback', () => {
      const value = CometChatLocalize.getLocalizedString('audio_bubble_play');
      expect(value).toBeTruthy();
    });

    it('should resolve "audio_bubble_pause" key to a non-empty string without fallback', () => {
      const value = CometChatLocalize.getLocalizedString('audio_bubble_pause');
      expect(value).toBeTruthy();
    });

    it('should resolve "unknown" key to "Unknown" without fallback', () => {
      const value = CometChatLocalize.getLocalizedString('unknown');
      expect(value).toBeTruthy();
      expect(value).toBe('Unknown');
    });
  });

  describe('cometchat-message-preview', () => {
    it('should resolve "accessibility_cancel_edit" key to a non-empty string without fallback', () => {
      expect(CometChatLocalize.getLocalizedString('accessibility_cancel_edit')).toBeTruthy();
    });

    it('should resolve "unknown" key to a non-empty string without fallback', () => {
      expect(CometChatLocalize.getLocalizedString('unknown')).toBeTruthy();
    });
  });

  describe('cometchat-file-bubble', () => {
    it('should resolve file_bubble_unknown_file to "Unknown file"', () => {
      expect(CometChatLocalize.getLocalizedString('file_bubble_unknown_file')).toBe('Unknown file');
    });

    it('should resolve file_bubble_unknown_file to a non-empty string without fallback', () => {
      expect(CometChatLocalize.getLocalizedString('file_bubble_unknown_file')).toBeTruthy();
    });
  });

  describe('cometchat-audio-bubble', () => {
    it('should resolve audio_bubble_audio key to a non-empty string without fallback', () => {
      expect(CometChatLocalize.getLocalizedString('audio_bubble_audio')).toBeTruthy();
    });
  });

  describe('cometchat-message-list', () => {
    it('should resolve "unknown" key to "Unknown" without fallback', () => {
      expect(CometChatLocalize.getLocalizedString('unknown')).toBe('Unknown');
    });

    it('should resolve "unknown" key to a non-empty string without fallback', () => {
      expect(CometChatLocalize.getLocalizedString('unknown')).toBeTruthy();
    });
  });
});

// ============================================================
// Task 9.4: Runtime Language Switching
// _Requirements: 6.2, 6.5_
// ============================================================

describe('Unit Tests: Runtime Language Switching', () => {
  afterEach(() => {
    CometChatLocalize.setCurrentLanguage('en-US');
  });

  it('should return English value when language is en-US', () => {
    CometChatLocalize.setCurrentLanguage('en-US');
    expect(CometChatLocalize.getLocalizedString('action_sheet_aria_label')).toBe('Actions');
  });

  it('should return Spanish value after switching to es', () => {
    CometChatLocalize.setCurrentLanguage('es');
    const value = CometChatLocalize.getLocalizedString('action_sheet_aria_label');
    expect(value).toBeTruthy();
    expect(value).not.toBe('Actions');
  });

  it('should return correct value after switching en-US → es → en-US', () => {
    CometChatLocalize.setCurrentLanguage('en-US');
    const originalValue = CometChatLocalize.getLocalizedString('action_sheet_aria_label');

    CometChatLocalize.setCurrentLanguage('es');
    const spanishValue = CometChatLocalize.getLocalizedString('action_sheet_aria_label');
    expect(spanishValue).not.toBe(originalValue);

    CometChatLocalize.setCurrentLanguage('en-US');
    const restoredValue = CometChatLocalize.getLocalizedString('action_sheet_aria_label');
    expect(restoredValue).toBe(originalValue);
  });

  it('should fall back to en-US for an invalid language code', () => {
    CometChatLocalize.setCurrentLanguage('xx-invalid');
    const value = CometChatLocalize.getLocalizedString('action_sheet_aria_label');
    expect(value).toBe('Actions');
  });

  it('should support parameterized string interpolation for message_composer_replying_to', () => {
    CometChatLocalize.setCurrentLanguage('en-US');
    const template = CometChatLocalize.getLocalizedString('message_composer_replying_to');
    expect(template).toContain('{sender}');

    const interpolated = template.replace('{sender}', 'Alice');
    expect(interpolated).toBe('Replying to Alice');
  });

  it('should support parameterized string interpolation in non-English language', () => {
    CometChatLocalize.setCurrentLanguage('es');
    const template = CometChatLocalize.getLocalizedString('message_composer_replying_to');
    expect(template).toContain('{sender}');

    const interpolated = template.replace('{sender}', 'Alice');
    expect(interpolated).toBe('Respondiendo a Alice');
  });
});

// ============================================================
// Task 9.5: Translation File Completeness
// _Requirements: 6.4, 6.6, 6.7_
// ============================================================

describe('Unit Tests: Translation File Completeness', () => {
  it('should have all 9 audit keys in en-us/translation.json', () => {
    for (const key of auditKeys) {
      expect(key in enUs, `Key "${key}" missing in en-us`).toBe(true);
    }
  });

  it('should have all 9 audit keys in every language file (key parity)', () => {
    for (const [lang, translations] of Object.entries(allLanguageFiles)) {
      for (const key of auditKeys) {
        expect(key in translations, `Key "${key}" missing in ${lang}`).toBe(true);
      }
    }
  });

  it('should have non-empty values for all audit keys in every language file', () => {
    for (const [lang, translations] of Object.entries(allLanguageFiles)) {
      for (const key of auditKeys) {
        const value = translations[key];
        expect(
          typeof value === 'string' && value.length > 0,
          `Key "${key}" has empty or missing value in ${lang}`
        ).toBe(true);
      }
    }
  });

  it('should have all 19 language files loaded', () => {
    expect(Object.keys(allLanguageFiles).length).toBe(19);
  });
});
