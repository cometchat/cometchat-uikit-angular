import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect } from 'vitest';
import { CometChatFilesBubbleComponent } from './cometchat-files-bubble.component';
import { CometChatFileBubbleComponent } from '../cometchat-file-bubble/cometchat-file-bubble.component';
import { CometChat } from '@cometchat/chat-sdk-javascript';

function mkMessage(): CometChat.MediaMessage {
  return {
    getType: () => 'file',
    getId: () => 1,
    getAttachments: () => [],
    getCaption: () => '',
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatFilesBubbleComponent', () => {
  it('delegates the message to the (reused) file bubble', async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatFilesBubbleComponent],
    })
      .overrideComponent(CometChatFileBubbleComponent, {
        set: { template: '<div></div>', styles: [] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(CometChatFilesBubbleComponent);
    const message = mkMessage();
    fixture.componentInstance.message = message;
    fixture.detectChanges();

    const child = fixture.debugElement.query(
      By.directive(CometChatFileBubbleComponent),
    );
    expect(child).toBeTruthy();
    expect(child.componentInstance.message).toBe(message);
  });
});
