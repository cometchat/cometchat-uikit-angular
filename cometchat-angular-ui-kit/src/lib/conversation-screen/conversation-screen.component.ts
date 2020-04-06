import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { DomSanitizer } from '@angular/platform-browser';
import { ADD_MEMBERES_CONTS } from '../add-members-component/add-members-component-consts';
import {
  MEDIA_MESSAGES_COMPOSER_ACTIONS,
  MESSAGES_COMPOSER_ACTIONS,
  CONVERSATION_SCREEN_HEADER_ACTIONS,
  CONVERSATIONS_SCREEN_ACTIONS
} from '../string_constants';

@Component({
  selector: 'cometchat-conversation-screen',
  templateUrl: './conversation-screen.component.html',
  styleUrls: ['./conversation-screen.component.scss']
})
export class ConversationScreenComponent {

  @Input() user?;
  @Input() group?;

  @Output() actionPerformed = new EventEmitter<{ action: string, payload?: object | any }>();

  updatedMessagesList: any = '';
  showOptionMenu = false;
  showItemDetails = false;

  showAddMembersPopup = false;

  inputType?;
  imageInput?;
  filesInput?;
  videoInput?;
  audioInput?;
  fileName?;
  fileSize?;

  constructor(private sanitizer: DomSanitizer, private cdRef: ChangeDetectorRef) { }

  handleEventsFromDetails = (event) => {

    switch (event.action) {
      case 'click_on_add_members':
        this.showAddMembersPopup = true;
        break;
    }
  }

  /**
   * Determines whether message sent tirggerd by media message composer.
   * @param event;
   */
  onMediaMessageSent(event) {
    switch (event.action) {
      case MEDIA_MESSAGES_COMPOSER_ACTIONS.MEDIA_MESSAGE_SENT: {

        const message = event.payload;
        this.updatedMessagesList = JSON.stringify([message]);
        this.showOptionMenu = false;
        this.cdRef.detectChanges();

        this.actionPerformed.emit(
          {
            action: CONVERSATIONS_SCREEN_ACTIONS.MEDIA_MESSAGES_COMPOSER_ACTIONS.MEDIA_MESSAGE_SENT,
            payload: { message: event.payload }
          });
        break;
      }
      case MEDIA_MESSAGES_COMPOSER_ACTIONS.ERROR_IN_MESSAGE_SENDING: {
        // TODO show error in if the message sending failes
        break;
      }
      case MEDIA_MESSAGES_COMPOSER_ACTIONS.WHITEBOARD_MESSAGE_SENT: {
        const message = event.payload;
        this.updatedMessagesList = JSON.stringify([message]);
        this.cdRef.detectChanges();
        this.actionPerformed.emit(
          {
            action: CONVERSATIONS_SCREEN_ACTIONS.MEDIA_MESSAGES_COMPOSER_ACTIONS.MEDIA_MESSAGE_SENT,
            payload: { message: event.payload }
          });

        break;
      }
      case MEDIA_MESSAGES_COMPOSER_ACTIONS.WRITEBOARD_MESSAGE_SENT: {
        const message = event.payload;
        this.updatedMessagesList = JSON.stringify([message]);
        this.cdRef.detectChanges();
        this.actionPerformed.emit(
          {
            action: CONVERSATIONS_SCREEN_ACTIONS.MEDIA_MESSAGES_COMPOSER_ACTIONS.MEDIA_MESSAGE_SENT,
            payload: { message: event.payload }
          });

        break;
      }
      case MEDIA_MESSAGES_COMPOSER_ACTIONS.BROADCAST_MESSAGE_SENT: {
        const message = event.payload;
        this.updatedMessagesList = JSON.stringify([message]);
        this.cdRef.detectChanges();
        this.actionPerformed.emit(
          {
            action: CONVERSATIONS_SCREEN_ACTIONS.MEDIA_MESSAGES_COMPOSER_ACTIONS.MEDIA_MESSAGE_SENT,
            payload: { message: event.payload }
          });

        break;
      }
      case MEDIA_MESSAGES_COMPOSER_ACTIONS.BROADCAST_DEMO_MESSAGE_SENT: {
        const message = event.payload;
        this.updatedMessagesList = JSON.stringify([message]);
        this.cdRef.detectChanges();
        this.actionPerformed.emit(
          {
            action: CONVERSATIONS_SCREEN_ACTIONS.MEDIA_MESSAGES_COMPOSER_ACTIONS.MEDIA_MESSAGE_SENT,
            payload: { message: event.payload }
          });

        break;
      }
      case MEDIA_MESSAGES_COMPOSER_ACTIONS.MESSAGE_SENT: {
        const message = event.payload;
        this.updatedMessagesList = JSON.stringify([message]);
        this.cdRef.detectChanges();
        this.actionPerformed.emit(
          {
            action: CONVERSATIONS_SCREEN_ACTIONS.MEDIA_MESSAGES_COMPOSER_ACTIONS.MESSAGE_SENT,
            payload: { message: event.payload }
          });

        break;
      }

    }
  }

