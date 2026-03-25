import type { StorybookConfig } from '@storybook/angular';
import * as path from 'path';

const config: StorybookConfig = {
  stories: [
    '../projects/cometchat-uikit/src/lib/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  addons: [
    '@storybook/addon-docs',           // MDX documentation support
    '@storybook/addon-a11y',           // Accessibility testing
    '@chromatic-com/storybook',        // Visual regression testing (optional)
  ],

  framework: {
    name: '@storybook/angular',
    options: {},
  },

  staticDirs: [
    { from: '../projects/cometchat-uikit/src/lib/assets', to: '/assets' },
    { from: '../projects/cometchat-uikit/src/lib/styles', to: '/styles' },
    { from: '../projects/sample-app/src/assets', to: '/sample-assets' },
    { from: '../.storybook/avatars', to: '/avatars' },
    { from: '../.storybook/audio', to: '/audio' },
  ],

  core: {
    disableTelemetry: true,
  },

  webpackFinal: async (config) => {
    // Fix Babel runtime resolution issue
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@babel/runtime': path.resolve(process.cwd(), 'node_modules/@babel/runtime'),
      };

      // Polyfill Node.js core modules used by @cometchat/calls-sdk-javascript
      config.resolve.fallback = {
        ...config.resolve.fallback,
        path: false,
        fs: false,
      };
    }

    // Add CSS loader for @cometchat/calls-sdk-javascript which imports CSS directly
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.css$/,
      include: /node_modules\/@cometchat\/calls-sdk-javascript/,
      use: ['style-loader', 'css-loader'],
    });

    // Performance optimizations
    if (config.optimization) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            baseElements: {
              test: /[\\/]base-elements[\\/].*\.stories\./,
              name: 'stories-base-elements',
              priority: 5,
              reuseExistingChunk: true,
            },
            components: {
              test: /[\\/]components[\\/].*\.stories\./,
              name: 'stories-components',
              priority: 5,
              reuseExistingChunk: true,
            },
            common: {
              minChunks: 2,
              priority: 3,
              reuseExistingChunk: true,
            },
          },
        },
        runtimeChunk: 'single',
      };
    }

    // Enable caching for faster rebuilds
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [path.resolve(process.cwd(), '.storybook/main.ts')],
      },
      cacheDirectory: path.resolve(process.cwd(), 'node_modules/.cache/storybook'),
    };

    return config;
  },
};

export default config;
