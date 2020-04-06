import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CometChat } from '@cometchat-pro/chat';
import { MEDIA_MESSAGES_COMPOSER_ACTIONS } from '../string_constants';
@Component({
  selector: 'cometchat-media-message-composer-preview',
  templateUrl: './media-message-composer-preview.component.html',
  styleUrls: ['./media-message-composer-preview.component.scss']
})
export class MediaMessageComposerPreviewComponent {

  @Input() showOptionMenu: any = false;
  @Input() user?;
  @Input() group?;

  inputType?: any;
  imageInput?;
  filesInput?;
  videoInput?;
  audioInput?;
  fileName?;
  fileSize?;
  showWhiteboard = false;
  whiteBoardSessionId: string;
  whiteBoard?: boolean;
  writeBoard?: boolean;
  broadcast?: boolean;
  broadcastDemo?: boolean;
  message?;
  // tslint:disable-next-line: no-output-on-prefix
  @Output() actionPerformed = new EventEmitter<{ action: string, payload: CometChat.BaseMessage }>();

  constructor(private sanitizer: DomSanitizer, private cdRef: ChangeDetectorRef) { }

  iframeActions = ($event) => {
    this.actionPerformed.emit({ action: MEDIA_MESSAGES_COMPOSER_ACTIONS.MESSAGE_SENT, payload: $event.payload.message });
  }
  onMediInputChange = ($event) => {

    const reader = new FileReader();

    reader.onload = (e: any) => {
      switch ($event.target.id) {
        case 'video-input': {
          this.videoInput = e.target.result;
          break;
        }
        case 'image-input': {
          this.imageInput = e.target.result;
          break;
        }
        case 'audio-input': {
          this.audioInput = e.target.result;
          break;
        }
        case 'file-input': {
          this.filesInput = this.sanitizer.bypassSecurityTrustResourceUrl(e.target.result);
          break;
        }
      }

    };
    this.fileName = $event.target.files[0].name;
    this.fileSize = $event.target.files[0].size / 1000 + 'kb';
    reader.readAsDataURL($event.target.files[0]);
  }

  onMediItemClick = (item) => {

    this.inputType = item.id;
    switch (item.id) {
      case 'file': {
        document.getElementById('file-input').click();
        break;
      }
      case 'image': {
        document.getElementById('image-input').click();
        break;
      }
      case 'video': {
        document.getElementById('video-input').click();
        break;
      }
      case 'audio': {
        document.getElementById('audio-input').click();
        break;
      }
      case 'location': {
        document.getElementById('file-input').click();
        break;
      }
      case 'whiteBoard': {
        this.showWhiteboard = true;
        this.whiteBoard = true;
        this.writeBoard = false;
        this.broadcast = false;
        this.broadcastDemo = false;
        this.whiteBoardSessionId = new Date().getTime() + "draw" + Math.random().toString(36).substring(7);
        this.sendCustomMessage(this.whiteBoardSessionId, item.id, 'https://b.chatforyoursite.com/d/');


        break;
      }
      case 'writeBoard': {
        this.showWhiteboard = true;
        this.whiteBoard = false;
        this.writeBoard = true;
        this.broadcast = false;
        this.broadcastDemo = false;
        this.whiteBoardSessionId = new Date().getTime() + "write" + Math.random().toString(36).substring(7);
        this.sendCustomMessage(this.whiteBoardSessionId, item.id, 'https://b.chatforyoursite.com/d/');

        break;
      }
      case 'broadcast': {
        this.showWhiteboard = true;
        this.whiteBoard = false;
        this.writeBoard = false;
        this.broadcast = true;
        this.broadcastDemo = false;
        this.whiteBoardSessionId = new Date().getTime() + "broadcast" + Math.random().toString(36).substring(7);
        this.sendCustomMessage(this.whiteBoardSessionId, item.id, 'https://b.chatforyoursite.com/d/');
        break;
      }

    }
  }


