import { Component, OnInit, Input, TemplateRef, ViewChild } from '@angular/core';
import { CometChatConversationsWithMessagesComponent } from '../../Chats/CometChatConversationsWithMessages/cometchat-conversations-with-messages/cometchat-conversations-with-messages.component';
import { CometChatGroupsWithMessagesComponent } from '../../Groups/CometChatGroupsWithMessages/cometchat-groups-with-messages/cometchat-groups-with-messages.component';
import { CometChatUsersWithMessagesComponent } from '../../Users/CometChatUsersWithMessages/cometchat-users-with-messages/cometchat-users-with-messages.component';

@Component({
  selector: 'cometchat-ui',
  templateUrl: './cometchat-ui.component.html',
  styleUrls: ['./cometchat-ui.component.scss']
})
export class CometChatUIComponent implements OnInit {
  @ViewChild("chatsRef", { static: false }) chatsRef!: CometChatConversationsWithMessagesComponent ;
  @ViewChild("usersRef", { static: false }) usersRef!: CometChatUsersWithMessagesComponent;
  @ViewChild("groupsRef", { static: false }) groupsRef!: CometChatGroupsWithMessagesComponent;
  openViewOnCLick = (tabItem:any)=>{
    let pane = this.panes.filter((item:any)=>{

      return item.id == tabItem.id

    })
    if(pane[0]?.customView){

      this.contentView = pane[0]?.customView
    }

  }
  public contentView!:TemplateRef<any>;
  @Input() tabs:any = [
    {
      id: "chats",
      title: "Chats",
      iconURL: "assets/resources/deleteicon.svg",
      callBack: this.openViewOnCLick,
    },
    {
      id: "users",
      title: "Users",
      iconURL: "assets/resources/deleteicon.svg",
      callBack: this.openViewOnCLick,
    },
    {
      id: "groups",
      title: "Groups",
      iconURL: "assets/resources/deleteicon.svg",
      callBack: this.openViewOnCLick,
    }
  ];
  @Input() panes:any = [
    {
      id: "chats",
      title: "Chats",
      iconURL: "assets/resources/deleteicon.svg",
      customView: this.chatsRef
    },
    {
      id: "users",
      title: "Users",
      iconURL: "assets/resources/deleteicon.svg",
      customView: this.usersRef
    },
    {
      id: "groups",
      title: "Groups",
      iconURL: "assets/resources/deleteicon.svg",
      customView: this.groupsRef
    }
  ];
 ngOnInit(): void {
   this.panes = [
    {
      id: "chats",
      title: "Chats",
      iconURL: "assets/resources/deleteicon.svg",
      customView: this.chatsRef
    },
    {
      id: "users",
      title: "Users",
      iconURL: "assets/resources/deleteicon.svg",
      customView: this.usersRef
    },
    {
      id: "groups",
      title: "Groups",
      iconURL: "assets/resources/deleteicon.svg",
      customView: this.groupsRef
    }
   ]
     
 }


}
