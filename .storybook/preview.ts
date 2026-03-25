import type { Preview } from '@storybook/angular';
import { withTheme } from './decorators/theme.decorator';
import { withLocale } from './decorators/locale.decorator';

const preview: Preview = {
  parameters: {
    layout: 'centered',
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
