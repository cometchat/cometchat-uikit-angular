/**
 * Utility helpers for MessageComposerService.
 * Contains error handling, mention fetching observables, and pagination helpers.
 */

import { Observable } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';
import type { ErrorCallback, MentionSuggestion } from './message-composer.types';
import { isOfflineOn } from '../utils/offline/offline-gate';
import { fetchNextTwoPhase } from '../utils/offline/two-phase';

// ─── Error Helpers ────────────────────────────────────────────────────────────

export function toCometchatException(error: unknown, context: string): CometChat.CometChatException {
  if (error instanceof CometChat.CometChatException) return error;
  if (error instanceof Error) {
    return new CometChat.CometChatException({
      code: 'COMPOSER_ERROR',
      message: `${context}: ${error.message}`,
      details: error.stack || '',
    });
  }
  return new CometChat.CometChatException({
    code: 'UNKNOWN_ERROR',
    message: `${context}: ${String(error)}`,
    details: '',
  });
}

export function handleComposerError(
  error: unknown,
  context: string,
  errorCallback: ErrorCallback | null
): void {
  CometChatLogger.error('MessageComposerService', `${context}:`, error);
  if (errorCallback) {
    errorCallback(toCometchatException(error, context));
  }
}

// ─── Receiver Helpers ─────────────────────────────────────────────────────────

export function getReceiverId(receiver: CometChat.User | CometChat.Group): string {
  return receiver instanceof CometChat.User ? receiver.getUid() : receiver.getGuid();
}

export function getReceiverType(receiver: CometChat.User | CometChat.Group): string {
  return receiver instanceof CometChat.User
    ? CometChat.RECEIVER_TYPE.USER
    : CometChat.RECEIVER_TYPE.GROUP;
}

// ─── Mention Fetch Observables ────────────────────────────────────────────────

/**
 * Fetch users for mention suggestions as an Observable.
 */
export function fetchUsersForMention(
  searchText: string,
  customRequestBuilder?: CometChat.UsersRequestBuilder
): Observable<MentionSuggestion[]> {
  return new Observable<MentionSuggestion[]>(observer => {
    let requestBuilder: CometChat.UsersRequestBuilder;
    if (customRequestBuilder) {
      requestBuilder = searchText
        ? customRequestBuilder.setSearchKeyword(searchText)
        : customRequestBuilder;
    } else {
      requestBuilder = new CometChat.UsersRequestBuilder().setLimit(20);
      if (searchText) requestBuilder = requestBuilder.setSearchKeyword(searchText);
    }

    const toSuggestions = (users: CometChat.User[]): MentionSuggestion[] =>
      users.map(user => ({
        uid: user.getUid(),
        name: user.getName(),
        avatar: user.getAvatar(),
        isAllMention: false,
        entity: user,
      }));

    // Offline on, no keyword: the cached people first, then the server's (a keyword has no cache).
    if (isOfflineOn() && !searchText) {
      let emitted = false;
      void fetchNextTwoPhase<CometChat.User>(requestBuilder.build(), 'users', {
        onCached: page => { if (page.length > 0) { emitted = true; observer.next(toSuggestions(page)); } },
        onServer: page => { observer.next(toSuggestions(page)); observer.complete(); },
        onError: (error, notConnected) => {
          if (!notConnected) { observer.error(error); return; }
          // Offline past the cache: keep what was shown, no error toast.
          if (!emitted) observer.next([]);
          observer.complete();
        },
      });
      return;
    }

    requestBuilder
      .build()
      .fetchNext()
      .then((users: CometChat.User[]) => {
        observer.next(toSuggestions(users));
        observer.complete();
      })
      .catch((error: unknown) => observer.error(error));
  });
}

/**
 * Fetch group members for mention suggestions as an Observable.
 */
