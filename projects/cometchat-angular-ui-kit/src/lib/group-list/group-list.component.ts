import { Component, OnInit, HostListener, Input } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { GroupListManager } from './cometchat-manager';

@Component({
  selector: 'group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent implements OnInit {

  groupList: GroupListManager;
  groups: CometChat.Group[] = [];
  @Input() onItemSelect;
  JSONParser = JSON;
  loader = true;
  ngOnInit() {
    this.groupList = new GroupListManager();
    this.init();
  }

  updateSearchModel(searchKey) {
    this.groupList = new GroupListManager(searchKey);
    this.init();
  }
  init() {
    this.groupList.isLoggedIn(this.isChatReady);
  }

  onGroupSelect = (group) => {
    if (!group.hasJoined) {
      var GUID = group.guid;
      var password = "";
      var groupType = CometChat.GROUP_TYPE.PUBLIC;

      CometChat.joinGroup(GUID, groupType, password).then(
        group => {
          this.onItemSelect(group);
        },
        error => {
          console.log("Group joining failed with exception:", error);
        }
      );

    } else {
      this.onItemSelect(group);
    }


  }
  @HostListener('scroll', ['$event.target'])
  onScroll(elem) {

    if ((elem.target.offsetHeight + elem.target.scrollTop) >= elem.target.scrollHeight) {
      // console.log(elem.target.offsetHeight + elem.target.scrollTop, '====', elem.target.scrollHeight);
      this.groupList.fetchNext().then((groups: CometChat.Group[]) => {
        this.groups = [...this.groups, ...groups];
      }, error => {
        // TODO error in fetching contact list
      });
    } else {
      console.log(elem.target.scrollHeight);
    }
  }
  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {
      this.groupList.fetchNext().then((groups: CometChat.Group[]) => {
        // console.log('This are the group list', { groups });
        this.groups = groups;
        this.loader = false;
      }, (err) => {
        console.log('Failed to fetch the user list', err);
      });
    } else {
      // TODO handle is chatusr logedin Failes.
    }
  }
}
