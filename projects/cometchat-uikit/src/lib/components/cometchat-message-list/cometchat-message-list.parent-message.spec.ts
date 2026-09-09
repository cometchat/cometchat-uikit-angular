/**
 * MessageList — parentMessage input Tests
 *
 * The list takes the thread's whole parent message, not just its id: the id
 * cannot answer "is this thread followed right now", and a reply arriving over
 * the socket carries no flag of its own to read. `parentMessageId` stays as a
 * deprecated input and is still honoured when `parentMessage` is absent, so
 * existing callers keep working.
 *
 * @module components/cometchat-message-list/parent-message
 */

vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageListComponent } from './cometchat-message-list.component';

const PARENT_ID = 606;

function makeParentMessage(id = PARENT_ID): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('receiver1', 'Root', CometChat.RECEIVER_TYPE.GROUP);
  (msg as any).getId = () => id;
  return msg as unknown as CometChat.BaseMessage;
}

describe('CometChatMessageList — parentMessage', () => {
  let fixture: ComponentFixture<CometChatMessageListComponent>;
  let component: CometChatMessageListComponent;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatMessageListComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatMessageListComponent);
    component = fixture.componentInstance;
  });

  it('derives the scoping id from the parent message', () => {
    component.parentMessage = makeParentMessage();
    expect(component.parentMessageId).toBe(PARENT_ID);
  });

  it('still honours the deprecated id when no parent message is passed', () => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the back-compat path is the thing under test
    component.parentMessageId = 909;
    expect(component.parentMessageId).toBe(909);
  });

  it('prefers the parent message over a stale id, so one thread wins', () => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- deliberately setting both
    component.parentMessageId = 909;
    component.parentMessage = makeParentMessage();
    expect(component.parentMessageId).toBe(PARENT_ID);
  });

  it('reads as not-in-a-thread when neither is passed', () => {
    expect(component.parentMessageId).toBeUndefined();
  });
});
