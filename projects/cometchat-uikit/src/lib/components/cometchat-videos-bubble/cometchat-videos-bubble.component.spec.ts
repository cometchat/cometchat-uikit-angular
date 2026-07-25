import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect } from 'vitest';
import { CometChatVideosBubbleComponent } from './cometchat-videos-bubble.component';
import { CometChatVideoBubbleComponent } from '../cometchat-video-bubble/cometchat-video-bubble.component';
import { CometChat } from '@cometchat/chat-sdk-javascript';

function mkMessage(): CometChat.MediaMessage {
  return {
    getType: () => 'video',
    getId: () => 1,
    getAttachments: () => [],
    getCaption: () => '',
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatVideosBubbleComponent', () => {
  it('delegates the message to the (reused) video bubble', async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatVideosBubbleComponent],
    })
      .overrideComponent(CometChatVideoBubbleComponent, {
        set: { template: '<div></div>', styles: [] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(CometChatVideosBubbleComponent);
    const message = mkMessage();
    fixture.componentInstance.message = message;
    fixture.detectChanges();

    const child = fixture.debugElement.query(
      By.directive(CometChatVideoBubbleComponent),
    );
    expect(child).toBeTruthy();
    expect(child.componentInstance.message).toBe(message);
  });
});
