import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect } from 'vitest';
import { CometChatVoiceNoteBubbleComponent } from './cometchat-voice-note-bubble.component';
import { CometChatAudioBubbleComponent } from '../cometchat-audio-bubble/cometchat-audio-bubble.component';
import { CometChat } from '@cometchat/chat-sdk-javascript';

function mkMessage(): CometChat.MediaMessage {
  return {
    getType: () => 'audio',
    getId: () => 1,
    getAttachments: () => [],
    getCaption: () => '',
    getMetadata: () => ({ audioType: 'voiceNote' }),
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatVoiceNoteBubbleComponent', () => {
  it('delegates the message to the (reused) audio bubble', async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatVoiceNoteBubbleComponent],
    })
      .overrideComponent(CometChatAudioBubbleComponent, {
        set: { template: '<div></div>', styles: [] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(CometChatVoiceNoteBubbleComponent);
    const message = mkMessage();
    fixture.componentInstance.message = message;
    fixture.detectChanges();

    const child = fixture.debugElement.query(
      By.directive(CometChatAudioBubbleComponent),
    );
    expect(child).toBeTruthy();
    expect(child.componentInstance.message).toBe(message);
  });
});
