import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'cometchat-entity-details-component',
  templateUrl: './entity-details-component.component.html',
  styleUrls: ['./entity-details-component.component.scss']
})
export class EntityDetailsComponentComponent implements OnChanges, OnChanges {


  messageRequest: CometChat.MessagesRequest;
  limit = 100;
  JSON = JSON;

  // as of not it's manupulated localy infutue once the feature is there will be implemened via API  
  notificationOption = true;
  canAddMembers = false;
  @Input() user?;
  @Input() group?;


  @Output() actionPerformed = new EventEmitter<{ action: string, payload: object }>();

  imageMessages = [];

  onNotificationToggeled(event?) {
    this.notificationOption = !this.notificationOption;
  }

  onAction = ($event) => {
    switch ($event.target.id) {
      case 'report':
        this.actionPerformed.emit({ action: 'report', payload: {} });
        break;

      default:
        break;
    }
  }
  addMember = ($event) => {

    this.actionPerformed.emit({ action: 'click_on_add_members', payload: JSON.parse(this.group) as CometChat.Group });
  }
  leaveGroup = (event?) => {
    JSON.parse(this.group)
    CometChat.leaveGroup(JSON.parse(this.group).guid).then(() => {
      this.actionPerformed.emit({ action: 'group_left', payload: JSON.parse(this.group) as CometChat.Group });
    }, err => {
      this.actionPerformed.emit({ action: 'err_group_left', payload: JSON.parse(this.group) as CometChat.Group });
    });
  }
  onActionPefrmed = ($event) => {

    // TODO pending task1
  }


  ngOnChanges(_changes) {

    if (this.user) {
      const user = JSON.parse(this.user);
      const messageRequestBuilder = new CometChat.MessagesRequestBuilder().setUID(user.uid);

      messageRequestBuilder.setLimit(30);
      messageRequestBuilder.setCategory('message');
      messageRequestBuilder.setType(CometChat.MESSAGE_TYPE.IMAGE);
      this.messageRequest = messageRequestBuilder.build();
    }
    if (this.group) {

      const group = JSON.parse(this.group);
      if (group.scope !== 'participant') {
        this.canAddMembers = true;
      } else {
        this.canAddMembers = false;
      }
      const messageRequestBuilder = new CometChat.MessagesRequestBuilder().setGUID(group.guid);
      messageRequestBuilder.setLimit(30);
      messageRequestBuilder.setCategory('message');
      messageRequestBuilder.setType(CometChat.MESSAGE_TYPE.IMAGE);
      this.messageRequest = messageRequestBuilder.build();
    }

    this.fetchPrevious().then(messageList => {
      this.imageMessages = messageList;
    });
  }

  handleImagesScroll = () => {
    this.messageRequest.fetchPrevious().then(messageList => {
      this.imageMessages = [...this.imageMessages, ...messageList]
    });
  }



  fetchPrevious = () => {
    return this.messageRequest.fetchPrevious();
  }
}
