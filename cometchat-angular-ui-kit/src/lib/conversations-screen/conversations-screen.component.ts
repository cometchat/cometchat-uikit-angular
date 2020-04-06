import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CONTACT_LIST_ACTIONS, CONVERSATION_LIST_ACTIONS, CONVERSATIONS_SCREEN_ACTIONS } from '../string_constants';

@Component({
  selector: 'cometchat-conversations-screen',
  templateUrl: './conversations-screen.component.html',
  styleUrls: ['./conversations-screen.component.scss']
})
export class ConversationsScreenComponent implements OnInit {

  user?: object;
  group?: object;
  json = JSON;
  inProgressCall;
  messagesActions;
  constructor(private cdRef: ChangeDetectorRef) { }

  ngOnInit() {
  }


  onItemSelected(event: { action: string, payload?: object | any }) {
    console.log(event);
    let type; let item;
    switch (event.action) {

      case CONVERSATION_LIST_ACTIONS.CONVERSATION_ITEM_SELECTED:

        if (event.payload.hasOwnProperty('user')) {
          type = 'user';
          this.group = undefined;
          item = event.payload.user;
          this.user = event.payload.user;

        } else {
          console.log("here");
          type = 'group';
          this.user = undefined;
          item = event.payload.group;
          this.group = event.payload.group;

        }
        break;
    }

  }
  /**
   * Handles action by conversation screen
   * @param event: {action:string,payload?:any}
   */
  handleActionByConversationScreen = (event: { action: string, payload?: object | any }) => {
    this.messagesActions = event;
    switch (event.action) {

      case CONVERSATIONS_SCREEN_ACTIONS.MESSAGES_COMPOSER_ACTIONS.MESSAGE_SENT: {

        break;
      }
      case CONVERSATIONS_SCREEN_ACTIONS.MEDIA_MESSAGES_COMPOSER_ACTIONS.MEDIA_MESSAGE_SENT: {

        break;
      } case CONVERSATIONS_SCREEN_ACTIONS.ADD_MEMBERES_CONTS.ACTIONS.MEMBERS_ADDED: {

        break;
      }
      case CONVERSATIONS_SCREEN_ACTIONS.CONVERSATION_SCREEN_HEADER_ACTIONS.AUDIO_CALL_STARTED: {

        this.inProgressCall = JSON.stringify(event.payload.outGoingCall);

        break;
      }
      case CONVERSATIONS_SCREEN_ACTIONS.CONVERSATION_SCREEN_HEADER_ACTIONS.VIDEO_CALL_STARTED: {

        this.inProgressCall = JSON.stringify(event.payload.outGoingCall);

        break;
      }

    }
    this.cdRef.detectChanges()

  }
  handleCallScreenActions = (event) => {
    let tempUser = this.user;
    let tempGroup = this.group;
    this.user = undefined;
    this.group = undefined;

    this.user = tempUser;
    this.group = tempGroup;
    this.cdRef.detectChanges()


  }

}