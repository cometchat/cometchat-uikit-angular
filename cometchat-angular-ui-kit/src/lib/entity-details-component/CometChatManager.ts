import { Component, OnInit, OnChanges } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatManager } from '../cometchat-manager';

export class EntityDetailsManager extends CometChatManager {

  messageRequest: CometChat.MessagesRequest;
  limit = 100;
  user?;
  group?

  constructor() {
    super();
    if (this.user) {
      this.messageRequest = new CometChat.MessagesRequestBuilder().setUID(this.user.uid).setLimit(this.limit).setType(CometChat.MESSAGE_TYPE.MEDIA).build();
    } else if (this.group) {
      this.messageRequest = new CometChat.MessagesRequestBuilder().setGUID(this.group.guid).setLimit(this.limit).setType(CometChat.MESSAGE_TYPE.MEDIA).build();
    } else {
      this.messageRequest = new CometChat.MessagesRequestBuilder().setLimit(this.limit).setType(CometChat.MESSAGE_TYPE.MEDIA).build();
    }
  }

  fetchPrevious() {
    return this.messageRequest.fetchPrevious();
  }
}