  /**
   * Determines whether message composer event triggered by message composer.
   * @param event:{action : string, payload?:object|any}
   */
  onMessageComposerEvent(event: { action: string, payload?: object | any }) {
    switch (event.action) {
      case MESSAGES_COMPOSER_ACTIONS.MESSAGE_SENT: {
        this.updatedMessagesList = JSON.stringify([event.payload]);
        this.actionPerformed.emit(
          {
            action: CONVERSATIONS_SCREEN_ACTIONS.MESSAGES_COMPOSER_ACTIONS.MESSAGE_SENT,
            payload: { message: event.payload }
          });
        break;
      }
      case MESSAGES_COMPOSER_ACTIONS.CLICK_OPTION_MENU: {
        this.showOptionMenu = !this.showOptionMenu;
        break;
      }
      case MESSAGES_COMPOSER_ACTIONS.CLICK_TOGGLE_EMOJI: {
        // TODO add emoji keyboard.
        break;
      }
      case MESSAGES_COMPOSER_ACTIONS.CLICK_RECORD_AUDIO: {

        // TODO add recording functionality.

        break;
      }
    }
    this.cdRef.detectChanges();

  }



  /**
   * Options menu selected
   * @param event 
   */
  optionMenuSelected(event) {
    const action = event.action;
    const payload = event.payload;

    switch (action) {
      case CONVERSATION_SCREEN_HEADER_ACTIONS.AUDIO_CALL_STARTED: {
        if (payload.hasOwnProperty('error')) {
          // TODO display call in progress error.
        } else {
          this.updatedMessagesList = JSON.stringify([payload.outGoingCall]);
          this.actionPerformed.emit({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.AUDIO_CALL_STARTED, payload: { outGoingCall: payload.outGoingCall } });
        }
        break;
      }
      case CONVERSATION_SCREEN_HEADER_ACTIONS.VIDEO_CALL_STARTED: {
        if (payload.hasOwnProperty('error')) {
          // TODO display call in progress error.
        } else {
          this.updatedMessagesList = JSON.stringify([payload.outGoingCall]);
          this.actionPerformed.emit({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.VIDEO_CALL_STARTED, payload: { outGoingCall: payload.outGoingCall } });
        }
        break;
      }
      case CONVERSATION_SCREEN_HEADER_ACTIONS.USER_OPTION_MENU_SELECTED: {
        this.showItemDetails = !this.showItemDetails;
        break;
      }
      case CONVERSATION_SCREEN_HEADER_ACTIONS.GROUP_OPTION_MENU_SELECTED: {
        this.showItemDetails = !this.showItemDetails;
        break;
      }
    }
  }




  /**
   * Groups member actions
   * @param event function will be called if it component received any events from the `create_group` component.
   */
  groupMemberActions(event: { action: string, payload?: object | any }) {
    switch (event.action) {
      case ADD_MEMBERES_CONTS.ACTIONS.MEMBERS_ADDED:
        this.updatedMessagesList = 'true'; // TODO change in future to proper mechanism 
        this.showAddMembersPopup = false;
        break;
      case ADD_MEMBERES_CONTS.ACTIONS.ERROR_IN_MEMBERS_ADDING:
        this.showAddMembersPopup = false;
        break;
      case ADD_MEMBERES_CONTS.ACTIONS.CLOSE_POPUP:
        this.showAddMembersPopup = false;
        break;
    }

    this.actionPerformed.emit(event);

  }



}
