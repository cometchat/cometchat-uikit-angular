import { Component, OnInit, OnChanges, Input } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatManager } from '../cometchat-manager';


export class GroupMembersManager extends CometChatManager {

  groupMembersRequest: CometChat.GroupMembersRequest;
  limit = 30;
  guid: string;
  type = 'public';
  group;


  constructor(guid, type) {
    super();

    this.guid = guid;
    this.type = type;
    this.groupMembersRequest = new CometChat.GroupMembersRequestBuilder(guid).setLimit(this.limit).build();
  }


  getGroupInfo(guid) {
    return CometChat.getGroup(guid).then((group: CometChat.Group) => {
      this.group = group;

    }, (err: CometChat.CometChatException) => {
      // TODO manage the error
    });
  }

  fetchNext = () => {
    return this.groupMembersRequest.fetchNext();
  }

  joinAGroup = () => {
    return CometChat.joinGroup(this.guid, this.type);
  }
  leaveAgroup = () => {
    return CometChat.leaveGroup(this.guid);
  }



  addMember = (membersListIds: string[], role = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) => {

    const membersList = [];
    membersListIds.map(memberId => {
      membersList.push(new CometChat.GroupMember(memberId, role));
    });
    return CometChat.addMembersToGroup(this.guid, membersList, []);
  }

  removeMember = (uid) => {
    return CometChat.kickGroupMember(this.guid, uid);
  }

  banGroupMember = (uid) => {
    return CometChat.banGroupMember(this.guid, uid)
  }
  unbanGroupMember = (uid) => {
    return CometChat.unbanGroupMember(this.guid, uid)

  }
}

