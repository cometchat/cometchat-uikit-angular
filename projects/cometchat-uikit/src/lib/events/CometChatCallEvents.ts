import { DestroyRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { subscribeWithOptionalCleanup } from './event-utils';

/**
 * Call event subjects for handling various call-related actions (like outgoing calls, call acceptance, rejections, etc.)
 */
export class CometChatCallEvents {
  static ccOutgoingCall: Subject<CometChat.Call> = new Subject<CometChat.Call>();
  static ccCallAccepted: Subject<CometChat.Call> = new Subject<CometChat.Call>();
  static ccCallRejected: Subject<CometChat.Call> = new Subject<CometChat.Call>();
  static ccCallEnded: Subject<CometChat.Call> = new Subject<CometChat.Call>();

  // ── Typed Publish Methods ──

  static publishOutgoingCall(call: CometChat.Call): void {
    CometChatCallEvents.ccOutgoingCall.next(call);
  }

  static publishCallAccepted(call: CometChat.Call): void {
    CometChatCallEvents.ccCallAccepted.next(call);
  }

  static publishCallRejected(call: CometChat.Call): void {
    CometChatCallEvents.ccCallRejected.next(call);
  }

  static publishCallEnded(call: CometChat.Call): void {
    CometChatCallEvents.ccCallEnded.next(call);
  }

  // ── Typed Subscribe Helpers ──

  static onOutgoingCall(cb: (call: CometChat.Call) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatCallEvents.ccOutgoingCall, cb, destroyRef);
  }

  static onCallAccepted(cb: (call: CometChat.Call) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatCallEvents.ccCallAccepted, cb, destroyRef);
  }

  static onCallRejected(cb: (call: CometChat.Call) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatCallEvents.ccCallRejected, cb, destroyRef);
  }

  static onCallEnded(cb: (call: CometChat.Call) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatCallEvents.ccCallEnded, cb, destroyRef);
  }
}
