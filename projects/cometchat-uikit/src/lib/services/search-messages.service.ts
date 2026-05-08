import { Injectable, signal, WritableSignal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchFilter, States } from '../Enums/Enums';
import { hasValidMessageSearchCriteria } from '../components/cometchat-search/search-filter.utils';

/**
 * Service managing message search state and SDK queries.
 * Injected into CometChatSearchMessagesListComponent.
 */
@Injectable({ providedIn: 'root' })
export class SearchMessagesService {
  /** Current message results */
  readonly messages: WritableSignal<CometChat.BaseMessage[]> = signal<CometChat.BaseMessage[]>([]);
  /** Current fetch state */
  readonly fetchState: WritableSignal<States> = signal<States>(States.loaded);
  /** Whether more pages exist */
  readonly hasMoreResults: WritableSignal<boolean> = signal<boolean>(false);

  private searchRequest: CometChat.MessagesRequest | null = null;
  private isLoadingMore = false;

  /**
   * Initiate a message search with the given criteria.
   */
  async search(
    keyword: string,
    filters: CometChatSearchFilter[],
    uid?: string,
    guid?: string,
    customBuilder?: CometChat.MessagesRequestBuilder,
    alwaysShowSeeMore = false
  ): Promise<void> {
    this.fetchState.set(States.loading);
    this.messages.set([]);
    this.hasMoreResults.set(false);

    if (!hasValidMessageSearchCriteria(keyword, filters, uid, guid)) {
      this.fetchState.set(States.empty);
      return;
    }

    try {
      this.searchRequest = this.buildRequest(
        keyword,
        filters,
        uid,
        guid,
        customBuilder,
        alwaysShowSeeMore
      );
      const limit = alwaysShowSeeMore ? 3 : 30;
      const results = await this.searchRequest.fetchPrevious();

      if (results.length > 0) {
        this.messages.set(results.reverse());
        this.fetchState.set(States.loaded);
        this.hasMoreResults.set(results.length >= limit);
      } else {
        this.fetchState.set(States.empty);
        this.hasMoreResults.set(false);
      }
    } catch (error) {
      this.fetchState.set(States.error);
      throw error;
    }
  }

  /**
   * Load the next page of results.
   */
  async loadMore(): Promise<void> {
    if (this.isLoadingMore || !this.searchRequest) {
      return;
    }
    this.isLoadingMore = true;

    try {
      const results = await this.searchRequest.fetchPrevious();
      if (results.length > 0) {
        this.messages.update(prev => [...prev, ...results.reverse()]);
        const limit = 30;
        this.hasMoreResults.set(results.length >= limit);
      } else {
        this.hasMoreResults.set(false);
      }
    } finally {
      this.isLoadingMore = false;
    }
  }

  /** Reset all state. */
  reset(): void {
    this.messages.set([]);
    this.fetchState.set(States.loaded);
    this.hasMoreResults.set(false);
    this.searchRequest = null;
    this.isLoadingMore = false;
  }

  /**
   * Build a MessagesRequest based on search criteria and filters.
   */
  private buildRequest(
    keyword: string,
    filters: CometChatSearchFilter[],
    uid?: string,
    guid?: string,
    customBuilder?: CometChat.MessagesRequestBuilder,
    alwaysShowSeeMore = false
  ): CometChat.MessagesRequest {
    let builder = customBuilder ? customBuilder : new CometChat.MessagesRequestBuilder();

    builder.hideDeletedMessages(true);
    const limit = alwaysShowSeeMore ? 3 : 30;

    if (!customBuilder) {
      builder = builder.setLimit(limit);
    }

    if (keyword.trim() !== '') {
      builder = builder.setSearchKeyword(keyword);
    }
    if (uid) {
      builder = builder.setUID(uid);
    }
    if (guid) {
      builder = builder.setGUID(guid);
    }

    // Apply filter-specific attachment types (matching React UIKit approach)
    if (filters.length > 0) {
      if (filters.includes(CometChatSearchFilter.Links)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        builder = (builder as any).hasLinks(true);
      }

      const attachmentTypeMap: Partial<Record<CometChatSearchFilter, CometChat.AttachmentType>> = {
        [CometChatSearchFilter.Photos]: CometChat.AttachmentType.IMAGE,
        [CometChatSearchFilter.Videos]: CometChat.AttachmentType.VIDEO,
        [CometChatSearchFilter.Documents]: CometChat.AttachmentType.FILE,
        [CometChatSearchFilter.Audio]: CometChat.AttachmentType.AUDIO,
      };

      for (const [filter, attachmentType] of Object.entries(attachmentTypeMap)) {
        if (filters.includes(filter as CometChatSearchFilter)) {
          builder = builder.setAttachmentTypes([attachmentType as CometChat.AttachmentType]);
          break;
        }
      }
    }

    return builder.build();
  }
}
