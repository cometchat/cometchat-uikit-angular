import { Component, OnInit, Input } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'group-conversation-details',
  templateUrl: './group-conversation-details.component.html',
  styleUrls: ['./group-conversation-details.component.scss']
})
export class GroupConversationDetailsComponent implements OnInit {

  @Input() selectedGroup?;
  updatedMessagesList = '';
  isShowDetailScreen = false;

  showOptionMenu = false;
  inputType?;
  imageInput?;
  filesInput?;
  videoInput?;
  audioInput?;
  fileName?;
  fileSize?;

  constructor(private sanitizer: DomSanitizer) {
  }

  onMessageSent = (message: CometChat.BaseMessage) => {
    this.updatedMessagesList = JSON.stringify([message]);
  }

  // onMessageSent = (message) => {
  //   this.updatedMessagesList = JSON.stringify([message]);
  // }

  ngOnInit() {
  }

  onMediItemClick = (item) => {
    // console.log('item clicked here on conversation page', item);

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
    }
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

    if (this.selectedGroup) {
      receiverID = JSON.parse(this.selectedGroup).guid;

      receiverType = CometChat.RECEIVER_TYPE.GROUP;

    }

    // else if (this.group) {
    //   receiverID = JSON.parse(this.group).guid;

    //   receiverType = CometChat.RECEIVER_TYPE.GROUP;

    // }

    const mediaMessage = new CometChat.MediaMessage(
      receiverID,
      input.files[0],
      messageType,
      receiverType
    );

    CometChat.sendMediaMessage(mediaMessage).then(
      message => {
        console.log('Media message sent successfully', message);
        this.onMessageSent(message);
        input.value = null;
        this.imageInput = undefined;
        this.audioInput = undefined;
        this.filesInput = undefined;
        this.videoInput = undefined;
        this.showOptionMenu = false;

      },
      error => {
        console.log('Media message sending failed with error', error);
        // Handle exception.
      }
    );
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

    console.log(this.fileName = $event.target.files[0]);
    this.fileName = $event.target.files[0].name;
    this.fileSize = $event.target.files[0].size / 1000 + 'kb';
    reader.readAsDataURL($event.target.files[0]);

  }
  onAction = (action, payLoad) => {
    console.log(action, payLoad, '9999');
    switch (action) {
      case 'message_sent': {
        this.updatedMessagesList = JSON.stringify([payLoad]);
        break;
      }
      case 'option_menu': {
        this.showOptionMenu = !this.showOptionMenu;
        break;
      }
      case 'toggle_emoji': {
        break;
      }
      case 'record_audio': {
        break;
      }
    }
  }

  detailScreen = (user) => {
    console.log(user);
    this.isShowDetailScreen = !this.isShowDetailScreen;
  }
}
