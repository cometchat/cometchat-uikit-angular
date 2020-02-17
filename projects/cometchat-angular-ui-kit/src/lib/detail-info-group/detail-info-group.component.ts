import { Component, OnInit, Input, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { GroupsDetailsManager } from './cometchat-manager';

@Component({
  selector: 'detail-info-group',
  templateUrl: './detail-info-group.component.html',
  styleUrls: ['./detail-info-group.component.scss']
})
export class DetailInfoGroupComponent implements OnChanges {
  @Input() group?;
  groupMembers = [];
  groupDetailsManager: GroupsDetailsManager;
  constructor(private cdRef: ChangeDetectorRef) {

  }
  joinGroup = (event) => {

    CometChat.joinGroup(this.group.guid).then(
      (hasJoined) => {
        this.group.hasJoined = true;
      },
      error => {
        // TODO display the error message
      });
  }
  exitGroup = (event) => {

    CometChat.leaveGroup(this.group.guid).then(
      (hasLeft) => {
        this.group.hasJoined = false;
      },
      error => {
        // TODO display the error message
      });
  }
  ngOnChanges() {

    if (!(this.group instanceof Object)) {
      this.group = JSON.parse(this.group);
    }
    this.groupDetailsManager = new GroupsDetailsManager(this.group);
    this.init();
  }
  init() {
    this.groupDetailsManager.isLoggedIn(this.isChatReady);
  }
  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {
      this.groupDetailsManager.fetchNext().then((members) => {
        this.groupMembers = members;
      })
    } else {
      // TODO handle is chatusr logedin Failes.
    }
  }
}