  /**
 * Determines whether media item selected on
 * @param data:any ({ item: object, id: string })
 */
  onMediaItemSelected = (data) => {
    this.onMediItemClick(data.item);
  }
  closeFrame($event) {
    this.showWhiteboard = false;
  }
  sendCustomMessage = (sessionId: string, type: string, baseUrl: string) => {
    let input: any;
    let messageType = 'whiteBoard';


    let receiverID;

    let receiverType;

    if (this.user) {
      receiverID = JSON.parse(this.user).uid;

      receiverType = CometChat.RECEIVER_TYPE.USER;

    } else if (this.group) {
      receiverID = JSON.parse(this.group).guid;

      receiverType = CometChat.RECEIVER_TYPE.GROUP;

    }

    const customMessage = new CometChat.CustomMessage(
      receiverID,
      receiverType,
      type,
      {
        sessionId, type, baseUrl
      }
    );

    CometChat.sendCustomMessage(customMessage).then(
      message => {
        switch (type) {
          case 'broadcast': {
            this.actionPerformed.emit({ action: MEDIA_MESSAGES_COMPOSER_ACTIONS.BROADCAST_MESSAGE_SENT, payload: message });
            break;
          }
          case 'whiteBoard': {
            this.actionPerformed.emit({ action: MEDIA_MESSAGES_COMPOSER_ACTIONS.WHITEBOARD_MESSAGE_SENT, payload: message });
            break;
          }
          case 'writeBoard': {
            this.actionPerformed.emit({ action: MEDIA_MESSAGES_COMPOSER_ACTIONS.WRITEBOARD_MESSAGE_SENT, payload: message });
            break;
          }
          case 'broadcastDemo': {
            this.actionPerformed.emit({ action: MEDIA_MESSAGES_COMPOSER_ACTIONS.BROADCAST_DEMO_MESSAGE_SENT, payload: message });
            break;
          }
        }
      },
      error => {

        // TODO Handle exception.
      }
    );
  }

  sendBroadcastMessage = (customMessage) => {

    CometChat.sendCustomMessage(customMessage).then(
      message => {

        this.actionPerformed.emit({ action: MEDIA_MESSAGES_COMPOSER_ACTIONS.BROADCAST_DEMO_MESSAGE_SENT, payload: message });

        this.message = undefined;
        this.broadcastDemo = false;
      },
      error => {

        // TODO Handle exception.
      }
    );
  }


  startBroadcast = () => {
    this.sendBroadcastMessage(this.message);

  }
  cancelBroadcast = () => {
    this.message = undefined;
    this.broadcastDemo = false;

  }
  sendImageMessage = ($event) => {
    let input: any;
    let messageType: string;
    if (this.imageInput) {
      input = document.getElementById('image-input');
      messageType = CometChat.MESSAGE_TYPE.IMAGE;
    } else if (this.filesInput) {
      input = document.getElementById('file-input');
      messageType = CometChat.MESSAGE_TYPE.FILE;
    } else if (this.audioInput) {
      messageType = CometChat.MESSAGE_TYPE.AUDIO;
      input = document.getElementById('audio-input');
    } else if (this.videoInput) {
      messageType = CometChat.MESSAGE_TYPE.VIDEO;
      input = document.getElementById('video-input');
    }
    // input = document.getElementById('image-input');
    let receiverID;

    let receiverType;

    if (this.user) {
      receiverID = JSON.parse(this.user).uid;

      receiverType = CometChat.RECEIVER_TYPE.USER;

    } else if (this.group) {
      receiverID = JSON.parse(this.group).guid;

      receiverType = CometChat.RECEIVER_TYPE.GROUP;

    }

    const mediaMessage = new CometChat.MediaMessage(
      receiverID,
      input.files[0],
      messageType,
      receiverType
    );

    CometChat.sendMediaMessage(mediaMessage).then(
      message => {
        input.value = null;
        this.imageInput = undefined;
        this.audioInput = undefined;
        this.filesInput = undefined;
        this.videoInput = undefined;
        this.showOptionMenu = false;

        this.actionPerformed.emit({ action: MEDIA_MESSAGES_COMPOSER_ACTIONS.MEDIA_MESSAGE_SENT, payload: message });

      },
      error => {

        // TODO Handle exception.
      }
    );
  }
}
