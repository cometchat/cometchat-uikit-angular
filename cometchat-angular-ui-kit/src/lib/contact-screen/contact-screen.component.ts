import { Component, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { CONVERSATION_LIST_ACTIONS, CONTACT_LIST_ACTIONS, CONVERSATIONS_SCREEN_ACTIONS } from '../string_constants';

@Component({
  selector: 'cometchat-contact-screen',
  templateUrl: './contact-screen.component.html',
  styleUrls: ['./contact-screen.component.scss']
})
export class ContactScreenComponent implements OnInit {
  user?: object;
  group?: object;
  json = JSON;
  inProgressCall;
  incomingScreen;
  friendsOnly;
  constructor() { }

  ngOnInit() {
  }


  onItemSelected(event: { action: string, payload?: object | any }) {
    console.log(event);
    let type; let item;
    switch (event.action) {
      case CONTACT_LIST_ACTIONS.CONTACT_ITEM_SELECTED:
        type = 'user';
        item = event.payload.user;
        this.user = event.payload.user

        break;
      case CONVERSATION_LIST_ACTIONS.CONVERSATION_ITEM_SELECTED:

        if (event.payload.hasOwnProperty('user')) {
          type = 'user';
          item = event.payload.user;
          console.log('we are here');
        }
        break;
    }

  }
  /**
   * Handles action by conversation screen
   * @param event: {action:string,payload?:any}
   */
  handleActionByConversationScreen = (event: { action: string, payload?: object | any }) => {

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

  }
  handleCallScreenActions = (event) => {
    let tempUser = this.user;

    this.user = undefined;


    this.user = tempUser;



  }

}
