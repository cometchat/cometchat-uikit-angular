
import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, EventEmitter, Output, HostListener } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { DomSanitizer } from '@angular/platform-browser';
import { GroupMembersManager } from './cometchat-manager';
import { ADD_MEMBERES_CONTS } from './add-members-component-consts';
import { Helper } from '../helpers/helper';

@Component({
  selector: 'cometchat-add-members-component',
  templateUrl: './add-members-component.component.html',
  styleUrls: ['./add-members-component.component.scss']
})
export class AddMembersComponentComponent implements OnInit {


  groupMembersManager: GroupMembersManager;
  logedInUser;

  @Input() group?;
  @Input() showPopUp;


  JSONParser = JSON;
  usersList: { selected: boolean, user: CometChat.User }[] = [];


  @Output() actionPerformed = new EventEmitter<{ action: string, payload?: object }>();
  constructor(private cdRef: ChangeDetectorRef) {
  }


  ngOnInit() {
    this.group = JSON.parse(this.group);
    this.init();
  }

  init() {
    this.groupMembersManager = new GroupMembersManager();
    this.groupMembersManager.isLoggedIn(this.isChatReady);
  }

  onItemClick = (selectedUser: CometChat.User) => {
    this.usersList.map((item: { selected: boolean, user: CometChat.User }, key) => {
      if (item.user.getUid() === selectedUser.getUid()) {
        this.usersList[key] = { selected: !item.selected, user: selectedUser };
      }
    });
  }

  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {
      this.groupMembersManager.fetchNextUsers().then((users: CometChat.User[]) => {
        const localUsersList: { selected: boolean, user: CometChat.User }[] = [];
        users.map((cometchatUser: CometChat.User) => {
          if (!cometchatUser.getAvatar()) {
            cometchatUser.setAvatar(Helper.getSVGAvatar(cometchatUser.getUid(), cometchatUser.getName().substr(0, 1)));
          }
          localUsersList.push({ selected: false, user: cometchatUser });
        });
        this.usersList = localUsersList;
      });

    } else {
      // TODO handle is chatusr logedin Failes.
    }
  }

  @HostListener('scroll', ['$event.target'])
  onScroll(elem: any) {
    if ((elem.target.offsetHeight + elem.target.scrollTop + 1) >= elem.target.scrollHeight) {

      this.groupMembersManager.fetchNextUsers().then((users: CometChat.User[]) => {
        const localUsersList: { selected: boolean, user: CometChat.User }[] = [];
        users.map((cometchatUser: CometChat.User) => {
          if (!cometchatUser.getAvatar()) {
            cometchatUser.setAvatar(Helper.getSVGAvatar(cometchatUser.getUid(), cometchatUser.getName().substr(0, 1)));
          }
          localUsersList.push({ selected: false, user: cometchatUser });
        });
        this.usersList = [...this.usersList, ...localUsersList];
      });
    }
  }





  /**
   * Closes popup
   */
  closePopup() {
    this.actionPerformed.emit({ action: ADD_MEMBERES_CONTS.ACTIONS.CLOSE_POPUP });
  }

  /**
   * Adds member to group
   */
  addMemberToGroup() {
    const membersList = [];
    this.usersList.map(item => {
      if (item.selected) {
        membersList.push(new CometChat.GroupMember(item.user.getUid(), CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT));
      }
    });
    CometChat.addMembersToGroup(this.group.guid, membersList, []).then(
      (response) => {
        this.actionPerformed.emit({ action: ADD_MEMBERES_CONTS.ACTIONS.MEMBERS_ADDED, payload: { response } });
      },
      error => {
        this.actionPerformed.emit({ action: ADD_MEMBERES_CONTS.ACTIONS.ERROR_IN_MEMBERS_ADDING, payload: { error } });
      }
    );
  }
}
