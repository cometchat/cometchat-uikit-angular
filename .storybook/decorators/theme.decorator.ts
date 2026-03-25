/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Theme decorator for Storybook stories.
 *
 * Applies the data-theme attribute to document root, body, and Storybook
 * elements to enable CSS variable theming for light/dark mode switching.
 */

// Load CSS variables on first run
let cssLoaded = false;

function loadCssVariables(): void {
  if (cssLoaded) return;

  const cssStyleId = 'cometchat-css-variables';
  if (!document.getElementById(cssStyleId)) {
    const link = document.createElement('link');
    link.id = cssStyleId;
    link.rel = 'stylesheet';
    link.href = '/styles/css-variables.css';
    document.head.appendChild(link);
  }
  cssLoaded = true;
}

export const withTheme = (storyFn: any, context: any): any => {
  const theme = context.globals?.theme || 'light';

  loadCssVariables();

  // Apply theme to document root and body
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
  document.body.classList.remove('light-theme', 'dark-theme');
  document.body.classList.add(`${theme}-theme`);

  // Apply to Storybook root
  const storybookRoot = document.getElementById('storybook-root');
  if (storybookRoot) {
    storybookRoot.setAttribute('data-theme', theme);
  }

  // Apply to Storybook main content area
  const sbMain = document.querySelector('.sb-show-main');
  if (sbMain) {
    sbMain.setAttribute('data-theme', theme);
  }

  // Apply to docs wrapper and story blocks
  const sbdocsWrapper = document.querySelector('.sbdocs-wrapper');
  if (sbdocsWrapper) {
    sbdocsWrapper.setAttribute('data-theme', theme);
  }

  document.querySelectorAll('.docs-story').forEach(el => {
    el.setAttribute('data-theme', theme);
  });

  // Set background color
  const bg = theme === 'dark' ? '#1a1a1a' : '#e8e8e8';
  document.body.style.backgroundColor = bg;
  if (storybookRoot) {
    storybookRoot.style.backgroundColor = bg;
  }

  // Colour the story preview blocks inside docs
  document.querySelectorAll('.docs-story').forEach((el) => {
    (el as HTMLElement).style.backgroundColor = bg;
  });

  return storyFn();
};
