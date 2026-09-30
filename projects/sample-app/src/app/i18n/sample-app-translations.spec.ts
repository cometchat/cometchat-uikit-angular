/**
 * Guard: the sample app's own translations are complete in every language.
 *
 * The sample app registers `sampleAppTranslations` on top of the UI Kit's
 * bundles, so a key it references may live in either place. Two gaps had opened
 * silently before this guard existed (ENG-39096):
 *
 *  - 14 keys existed only in `en.json`, so every other language fell back to
 *    English for them — including four group toasts.
 *  - Six keys the sample app referenced lived only in the kit's `en-us` bundle.
 *
 * Neither showed up as a crash: `getLocalizedString()` falls back, and
 * `TranslatePipe` renders the raw key. Only reading the UI in a non-English
 * locale revealed them, which is exactly what a test should do instead.
 *
 * @module i18n/sample-app-translations
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const I18N_DIR = __dirname;
const APP_DIR = path.resolve(__dirname, '..');
const KIT_RESOURCES = path.resolve(
  __dirname,
  '../../../../cometchat-uikit/src/lib/resources/CometChatLocalize/resources'
);

/** Sample-app locale file → UI Kit resource directory. */
const LOCALES: Record<string, string> = {
  'en.json': 'en-us',
  'de.json': 'de',
  'es.json': 'es',
  'fr.json': 'fr',
  'hi.json': 'hi',
  'hu.json': 'hu',
  'it.json': 'it',
  'ja.json': 'ja',
  'ko.json': 'ko',
  'lt.json': 'lt',
  'ms.json': 'ms',
  'nl.json': 'nl',
  'pt.json': 'pt',
  'ru.json': 'ru',
  'sv.json': 'sv',
  'tr.json': 'tr',
  'zh.json': 'zh',
  'zh-tw.json': 'zh-tw',
};

/** `en-GB` reuses `en.json` but has its own kit bundle, so it is checked too. */
const EXTRA_KIT_LOCALES: Record<string, string> = { 'en.json': 'en-gb' };

function readJson(file: string): Record<string, string> {
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, string>;
}

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (/\.(ts|html)$/.test(entry.name) && !/\.spec\.ts$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Every localization key the sample app asks for at runtime.
 *
 * Three reference shapes are in use: the `| translate` pipe in templates,
 * `getLocalizedString('key')` in TypeScript, and `labelKey: 'key'` on the tab
 * definitions, which the tabs component resolves itself.
 */
function collectReferencedKeys(): Map<string, string[]> {
  const patterns = [
    /'([a-z0-9_]{3,})'\s*\|\s*translate/g,
    /getLocalizedString\(\s*'([a-z0-9_]{3,})'/g,
    /labelKey\s*:\s*'([a-z0-9_]{3,})'/g,
  ];
  const refs = new Map<string, string[]>();
  for (const file of listSourceFiles(APP_DIR)) {
    const source = fs.readFileSync(file, 'utf-8');
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(source)) !== null) {
        const where = path.relative(APP_DIR, file);
        const seen = refs.get(match[1]) ?? [];
        if (!seen.includes(where)) seen.push(where);
        refs.set(match[1], seen);
      }
    }
  }
  return refs;
}

const referencedKeys = collectReferencedKeys();
const englishKeys = Object.keys(readJson(path.join(I18N_DIR, 'en.json')));

describe('sample-app translations', () => {
  it('finds the keys the sample app references', () => {
    // A rewrite that breaks the regexes would otherwise make this file pass vacuously.
    expect(referencedKeys.size).toBeGreaterThan(50);
  });

  it('every locale file holds exactly the keys en.json holds', () => {
    const problems: string[] = [];
    for (const file of Object.keys(LOCALES)) {
      if (file === 'en.json') continue;
      const translations = readJson(path.join(I18N_DIR, file));
      const missing = englishKeys.filter((key) => !translations[key]?.trim());
      const extra = Object.keys(translations).filter((key) => !englishKeys.includes(key));
      if (missing.length) problems.push(`${file} is missing: ${missing.join(', ')}`);
      if (extra.length) problems.push(`${file} has keys en.json does not: ${extra.join(', ')}`);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('every referenced key resolves in every language', () => {
    const problems: string[] = [];
    const pairs: Array<[string, string]> = [
      ...Object.entries(LOCALES),
      ...Object.entries(EXTRA_KIT_LOCALES),
    ];
    for (const [sampleFile, kitDir] of pairs) {
      const sample = readJson(path.join(I18N_DIR, sampleFile));
      const kit = readJson(path.join(KIT_RESOURCES, kitDir, 'translation.json'));
      for (const [key, where] of referencedKeys) {
        // An empty string counts as unresolved: getLocalizedString() treats it
        // as missing and silently falls through to the fallback language.
        if (sample[key]?.trim() || kit[key]?.trim()) continue;
        problems.push(`${kitDir}: "${key}" (referenced by ${where.join(', ')})`);
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
});
