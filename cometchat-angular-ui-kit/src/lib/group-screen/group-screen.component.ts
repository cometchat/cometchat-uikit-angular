import { Component, OnInit } from '@angular/core';
import { CONVERSATIONS_SCREEN_ACTIONS, CONTACT_LIST_ACTIONS, GROUP_LIST_ACTIONS } from '../string_constants';

@Component({
  selector: 'cometchat-group-screen',
  templateUrl: './group-screen.component.html',
  styleUrls: ['./group-screen.component.scss']
})
export class GroupScreenComponent implements OnInit {
  group?: object;
  json = JSON;
  inProgressCall;
  incomingScreen;
  constructor() { }

  ngOnInit() {
  }


  onItemSelected(event: { action: string, payload?: object | any }) {
    console.log(event);
    let type; let item;
    switch (event.action) {
      case GROUP_LIST_ACTIONS.GROUP_ITEM_SELECTED:
        type = 'group';
        item = event.payload.group;
        this.group = event.payload.group

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
    let tempUser = this.group;

    this.group = undefined;


    this.group = tempUser;



  }

}
