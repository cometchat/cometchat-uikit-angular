import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  CometChatSearchFilter,
  CometChatSearchScope,
} from '../../Enums/Enums';
import {
  getAvailableFilters,
  getVisibleFilters,
  toggleFilter,
  shouldRenderConversations,
  shouldRenderMessages,
  hasValidSearchCriteria,
  hasValidMessageSearchCriteria,
} from './search-filter.utils';

// --- Domain generators ---

const allFilters: CometChatSearchFilter[] = [
  CometChatSearchFilter.Messages,
  CometChatSearchFilter.Conversations,
  CometChatSearchFilter.Unread,
  CometChatSearchFilter.Groups,
  CometChatSearchFilter.Photos,
  CometChatSearchFilter.Videos,
  CometChatSearchFilter.Links,
  CometChatSearchFilter.Documents,
  CometChatSearchFilter.Audio,
];

const allScopes: CometChatSearchScope[] = [
  CometChatSearchScope.Conversations,
  CometChatSearchScope.Messages,
];

const filterArb = fc.constantFrom(...allFilters);
const filterSubsetArb = fc.subarray(allFilters, { minLength: 0 });
const scopeSubsetArb = fc.subarray(allScopes, { minLength: 0 });
const searchTextArb = fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 50 }));

describe('search-filter.utils — property-based tests', () => {
  // FP-01: Double-toggle is identity (simple add/remove)
  it('FP-01: toggleFilter(toggleFilter(filters, id), id) restores original state', () => {
    fc.assert(
      fc.property(filterSubsetArb, filterArb, (active, filterId) => {
        const toggled = toggleFilter(active, filterId);
        const doubleToggled = toggleFilter(toggled, filterId);
        // Double toggle should restore the original presence/absence
        expect(doubleToggled.includes(filterId)).toBe(active.includes(filterId));
        // Length should match original
        expect(doubleToggled.length).toBe(active.length);
      })
    );
  });

  // FP-02: getAvailableFilters output is subset of input searchFilters
  it('FP-02: available filters are always a subset of searchFilters', () => {
    fc.assert(
      fc.property(scopeSubsetArb, filterSubsetArb, (scopes, filters) => {
        const result = getAvailableFilters(scopes, filters);
        result.forEach((f) => expect(filters).toContain(f));
      })
    );
  });

  // FP-03: getVisibleFilters output is subset of available
  it('FP-03: visible filters are always a subset of available', () => {
    fc.assert(
      fc.property(
        filterSubsetArb,
        filterSubsetArb,
        scopeSubsetArb,
        (available, active, scopes) => {
          const result = getVisibleFilters(available, active, undefined, undefined, scopes);
          result.forEach((f) => expect(available).toContain(f));
        }
      )
    );
  });

  // FP-04: When Links is the only active content filter, visible filters show only Links
  it('FP-04: selecting Links hides other content filters from visible', () => {
    const available = allFilters;
    const active = [CometChatSearchFilter.Links];
    const visible = getVisibleFilters(available, active);
    // Should only contain Links (no Photos, Videos, Documents, Audio)
    expect(visible).toContain(CometChatSearchFilter.Links);
    expect(visible).not.toContain(CometChatSearchFilter.Photos);
    expect(visible).not.toContain(CometChatSearchFilter.Videos);
    expect(visible).not.toContain(CometChatSearchFilter.Documents);
    expect(visible).not.toContain(CometChatSearchFilter.Audio);
  });

  // FP-05: Conversation filters are all visible when one is selected
  it('FP-05: selecting a conversation filter shows all conversation filters', () => {
    const available = allFilters;
    const convFilters = [CometChatSearchFilter.Conversations, CometChatSearchFilter.Unread, CometChatSearchFilter.Groups];

    for (const cf of convFilters) {
      const visible = getVisibleFilters(available, [cf]);
      // All conversation filters should be visible
      for (const expected of convFilters) {
        expect(visible).toContain(expected);
      }
      // No message filters should be visible
      expect(visible).not.toContain(CometChatSearchFilter.Photos);
    }
  });

  // FP-08: shouldRenderConversations returns false when uid or guid is set
  it('FP-08: conversations never render when uid/guid is set', () => {
    fc.assert(
      fc.property(
        searchTextArb,
        filterSubsetArb,
        scopeSubsetArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        (text, filters, scopes, uid) => {
          expect(shouldRenderConversations(text, filters, scopes, uid)).toBe(false);
        }
      )
    );
  });

  // FP-09: shouldRenderMessages returns true when uid/guid is set (and scope includes Messages)
  it('FP-09: messages always render when uid/guid is set and scope includes Messages', () => {
    fc.assert(
      fc.property(
        searchTextArb,
        filterSubsetArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        (text, filters, uid) => {
          expect(shouldRenderMessages(text, filters, [], uid)).toBe(true);
        }
      )
    );
  });

  // VP-01: hasValidSearchCriteria returns true for any non-whitespace keyword
  it('VP-01: non-whitespace keyword always yields valid search criteria', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        filterSubsetArb,
        (keyword, filters) => {
          expect(hasValidSearchCriteria(keyword, filters)).toBe(true);
        }
      )
    );
  });

  // VP-02: hasValidSearchCriteria returns false for empty keyword AND empty filters
  it('VP-02: empty keyword + empty filters = invalid criteria', () => {
    expect(hasValidSearchCriteria('', [])).toBe(false);
    expect(hasValidSearchCriteria('   ', [])).toBe(false);
  });

  // VP-03: hasValidMessageSearchCriteria returns true when uid or guid is set
  it('VP-03: uid/guid always yields valid message search criteria', () => {
    fc.assert(
      fc.property(
        searchTextArb,
        filterSubsetArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        (text, filters, uid) => {
          expect(hasValidMessageSearchCriteria(text, filters, uid)).toBe(true);
        }
      )
    );
  });
});
