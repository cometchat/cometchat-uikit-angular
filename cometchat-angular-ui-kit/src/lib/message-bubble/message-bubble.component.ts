import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { Helper } from '../helpers/helper';
@Component({
  selector: 'cometchat-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss']
})
export class MessageBubbleComponent implements OnChanges {
  constructor(private cdRef: ChangeDetectorRef) { }
  @Input() timestamp?;
  @Input() sender = false;
  @Input() message;
  user?;
  group?;
  showFullScreen: boolean;
  cometchat = CometChat;
  messagesConstants = {};


  sessionId?;
  broadcastUrl?;
  whiteBoard?;
  writeBoard?;
  broadcast?;
  broadcastDemo?;
  receiver?;

  @Output() actionPerformed = new EventEmitter<{ action: string, payload?: object | any }>();


  getSVGAvatar = (a: string, b: string): string => {
    return Helper.getSVGAvatar(a, b);
  }
  ngOnChanges() {
    this.message = JSON.parse(this.message);
    if (this.message.receiverType == 'user') {
      if (this.sender) {
        this.user = JSON.stringify(this.message.receiver);
      } else {
        this.user = JSON.stringify(this.message.sender);
      }
    } else {
      this.group = JSON.stringify(this.message.receiver);
    }
    this.messagesConstants = CometChat.MessageConstatnts;
  }

  openWhiteBoard = ($event, message, receiver?: boolean) => {

    this.sessionId = message.data.customData.sessionId;
    this.whiteBoard = true;
    this.writeBoard = false;
    this.broadcast = false;
    this.broadcastDemo = false;
    if (receiver) {
      this.receiver = true;
    } else {
      this.receiver = false;
    }
    this.showFullScreen = true;
    this.cdRef.detectChanges();

  }
  openWriteBoard($event, message, receiver?: boolean) {
    this.sessionId = message.data.customData.sessionId;
    this.whiteBoard = false;
    this.writeBoard = true;
    this.broadcast = false;
    this.broadcastDemo = false;
    if (receiver) {
      this.receiver = true;
    } else {
      this.receiver = false;
    }
    this.showFullScreen = true;
    this.cdRef.detectChanges();

  }
  openBroadcast($event, message, receiver?: boolean) {
    this.sessionId = message.data.customData.sessionId;
    this.whiteBoard = false;
    this.writeBoard = false;
    this.broadcast = true;
    this.broadcastDemo = false;
    if (receiver) {
      this.receiver = true;
    } else {
      this.receiver = false;
    }
    this.showFullScreen = true;
    this.cdRef.detectChanges();

  }
  openBroadcastDemo($event, message, receiver?: boolean) {
    this.whiteBoard = false;
    this.writeBoard = false;
    this.broadcast = false;
    this.broadcastDemo = false;
    if (receiver) {

      this.broadcastUrl = message.data.customData.viewers.player;
      this.broadcastDemo = true;
      this.receiver = true;
      this.showFullScreen = true;
    } else {

      // this.broadcastUrl = message.data.customData.broadcaster.server + "/" + message.data.customData.broadcaster.streamKey;
      // this.broadcastDemo = true;
      // this.receiver = false;
      // this.showFullScreen = true;
    }
    this.cdRef.detectChanges();
  }

  handleIFrameActions = (event) => {
    this.actionPerformed.emit(event);
  }
  handleIFrameClose = (event) => {

    this.showFullScreen = false;
    this.cdRef.detectChanges();
    // window.location.reload();
  }
}
