import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';

import { ConversationHeaderManager } from './cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';
import { CONVERSATION_SCREEN_HEADER_ACTIONS } from '../string_constants';


@Component({
  selector: 'cometchat-conversation-header',
  templateUrl: './conversation-header.component.html',
  styleUrls: ['./conversation-header.component.scss']
})
export class ConversationHeaderComponent implements OnChanges {

  @Input() user?;
  @Input() group?;

  status = undefined;
  showCallingScreen = false;
  inProgressCall;
  @Output() actionPerformed = new EventEmitter<{ action: String, payload: Object }>();

  conversationHeaderManager: ConversationHeaderManager;


  constructor(private cdRef: ChangeDetectorRef) { }

  ngOnChanges() {

    if (this.user && !(this.user instanceof Object)) {
      this.user = JSON.parse(this.user);
      this.status = this.user.status;
      this.group = undefined;
      this.conversationHeaderManager = new ConversationHeaderManager(this.user.uid);
      this.conversationHeaderManager.isLoggedIn(this.isChatReady);
      this.conversationHeaderManager.attachListener(this.callback);

      CometChat.getUser(this.user.uid.toString()).then(user => {

        if ((user.getStatus() as string).toLowerCase() === 'online') {
          this.status = user.getStatus();
        } else {
          this.status = undefined;
          this.user.lastActiveAt = user.getLastActiveAt();
        }
      });
    }
    if (this.group && !(this.group instanceof Object)) {
      this.group = JSON.parse(this.group);
      this.user = undefined;
      this.conversationHeaderManager = new ConversationHeaderManager(this.group.guid, 'group');
      this.conversationHeaderManager.isLoggedIn(this.isChatReady);
      this.conversationHeaderManager.attachListener(this.callback);
    }
  }
  makeAudioCall = ($event) => {

    let receiverID;
    let receiverType;
    if (this.user) {
      receiverID = this.user.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else {
      receiverID = this.group.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    const callType = CometChat.CALL_TYPE.AUDIO;
    const call = new CometChat.Call(receiverID, callType, receiverType);

    CometChat.initiateCall(call).then(
      outGoingCall => {
        this.showCallingScreen = true;
        // this.inProgressCall = JSON.stringify(outGoingCall);

        this.actionPerformed.emit({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.VIDEO_CALL_STARTED, payload: { outGoingCall } });
      },
      error => {
        this.actionPerformed.emit({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.AUDIO_CALL_STARTED, payload: { error } });
      }
    );
  }

  makeVideoCall = ($event) => {


    let receiverID;
    let receiverType;
    if (this.user) {
      receiverID = this.user.uid.toString();
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else {
      receiverID = this.group.guid.toString();
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    const callType = CometChat.CALL_TYPE.VIDEO;
    const call = new CometChat.Call(receiverID, callType, receiverType);

    CometChat.initiateCall(call).then(
      outGoingCall => {
        this.showCallingScreen = true;
        // this.inProgressCall = JSON.stringify(outGoingCall);

        this.actionPerformed.emit({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.VIDEO_CALL_STARTED, payload: { outGoingCall } });
      },
      error => {
        this.actionPerformed.emit({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.AUDIO_CALL_STARTED, payload: { error } });
      }
    );
  }
  clickMenuOption = ($event) => {
    if (this.user) {
      this.actionPerformed.emit({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.USER_OPTION_MENU_SELECTED, payload: { user: this.user } });
    } else if (this.group) {
      this.actionPerformed.emit({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.GROUP_OPTION_MENU_SELECTED, payload: { group: this.group } });
    }


  }

  callback = (event: { action: string, payload?: object | any }) => {

    switch (event.action) {
      case CONVERSATION_SCREEN_HEADER_ACTIONS.USER_STATUS_CHANGED.ONLINE:

        this.user = event.payload.onlineUser;
        this.status = this.user.status;
        this.cdRef.detectChanges();
        break;
      case CONVERSATION_SCREEN_HEADER_ACTIONS.USER_STATUS_CHANGED.OFFLINE:
        this.user = event.payload.offlineUser;
        this.status = this.user.status;
        this.cdRef.detectChanges();
        break;
      case CONVERSATION_SCREEN_HEADER_ACTIONS.TYPING_STATUS_CHANGED.TYPING_STARTED: {

        let typingIndicator: CometChat.TypingIndicator = event.payload.typingIndicator as CometChat.TypingIndicator;
        if (typingIndicator.getReceiverType() === 'user' && typingIndicator.getSender().getUid().toString() === this.user.uid.toString()) {
          this.status = "typing...";
        }
        break;
      }
      case CONVERSATION_SCREEN_HEADER_ACTIONS.TYPING_STATUS_CHANGED.TYPING_ENDED: {
        let typingIndicator: CometChat.TypingIndicator = event.payload.typingIndicator as CometChat.TypingIndicator;
        if (typingIndicator.getReceiverType() === 'user' && typingIndicator.getSender().getUid().toString() === this.user.uid.toString()) {
          this.status = this.user.status;
        }
        break;
      }
    }

    try {
      this.cdRef.detectChanges();
    } catch (e) {

    }
  }

  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {
      // TODO set the current logged in user.
    } else {
      // TODO show error that cometchat user log in is failed.
    }
  }

}
