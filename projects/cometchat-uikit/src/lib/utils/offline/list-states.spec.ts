/** D84: which offline state a failed read with nothing on screen is, and what counts as a keyword search. */
import { describe, expect, it } from 'vitest';
import { isKeywordSearch, offlineStateFor, requestSearchKeyword } from './list-states';

describe('requestSearchKeyword', () => {
  it('reads the keyword the SDK request carries', () => {
    expect(requestSearchKeyword({ getSearchKeyword: () => 'sam' })).toBe('sam');
    expect(requestSearchKeyword({ searchKeyword: 'sam' })).toBe('sam');
  });

  it('is empty for a request without one, a missing request, or a getter that throws or answers a non-string', () => {
    expect(requestSearchKeyword({ getSearchKeyword: () => '' })).toBe('');
    expect(requestSearchKeyword({})).toBe('');
    expect(requestSearchKeyword(null)).toBe('');
    expect(requestSearchKeyword(undefined)).toBe('');
    expect(requestSearchKeyword({ getSearchKeyword: () => undefined })).toBe('');
    expect(
      requestSearchKeyword({
        getSearchKeyword: () => {
          throw new Error('x');
        },
        searchKeyword: 'fallback',
      })
    ).toBe('fallback');
  });
});

describe('isKeywordSearch (D84 addition B)', () => {
  it('a filter alone is not a search', () => {
    expect(isKeywordSearch({ getSearchKeyword: () => '' })).toBe(false);
    expect(isKeywordSearch({}, '', undefined, null)).toBe(false);
  });

  it('a keyword on the request, or in the list\'s own search box or input, is a search', () => {
    expect(isKeywordSearch({ getSearchKeyword: () => 'sam' })).toBe(true);
    expect(isKeywordSearch({}, 'sam')).toBe(true);
    expect(isKeywordSearch({}, '', 'sam')).toBe(true);
  });
});

describe('offlineStateFor', () => {
  it('a real error is no offline state', () => {
    expect(offlineStateFor(false, false)).toBe('none');
    expect(offlineStateFor(false, true)).toBe('none');
  });

  it('not connected: "Connect to search" for a keyword search, "Connect to load" for anything else', () => {
    expect(offlineStateFor(true, true)).toBe('connect_to_search');
    expect(offlineStateFor(true, false)).toBe('connect_to_load');
  });
});
