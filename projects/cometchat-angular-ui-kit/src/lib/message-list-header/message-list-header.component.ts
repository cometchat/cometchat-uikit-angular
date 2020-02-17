// import { Component, OnInit, Input, SimpleChanges } from '@angular/core';

import { Component, OnInit, Input, OnChanges, ChangeDetectorRef } from '@angular/core';
import { ConversationHeaderManager } from './cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'message-list-header',
  templateUrl: './message-list-header.component.html',
  styleUrls: ['./message-list-header.component.scss']
})

export class MessageListHeaderComponent implements OnChanges {

  @Input() user?;
  @Input() group?;

  conversationHeaderManager: ConversationHeaderManager;
  constructor(private cdRef: ChangeDetectorRef) {

  }
  ngOnChanges() {
    console.log('this.user this.user', this.user)
    if (this.user && !(this.user instanceof Object)) {
      this.user = JSON.parse(this.user);
      this.conversationHeaderManager = new ConversationHeaderManager(this.user.uid);
      this.conversationHeaderManager.isLoggedIn(this.isChatReady);
      this.conversationHeaderManager.attachListener(this.callback);
    } else if (this.group && !(this.group instanceof Object)) {
      this.group = JSON.parse(this.group);
      this.conversationHeaderManager = new ConversationHeaderManager(this.group.gid);
      this.conversationHeaderManager.isLoggedIn(this.isChatReady);
      this.conversationHeaderManager.attachListener(this.callback);
    }


  }

  makeAudioCall = ($event) => {
    const receiverID = this.user.uid;
    const callType = CometChat.CALL_TYPE.AUDIO;
    const receiverType = CometChat.RECEIVER_TYPE.USER;

    const call = new CometChat.Call(receiverID, callType, receiverType);

    CometChat.initiateCall(call).then(
      outGoingCall => {
        console.log('Call initiated successfully:', outGoingCall);
        // perform action on success. Like show your calling screen.
      },
      error => {
        console.log('Call initialization failed with exception:', error);
      }
    );
  }

  makeVideoCall = ($event) => {
    const receiverID = this.user.uid;
    const callType = CometChat.CALL_TYPE.VIDEO;
    const receiverType = CometChat.RECEIVER_TYPE.USER;

    const call = new CometChat.Call(receiverID, callType, receiverType);

    CometChat.initiateCall(call).then(
      outGoingCall => {
        console.log('Call initiated successfully:', outGoingCall);
        // perform action on success. Like show your calling screen.
      },
      error => {
        console.log('Call initialization failed with exception:', error);
      }
    );
  }
  clickMenuOption = ($event) => {
    console.log('menu', $event);
  }

  callback = (user) => {
    console.log(user);
    this.user = user;
    this.cdRef.detectChanges();
  }

  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {
      console.log('ConversationHeaderManager', user);
    } else {
      // TODO handle is chatusr logedin Failes.
    }
  }




}
