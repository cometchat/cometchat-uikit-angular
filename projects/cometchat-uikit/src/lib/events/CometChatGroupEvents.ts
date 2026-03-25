import { DestroyRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { subscribeWithOptionalCleanup } from './event-utils';

/**
 * Group event subjects for handling various group-related actions (e.g., group creation, member actions, ownership changes, etc.)
 */
export class CometChatGroupEvents {
  static ccGroupCreated: Subject<CometChat.Group> = new Subject<CometChat.Group>();
  static ccGroupDeleted: Subject<CometChat.Group> = new Subject<CometChat.Group>();
  static ccGroupMemberJoined: Subject<IGroupMemberJoined> = new Subject<IGroupMemberJoined>();
  static ccGroupLeft: Subject<IGroupLeft> = new Subject<IGroupLeft>();
  static ccGroupMemberAdded: Subject<IGroupMemberAdded> = new Subject<IGroupMemberAdded>();
  static ccGroupMemberScopeChanged: Subject<IGroupMemberScopeChanged> =
    new Subject<IGroupMemberScopeChanged>();
  static ccGroupMemberKicked: Subject<IGroupMemberKickedBanned> =
    new Subject<IGroupMemberKickedBanned>();
  static ccGroupMemberBanned: Subject<IGroupMemberKickedBanned> =
    new Subject<IGroupMemberKickedBanned>();
  static ccGroupMemberUnbanned: Subject<IGroupMemberUnBanned> = new Subject<IGroupMemberUnBanned>();
  static ccOwnershipChanged: Subject<IOwnershipChanged> = new Subject<IOwnershipChanged>();
  // ── Deprecated generic method ──

  /** @deprecated Use typed publish methods instead (e.g., publishGroupCreated). */
  static publishEvent(event: Subject<CometChat.Group>, group: CometChat.Group) {
    event.next(group);
  }

  // ── Typed Publish Methods ──

  static publishGroupCreated(group: CometChat.Group): void {
    CometChatGroupEvents.ccGroupCreated.next(group);
  }

  static publishGroupDeleted(group: CometChat.Group): void {
    CometChatGroupEvents.ccGroupDeleted.next(group);
  }

  static publishGroupMemberJoined(data: IGroupMemberJoined): void {
    CometChatGroupEvents.ccGroupMemberJoined.next(data);
  }

  static publishGroupLeft(data: IGroupLeft): void {
    CometChatGroupEvents.ccGroupLeft.next(data);
  }

  static publishGroupMemberAdded(data: IGroupMemberAdded): void {
    CometChatGroupEvents.ccGroupMemberAdded.next(data);
  }

  static publishGroupMemberScopeChanged(data: IGroupMemberScopeChanged): void {
    CometChatGroupEvents.ccGroupMemberScopeChanged.next(data);
  }

  static publishGroupMemberKicked(data: IGroupMemberKickedBanned): void {
    CometChatGroupEvents.ccGroupMemberKicked.next(data);
  }

  static publishGroupMemberBanned(data: IGroupMemberKickedBanned): void {
    CometChatGroupEvents.ccGroupMemberBanned.next(data);
  }

  static publishGroupMemberUnbanned(data: IGroupMemberUnBanned): void {
    CometChatGroupEvents.ccGroupMemberUnbanned.next(data);
  }

  static publishOwnershipChanged(data: IOwnershipChanged): void {
    CometChatGroupEvents.ccOwnershipChanged.next(data);
  }

  // ── Typed Subscribe Helpers ──

  static onGroupCreated(
    cb: (group: CometChat.Group) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatGroupEvents.ccGroupCreated, cb, destroyRef);
  }

  static onGroupDeleted(
    cb: (group: CometChat.Group) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatGroupEvents.ccGroupDeleted, cb, destroyRef);
  }

  static onGroupMemberJoined(
    cb: (data: IGroupMemberJoined) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatGroupEvents.ccGroupMemberJoined, cb, destroyRef);
  }

  static onGroupLeft(cb: (data: IGroupLeft) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatGroupEvents.ccGroupLeft, cb, destroyRef);
  }

  static onGroupMemberAdded(
    cb: (data: IGroupMemberAdded) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatGroupEvents.ccGroupMemberAdded, cb, destroyRef);
  }

  static onGroupMemberScopeChanged(
    cb: (data: IGroupMemberScopeChanged) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(
      CometChatGroupEvents.ccGroupMemberScopeChanged,
      cb,
      destroyRef
    );
  }

  static onGroupMemberKicked(
    cb: (data: IGroupMemberKickedBanned) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatGroupEvents.ccGroupMemberKicked, cb, destroyRef);
  }

  static onGroupMemberBanned(
    cb: (data: IGroupMemberKickedBanned) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatGroupEvents.ccGroupMemberBanned, cb, destroyRef);
  }

  static onGroupMemberUnbanned(
    cb: (data: IGroupMemberUnBanned) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatGroupEvents.ccGroupMemberUnbanned, cb, destroyRef);
  }

  static onOwnershipChanged(
    cb: (data: IOwnershipChanged) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatGroupEvents.ccOwnershipChanged, cb, destroyRef);
  }
}

/**
 * Interfaces for various group-related events
 */
export interface IGroupMemberScopeChanged {
  message: CometChat.Action;
  updatedUser: CometChat.GroupMember;
  scopeChangedTo: string;
  scopeChangedFrom: string;
  group: CometChat.Group;
}
export interface IOwnershipChanged {
  group: CometChat.Group;
  newOwner: CometChat.GroupMember;
}

export interface IGroupMemberKickedBanned {
  message: CometChat.Action;
  kickedFrom: CometChat.Group;
  kickedUser: CometChat.User;
  kickedBy: CometChat.User;
}
export interface IGroupMemberUnBanned {
  message?: CometChat.Action;
  unbannedUser: CometChat.User;
  unbannedBy: CometChat.User;
  unbannedFrom: CometChat.Group;
}
export interface IGroupMemberAdded {
  messages: CometChat.Action[];
  usersAdded: CometChat.User[];
  userAddedIn: CometChat.Group;
  userAddedBy: CometChat.User;
}
export interface IGroupMemberJoined {
  joinedUser: CometChat.User;
  joinedGroup: CometChat.Group;
}
// group left
export interface IGroupLeft {
  userLeft: CometChat.User;
  leftGroup: CometChat.Group;
  message: CometChat.Action;
}
