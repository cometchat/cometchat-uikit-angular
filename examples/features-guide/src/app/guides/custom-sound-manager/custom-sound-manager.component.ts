import { Component, OnInit } from '@angular/core';
import { MessageComposerConfiguration } from '@cometchat-pro/angular-ui-kit';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'custom-sound-manager',
  templateUrl: './custom-sound-manager.component.html',
  styleUrls: ['./custom-sound-manager.component.scss']
})
export class CustomSoundManagerComponent implements OnInit {
  public group!:CometChat.Group;
  composerConfig:MessageComposerConfiguration = new MessageComposerConfiguration({
    customOutgoingMessageSound : "assets/custom-audio.wav"
  })
  constructor() { }

  ngOnInit(): void {
    CometChat.getGroup("supergroup").then((group:CometChat.Group)=>{
      this.group = group

    })
  }

}
