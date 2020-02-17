import { Component, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'cometchat-group-list-screen',
  templateUrl: './app-group-screen.component.html',
  styleUrls: ['./app-group-screen.component.scss']
})
export class AppGroupScreenComponent {

  title = 'angular';
  stringify = JSON.stringify;
  message: any;
  menuUrl = 'contactlist';
  selectedUser;
  selectedGroup;
  itemSelected: (user: CometChat.User) => void = (user) => {
    this.selectedUser = user;
    this.selectedGroup = undefined;
  }
  itemSelectedConversation: (conversation: CometChat.Conversation) => void = (conversation) => {
    if (conversation.getConversationType() === 'user') {
      this.itemSelected(conversation.getConversationWith() as CometChat.User);
    } else {
      this.itemSelectedGroup(conversation.getConversationWith() as CometChat.Group);
    }
  }

  itemSelectedGroup: (group: CometChat.Group) => void = (group) => {
    this.selectedGroup = group;
    this.selectedUser = undefined;

  }

  getMenuName(event) {
    this.menuUrl = event;
  }

}