export function fetchGroupMembersForMention(
  group: CometChat.Group,
  searchText: string,
  customRequestBuilder?: CometChat.GroupMembersRequestBuilder,
  disableMentionAll = false,
  mentionAllLabel = 'all'
): Observable<MentionSuggestion[]> {
  return new Observable<MentionSuggestion[]>(observer => {
    let requestBuilder: CometChat.GroupMembersRequestBuilder;
    if (customRequestBuilder) {
      requestBuilder = searchText
        ? customRequestBuilder.setSearchKeyword(searchText)
        : customRequestBuilder;
    } else {
      requestBuilder = new CometChat.GroupMembersRequestBuilder(group.getGuid()).setLimit(20);
      if (searchText) requestBuilder = requestBuilder.setSearchKeyword(searchText);
    }

    const toSuggestions = (members: CometChat.GroupMember[]): MentionSuggestion[] => {
      const suggestions: MentionSuggestion[] = [];

      if (
        !disableMentionAll &&
        (!searchText || mentionAllLabel.toLowerCase().includes(searchText.toLowerCase()))
      ) {
        suggestions.push({ uid: 'all', name: mentionAllLabel, isAllMention: true });
      }

      members.forEach(member => {
        suggestions.push({
          uid: member.getUid(),
          name: member.getName(),
          avatar: member.getAvatar(),
          isAllMention: false,
          entity: member,
        });
      });
      return suggestions;
    };

    // Offline on, no keyword: the cached members first, then the server's (a keyword has no cache).
    if (isOfflineOn() && !searchText) {
      let emitted = false;
      void fetchNextTwoPhase<CometChat.GroupMember>(requestBuilder.build(), 'groupMembers', {
        onCached: page => { if (page.length > 0) { emitted = true; observer.next(toSuggestions(page)); } },
        onServer: page => { observer.next(toSuggestions(page)); observer.complete(); },
        onError: (error, notConnected) => {
          if (!notConnected) { observer.error(error); return; }
          // Offline past the cache: keep what was shown, no error toast.
          if (!emitted) observer.next(toSuggestions([]));
          observer.complete();
        },
      });
      return;
    }

    requestBuilder
      .build()
      .fetchNext()
      .then((members: CometChat.GroupMember[]) => {
        observer.next(toSuggestions(members));
        observer.complete();
      })
      .catch((error: unknown) => observer.error(error));
  });
}

// ─── Pagination Request Builder ───────────────────────────────────────────────

/**
 * Build a pagination request for mentions (users or group members).
 * Returns the built request object ready for fetchNext() calls.
 */
export function buildMentionsPaginationRequest(
  searchText: string,
  group?: CometChat.Group,
  customUsersRequestBuilder?: CometChat.UsersRequestBuilder,
  customGroupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder
): CometChat.UsersRequest | CometChat.GroupMembersRequest {
  if (group) {
    let builder: CometChat.GroupMembersRequestBuilder;
    if (customGroupMembersRequestBuilder) {
      builder = searchText
        ? customGroupMembersRequestBuilder.setSearchKeyword(searchText)
        : customGroupMembersRequestBuilder;
    } else {
      builder = new CometChat.GroupMembersRequestBuilder(group.getGuid()).setLimit(20);
      if (searchText) builder = builder.setSearchKeyword(searchText);
    }
    return builder.build();
  } else {
    let builder: CometChat.UsersRequestBuilder;
    if (customUsersRequestBuilder) {
      builder = searchText
        ? customUsersRequestBuilder.setSearchKeyword(searchText)
        : customUsersRequestBuilder;
    } else {
      builder = new CometChat.UsersRequestBuilder().setLimit(20);
      if (searchText) builder = builder.setSearchKeyword(searchText);
    }
    return builder.build();
  }
}

/**
 * Convert raw fetchNext() results to MentionSuggestion array.
 */
export function resultsToMentionSuggestions(
  results: CometChat.User[] | CometChat.GroupMember[],
  isGroupContext: boolean
): MentionSuggestion[] {
  if (isGroupContext) {
    return (results as CometChat.GroupMember[]).map(member => ({
      uid: member.getUid(),
      name: member.getName(),
      avatar: member.getAvatar(),
      isAllMention: false,
      entity: member,
    }));
  }
  return (results as CometChat.User[]).map(user => ({
    uid: user.getUid(),
    name: user.getName(),
    avatar: user.getAvatar(),
    isAllMention: false,
    entity: user,
  }));
}
