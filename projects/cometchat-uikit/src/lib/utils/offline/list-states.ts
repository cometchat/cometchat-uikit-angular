/**
 * Offline list states (D84). A list read offline with nothing on screen is one of two
 * kit states, never an error that needs Retry:
 * - "Connect to search": the request carries a search keyword (the search box, or a
 *   builder with one). A keyword has no saved copy, so the search cannot run offline;
 *   it is an offline state, so it fires no `error`.
 * - "Connect to load ...": any other list, including one opened with only a filter
 *   (online users, tags, a builder without a keyword). The list is in the error state,
 *   `error` fires once, and the kit shows its offline state in place of the error view
 *   (the app's own error view still wins). No Retry button.
 *
 * @internal
 */

/** The search keyword the SDK request carries, or `''`. */
export function requestSearchKeyword(request: unknown): string {
  const r = request as { getSearchKeyword?: () => unknown; searchKeyword?: unknown } | null | undefined;
  let keyword: unknown;
  try {
    keyword = typeof r?.getSearchKeyword === 'function' ? r.getSearchKeyword() : r?.searchKeyword;
  } catch {
    keyword = r?.searchKeyword;
  }
  return typeof keyword === 'string' ? keyword : '';
}

/**
 * Whether a read is a keyword search: the SDK request carries a keyword, or the list's own
 * search box / `searchKeyword` input does. A filter alone is not a search.
 */
export function isKeywordSearch(request: unknown, ...listKeywords: (string | null | undefined)[]): boolean {
  return requestSearchKeyword(request) !== '' || listKeywords.some(k => !!k);
}

/** What a list shows when a read failed with nothing on screen. */
export type OfflineListState = 'none' | 'connect_to_load' | 'connect_to_search';

/**
 * The state for a read that failed with nothing on screen. `notConnected` is the SDK's
 * not-connected failure; any other failure is a real error (`none`: the error view).
 */
export function offlineStateFor(notConnected: boolean, keywordSearch: boolean): OfflineListState {
  if (!notConnected) return 'none';
  return keywordSearch ? 'connect_to_search' : 'connect_to_load';
}
