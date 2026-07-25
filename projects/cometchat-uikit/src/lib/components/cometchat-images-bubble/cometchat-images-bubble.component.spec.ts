import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect } from 'vitest';
import { CometChatImagesBubbleComponent } from './cometchat-images-bubble.component';
import { CometChatImageBubbleComponent } from '../cometchat-image-bubble/cometchat-image-bubble.component';
import { CometChat } from '@cometchat/chat-sdk-javascript';

function mkMessage(): CometChat.MediaMessage {
  return {
    getType: () => 'image',
    getId: () => 1,
    getAttachments: () => [],
    getCaption: () => '',
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatImagesBubbleComponent', () => {
  it('delegates the message to the (reused) image bubble', async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatImagesBubbleComponent],
    })
      .overrideComponent(CometChatImageBubbleComponent, {
        set: { template: '<div></div>', styles: [] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(CometChatImagesBubbleComponent);
    const message = mkMessage();
    fixture.componentInstance.message = message;
    fixture.detectChanges();

    const child = fixture.debugElement.query(
      By.directive(CometChatImageBubbleComponent),
    );
    expect(child).toBeTruthy();
    expect(child.componentInstance.message).toBe(message);
  });
});
