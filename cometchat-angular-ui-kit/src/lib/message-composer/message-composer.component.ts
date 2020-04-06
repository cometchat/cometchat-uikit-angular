import { Component, Input, ChangeDetectorRef, OnChanges, EventEmitter, Output } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';


import { MESSAGES_COMPOSER_ACTIONS } from '../string_constants';
import { PickerModule } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'cometchat-message-composer',
  templateUrl: './message-composer.component.html',
  styleUrls: ['./message-composer.component.scss']
})

export class MessageComposerComponent implements OnChanges {

  placeHolder = 'Message';

  // constants
  TOGLE_EMOJI = MESSAGES_COMPOSER_ACTIONS.CLICK_TOGGLE_EMOJI;
  OPTION_MENU = MESSAGES_COMPOSER_ACTIONS.CLICK_OPTION_MENU;
  RECORD_AUDIO = MESSAGES_COMPOSER_ACTIONS.CLICK_RECORD_AUDIO;
  SEND_MESSAGE = MESSAGES_COMPOSER_ACTIONS.CLICK_SEND_MESSAGE;

  typingStarted: any;
  timer = 0;
  fileOptionsExpanded = false;

  showEmojiKeyboard = false;
  @Input() user?;
  @Input() group?;
  @Input() text = this.placeHolder;

  @Output() actionPerformed = new EventEmitter<{ action: string, payload?: CometChat.BaseMessage }>();


  /**
   * Creates an instance of message composer component.
   * @param cdRef  chnage detector provided by core.
   */
  constructor(private cdRef: ChangeDetectorRef) { }


  ngOnChanges() {
    this.init();
  }

  /**
   * Inits message composer component
   */
  init() {
    if (this.user) {
      this.user = JSON.parse(this.user);
    } else {
      this.group = JSON.parse(this.group);
    }
    this.cdRef.detectChanges();
  }

  onActive = (event) => {
    if (event.target.innerText === this.placeHolder) {
      event.target.innerText = '';
    }

  }
  onBlur = (event) => {
    if (event.target.innerText.trim() === '') {
      event.target.innerText = this.placeHolder;
    }
  }


  /**
   * Determines white option is triggered.
   * @param event default click event triggered.
   * @param action which option is clicked.
   */
  onActionGenerated(event, action) {

    if (action === this.OPTION_MENU) {

      this.fileOptionsExpanded = !this.fileOptionsExpanded;
    }
    if (action === this.SEND_MESSAGE) {
      document.getElementById('cometchat-message-composer').focus();
      this.showEmojiKeyboard = false;

      let receiverID;
      let receiverType;

      if (this.user) {
        receiverID = this.user.uid;
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else {
        receiverID = this.group.guid;
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      }


      let typingNotification = new CometChat.TypingIndicator(
        receiverID,
        receiverType
      );
      CometChat.endTyping(typingNotification);

      const messageText = document.getElementById('cometchat-message-composer').innerText.trim();
      const textMessage = new CometChat.TextMessage(
        receiverID,
        messageText,
        receiverType
      );
      document.getElementById('cometchat-message-composer').innerText = '';
      this.cdRef.detectChanges();
      CometChat.sendMessage(textMessage).then(
        (message: CometChat.BaseMessage) => {
          this.actionPerformed.emit({ action: MESSAGES_COMPOSER_ACTIONS.MESSAGE_SENT, payload: message });
          // this.fileOptionsExpanded = !this.fileOptionsExpanded;
        },
        (error) => {
          this.actionPerformed.emit({ action: MESSAGES_COMPOSER_ACTIONS.ERROR_IN_MESSAGE_SENDING, payload: error });
          // this.fileOptionsExpanded = !this.fileOptionsExpanded;
        }
      );
      return;
    }
    if (action === this.TOGLE_EMOJI) {
      this.showEmojiKeyboard = !this.showEmojiKeyboard;
    }
    this.actionPerformed.emit({ action });
  }



  onTypingStarted($event: any) {
    this.showEmojiKeyboard = false;
    if (this.typingStarted) {

    } else {
      let receiverID;
      let receiverType;

      if (this.user) {
        receiverID = this.user.uid;
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else {
        receiverID = this.group.guid;
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      }

      let typingNotification = new CometChat.TypingIndicator(
        receiverID,
        receiverType
      );
      CometChat.startTyping(typingNotification);

      this.typingStarted = setTimeout(() => {
        clearTimeout(this.typingStarted);
        this.typingStarted = undefined;


      }, 5000);
    }

  }

  /**
   * Onchange detect of message composer component
   * * will detecte the any change in the CometChat massage composer input box and take acction accordigly.
   */
  onchangeDetect = (event) => {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      this.showEmojiKeyboard = false;
      let receiverID;
      let receiverType;

      if (this.user) {
        receiverID = this.user.uid;
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else {
        receiverID = this.group.guid;
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      }
      let typingNotification = new CometChat.TypingIndicator(
        receiverID,
        receiverType
      );
      CometChat.endTyping(typingNotification);

      this.typingStarted = setTimeout(() => {
        clearTimeout(this.typingStarted);
        this.typingStarted = undefined;


      }, 5000);
      const messageText = event.srcElement.innerText.trim();
      const textMessage = new CometChat.TextMessage(
        receiverID,
        messageText,
        receiverType
      );
      event.srcElement.innerText = '';
      this.cdRef.detectChanges();
      CometChat.sendMessage(textMessage).then(
        (message: CometChat.BaseMessage) => {
          this.actionPerformed.emit({ action: MESSAGES_COMPOSER_ACTIONS.MESSAGE_SENT, payload: message });
          // this.fileOptionsExpanded = !this.fileOptionsExpanded;
        },
        (error) => {
          this.actionPerformed.emit({ action: MESSAGES_COMPOSER_ACTIONS.ERROR_IN_MESSAGE_SENDING, payload: error });
          // this.fileOptionsExpanded = !this.fileOptionsExpanded;
        }
      );
      return false;
    } else {
      this.onTypingStarted(event);
    }

  }
  clickOnEmoji(event) {
    document.getElementById('cometchat-message-composer').focus();
    document.getElementById('cometchat-message-composer').innerText = document.getElementById('cometchat-message-composer').innerText + event.emoji.native
    let tag = document.getElementById('cometchat-message-composer');

    var setpos = document.createRange();

    // Creates object for selection 
    var set = window.getSelection();

    // Set start position of range 
    setpos.setStart(tag.childNodes[0], document.getElementById('cometchat-message-composer').innerText.length);

    // Collapse range within its boundary points 
    // Returns boolean 
    setpos.collapse(true);

    // Remove all ranges set 
    set.removeAllRanges();

    // Add range with respect to range object. 
    set.addRange(setpos);
    document.getElementById('cometchat-message-composer').focus();
  }
}
