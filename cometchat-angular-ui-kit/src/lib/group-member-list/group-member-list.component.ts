import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { GroupMembersManager } from './CometChatManager';
import { CometChat } from '@cometchat-pro/chat';
import { Helper } from '../helpers/helper';

@Component({
  selector: 'cometchat-group-member-list',
  templateUrl: './group-member-list.component.html',
  styleUrls: ['./group-member-list.component.scss']
})
export class GroupMemberListComponent implements OnChanges {
  groupMembersManager: GroupMembersManager;
  JSON = JSON;
  @Input() group;
  @Input() type?;
  @Input() guid?;
  @Input() onItemClick?
  groupMembers = [];

  constructor() {

  }
  onScroll(elem: any) {
    if ((elem.target.offsetHeight + elem.target.scrollTop + 1) >= elem.target.scrollHeight) {
      this.groupMembersManager.fetchNext().then((users: CometChat.GroupMember[]) => {

        users.map((contact, i) => {
          if (!contact.getAvatar()) {
            contact.setAvatar(Helper.getSVGAvatar(contact.getUid(), contact.getName().substr(0, 1)));
            users[i] = contact;
          }
        });
        this.groupMembers = [...this.groupMembers, ...users];
      }, (err/*currently not in user| can be checked and use to display specific error message*/) => {
        // this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.ERROR_LOADING_USERS;
      });
    }
  }
  ngOnChanges() {

    if (this.group && (typeof (this.group) === 'string')) {
      this.group = JSON.parse(this.group);
      this.groupMembersManager = new GroupMembersManager(this.group.guid, this.group.type);
      this.type = this.group.type;
      this.guid = this.group.type;
    } else {
      this.groupMembersManager = new GroupMembersManager(this.group.type, this.group.type);
    }

    this.groupMembersManager.isLoggedIn(this.isChatReady);

  }


  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {


      this.groupMembersManager.fetchNext().then((groupMembers: CometChat.GroupMember[]) => {
        const gmList = [];

        groupMembers.map((groupMember: CometChat.GroupMember) => {
          if (!groupMember.getAvatar()) {
            groupMember.setAvatar(Helper.getSVGAvatar(groupMember.getUid(), groupMember.getName().substr(0, 1)));
          }
          gmList.push(groupMember);
        });

        this.groupMembers = gmList;
      });


    } else {
      //TODO handle error
    }
  }

}
