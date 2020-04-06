import { Component, OnInit, Output, EventEmitter, Input, OnDestroy, OnChanges } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'app-full-screen-iframe',
  templateUrl: './full-screen-iframe.component.html',
  styleUrls: ['./full-screen-iframe.component.scss']
})
export class FullScreenIframeComponent implements OnChanges, OnDestroy {
  whiteBoardBaseUrl = 'https://b.chatforyoursite.com/d/';
  writeBoardBaseUrl = 'https://w.chatforyoursite.com/p/';
  broadcastBaseUrl = 'https://rtc-eu.cometchat.io/';
  @Input() url?: string;
  // url = "https://b.chatforyoursite.com/d/draw-979c9f3f6df5d2e36063eb28ca679741asasfasfasfasf"
  showFrame = false;
  @Input() sessionId?;
  @Input() whiteBoard?;
  @Input() writeBoard?;
  @Input() broadcast?;
  @Input() broadcastDemo?;
  @Input() receiver?;
  @Input() user?;
  @Input() group?;
  @Output() close = new EventEmitter<{ action: string, payload?: object }>();
  constructor() { }
  @Output() actionPerformed = new EventEmitter<{ action: string, payload?: object | any }>();

  ngOnChanges(changes) {
    if (this.sessionId)
      this.url = undefined;
    if (this.sessionId) {
      if (this.whiteBoard === 'true' || this.whiteBoard === true) {
        this.url = this.whiteBoardBaseUrl + this.sessionId;
      }
      if (this.writeBoard === 'true' || this.writeBoard === true) {
        CometChat.getLoggedinUser().then((user: CometChat.User) => {
          this.url = this.writeBoardBaseUrl + this.sessionId + '?userName=' + user.getName();
        }, error => {
          this.url = this.writeBoardBaseUrl + this.sessionId + '?userName=guest' + this.sessionId;
        });

      }
      if (this.broadcast === 'true' || this.broadcast === true) {

        if (this.receiver === 'true' || this.receiver === true) {
          this.url = this.broadcastBaseUrl + this.sessionId + '#config.startWithVideoMuted=true&broadcast=1';
        } else {
          this.url = this.broadcastBaseUrl + this.sessionId;
        }
      }
      if (this.broadcastDemo === 'true' || this.broadcastDemo === true) {

        this.url = this.url;
        console.log("broadcastDemo");
      }


    }

    // window.open(this.url, 'popup', 'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=50vw,height=50vh');

    this.showFrame = true;

    window.addEventListener("message", message => {
      var msg;
      try {
        msg = JSON.parse(message.data);
      } catch{
        msg = undefined;
      }
      if (msg !== undefined && msg.type == "hangup") {
        this.url = undefined;
        this.showFrame = false;
        this.close.emit({ action: 'close', payload: {} })
      }
    });
  }
  handleChatActions = (event) => {
    this.actionPerformed.emit(event);

  }

  closeFrame = (event) => {
    this.url = undefined;
    this.showFrame = false;
    this.close.emit({ action: 'close', payload: {} })
  }
  ngOnDestroy() {
    this.showFrame = false;
    this.url = undefined;
  }
}
