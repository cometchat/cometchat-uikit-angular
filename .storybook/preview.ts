import type { Preview } from '@storybook/angular';
import { withTheme } from './decorators/theme.decorator';
import { withLocale } from './decorators/locale.decorator';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    // CI 4 storybook-test-runner (ENG-40484): an axe violation fails the story's test.
    // Rule ratchet: these rules already fail across the library (first runs, 24-25 Oct 2026: 74 of
    // 85 story files; ENG-40611) and are tracked as accessibility debt. They are off so every OTHER rule
    // blocks today; switch each one back on once its violations are fixed. Never add a rule here.
    a11y: {
      test: 'error',
      config: {
        rules: [
          { id: 'color-contrast', enabled: false }, // 221 violations
          { id: 'aria-allowed-attr', enabled: false }, // 78
          { id: 'aria-required-children', enabled: false }, // 60
          { id: 'aria-required-parent', enabled: false }, // 37
          { id: 'aria-input-field-name', enabled: false }, // 24
          { id: 'aria-prohibited-attr', enabled: false }, // 11
          { id: 'nested-interactive', enabled: false }, // 4
          { id: 'aria-progressbar-name', enabled: false }, // 3
          { id: 'scrollable-region-focusable', enabled: false }, // 2
          { id: 'button-name', enabled: false }, // 1
          { id: 'aria-conditional-attr', enabled: false }, // 1
          { id: 'landmark-unique', enabled: false }, // 102 (seen once the rules above were off)
          { id: 'landmark-no-duplicate-banner', enabled: false }, // 2
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    docs: {
      toc: true,
    },
    options: {
      storySort: {
        order: [
          'Components',
          [
            'Conversations',
            'Messages',
            'Bubbles',
            'Users',
            'Groups',
            'Calls',
            'AI',
            'Misc',
          ],
          'Base Elements',
        ],
      },
    },
    backgrounds: {
      disable: true, // Disable default backgrounds since we use theme switching
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
  },
  decorators: [withTheme, withLocale],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'en-US',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en-US', title: 'English (US)' },
          { value: 'en-GB', title: 'English (GB)' },
          { value: 'de',    title: 'Deutsch' },
          { value: 'es',    title: 'Español' },
          { value: 'fr',    title: 'Français' },
          { value: 'hi',    title: 'हिन्दी' },
          { value: 'hu',    title: 'Magyar' },
          { value: 'it',    title: 'Italiano' },
          { value: 'ja',    title: '日本語' },
          { value: 'ko',    title: '한국어' },
          { value: 'lt',    title: 'Lietuvių' },
          { value: 'ms',    title: 'Bahasa Melayu' },
          { value: 'nl',    title: 'Nederlands' },
          { value: 'pt',    title: 'Português' },
          { value: 'ru',    title: 'Русский' },
          { value: 'sv',    title: 'Svenska' },
          { value: 'tr',    title: 'Türkçe' },
          { value: 'zh',    title: '中文 (简体)' },
          { value: 'zh-TW', title: '中文 (繁體)' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
