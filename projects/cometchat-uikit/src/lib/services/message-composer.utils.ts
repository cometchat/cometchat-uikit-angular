/**
 * Utility helpers for MessageComposerService.
 * Contains error handling, mention fetching observables, and pagination helpers.
 */

import { Observable } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';
import type { ErrorCallback, MentionSuggestion } from './message-composer.types';

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

    requestBuilder
      .build()
      .fetchNext()
      .then((users: CometChat.User[]) => {
        observer.next(
          users.map(user => ({
            uid: user.getUid(),
            name: user.getName(),
            avatar: user.getAvatar(),
            isAllMention: false,
            entity: user,
          }))
        );
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

    requestBuilder
      .build()
      .fetchNext()
      .then((members: CometChat.GroupMember[]) => {
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

        observer.next(suggestions);
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
