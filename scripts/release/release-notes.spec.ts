// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { notesProblems, releaseNotes } from './release-notes.mjs';

// The description of #592 (v5.2.2), as GitHub stores it: CRLF line endings.
const V522 = [
  '## New',
  '- None',
  '',
  '## Enhancements',
  '- None',
  '',
  '## Fixes',
  '- Fixed localization across the UI Kit so that all supported strings, dates, times, and durations display correctly in every supported language.',
].join('\r\n');

describe('releaseNotes', () => {
  it('normalises line endings and trims', () => {
    expect(releaseNotes(`\r\n${V522}\r\n\r\n`)).toBe(V522.replace(/\r\n/g, '\n'));
  });

  it('drops HTML comments, which are notes to the author', () => {
    expect(releaseNotes('<!-- fill in, see ENG-123 -->\n## New\n- A <!-- inline -->thing')).toBe('## New\n- A thing');
  });

  it('is empty for a missing description', () => {
    expect(releaseNotes(null)).toBe('');
    expect(releaseNotes(undefined)).toBe('');
  });
});

describe('notesProblems', () => {
  it('accepts the v5.2.2 and v5.2.1 descriptions as they were published', () => {
    expect(notesProblems(V522)).toEqual([]);
    expect(notesProblems('# v5.2.1\n\n## New\n- None\n\n## Enhancements\n- None\n\n## Fixes\n- Fixed the link dialog.')).toEqual([]);
  });

  it('accepts level-1 headings, as in the v5.2.0 description', () => {
    expect(notesProblems('# New\n- A\n# Enhancements\n- None\n# Fixes\n- None')).toEqual([]);
  });

  it('refuses an empty description, or one with only comments', () => {
    expect(notesProblems('')).toEqual(['The description is empty.']);
    expect(notesProblems(null)).toEqual(['The description is empty.']);
    expect(notesProblems('  <!-- template -->  ')).toEqual(['The description is empty.']);
  });

  it('names the missing section headings', () => {
    const [problem] = notesProblems('## New\n- A thing\n\nFixes: the composer.');
    expect(problem).toContain('"## Enhancements", "## Fixes"');
    expect(problem).toContain('- None');
  });

  it('wants headings, not the words somewhere in the text', () => {
    expect(notesProblems('New enhancements and fixes for the composer.')).toHaveLength(1);
  });

  it('refuses internal ticket IDs, with the line', () => {
    const problems = notesProblems(`${V522}\r\n- Fixed the pin cap (ENG-40541).`);
    expect(problems).toEqual(['Line 9 has an internal ticket ID (ENG-40541): - Fixed the pin cap (ENG-40541).']);
  });

  it('refuses links to private cometchat-team repos', () => {
    const problems = notesProblems(`${V522}\n- See https://github.com/cometchat-team/uikit-angular/pull/632`);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('a link to a private cometchat-team repo');
  });

  it('does not flag words that only look alike, or public links', () => {
    expect(notesProblems(`${V522}\n- Length-1 lists and https://github.com/cometchat/cometchat-uikit-angular work.`)).toEqual([]);
  });

  it('refuses Linear links and Claude Code session links', () => {
    const problems = notesProblems(
      `${V522}\n- Plan: https://linear.app/cometchat/document/release-plan-1a2b\n\nhttps://claude.ai/code/session_01SrArYbJhdFHRuA6hZkdoPM`
    );
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain('a Linear link');
    expect(problems[1]).toContain('a link to a Claude Code session');
  });

  it('refuses a bare #number, which would link to an unrelated public issue', () => {
    for (const line of ['- Fixed the composer (#666).', '- #12 fixed', '- Fixes #9, #10']) {
      const [problem] = notesProblems(`${V522}\n${line}`);
      expect(problem).toContain('a bare #number');
    }
  });

  it('allows a # that names what it means, and headings', () => {
    const notes = `${V522}\n- See cometchat/cometchat-uikit-angular#12, docs#3 and &#169; 2026.\n\n### Notes\n- None`;
    expect(notesProblems(notes)).toEqual([]);
  });

  it('ignores internal references inside comments, which are not published', () => {
    expect(notesProblems(`<!-- ENG-40541 -->\n${V522}`)).toEqual([]);
  });
});
