import { Component, OnInit, HostListener, Input, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { GroupListManager } from './cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';
import { STRING_CONSTS } from './string_constants';
import { GROUP_LIST_ACTIONS } from '../string_constants';
import { Helper } from '../helpers/helper';

@Component({
  selector: 'cometchat-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent implements OnInit {

  messageToDisplay = STRING_CONSTS.STRING_MESSAGES.LOADING_MESSSAGE;

  groupListManager: GroupListManager;
  groups: CometChat.Group[] = [];
  JSONParser = JSON;

  showCreateGroup = false;

  @Input() selectedGroup?;
  searchStarted?;

  @Input() onItemSelect: (group: CometChat.Group, type?: string) => void;
  @Output() actionPerformed = new EventEmitter<{ action: string, payload?: object }>();
  constructor(private cdRef: ChangeDetectorRef) { }

  handleGroupCreationActions = (data) => {

    switch (data.action) {
      case 'close_popup':
        this.showCreateGroup = false;
        this.cdRef.detectChanges();
        break;
      case 'error':

        break;
      case 'group_created':
        if (!data.payload.getIcon()) {
          data.payload.setIcon(Helper.getSVGAvatar(data.payload.getGuid(), '#' + data.payload.getName().substr(0, 1)));
        }
        this.groups = [data.payload, ...this.groups];
        this.showCreateGroup = false;
        this.cdRef.detectChanges();

        break;
    }
  }

  onItemClick = (group, type?) => {
    if (this.onItemSelect) {
      this.onItemSelect(group, 'group');
    }
    this.actionPerformed.emit({ action: GROUP_LIST_ACTIONS.GROUP_ITEM_SELECTED, payload: { group } });
    this.selectedGroup = group;
  }
  createGroup = () => {

    this.showCreateGroup = true;
  }
  ngOnInit() {
    if ((typeof (this.selectedGroup) === 'string') && !(this.selectedGroup === '')) {
      let tempGroup = new CometChat.Group("", "", "");
      this.selectedGroup = Object.assign(tempGroup, JSON.parse(this.selectedGroup) as CometChat.Group) as CometChat.Group;
    }

    this.groupListManager = new GroupListManager();
    this.init();
  }

  init() {
    this.groupListManager.isLoggedIn(this.isChatReady);
  }

  onSearchChange($event: any) {
    if (this.searchStarted) {
      clearTimeout(this.searchStarted);
    }
    if ($event.target.value.trim() !== STRING_CONSTS.STRING_MESSAGES.EMPTY_STRING) {
      this.searchStarted = setTimeout(() => {
        this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.SEARCH_LOADING;
        this.groupListManager = new GroupListManager($event.target.value);
        this.fetchNext();
      }, 400);
    } else if ($event.target.value.trim() === STRING_CONSTS.STRING_MESSAGES.EMPTY_STRING && $event.data === null) {
      $event.target.value = STRING_CONSTS.STRING_MESSAGES.EMPTY_STRING;
      this.searchStarted = setTimeout(() => {
        this.groupListManager = new GroupListManager();
        this.fetchNext();
      }, 400);
      // tslint:disable-next-line: max-line-length
    } else if ($event.target.value.trim() === STRING_CONSTS.STRING_MESSAGES.EMPTY_STRING && $event.data === STRING_CONSTS.STRING_MESSAGES.SINGLE_SPACE) {
      $event.target.value = STRING_CONSTS.STRING_MESSAGES.EMPTY_STRING;
    }
  }


  @HostListener('scroll', ['$event.target'])
  onScroll(elem) {
    if ((elem.target.offsetHeight + elem.target.scrollTop) >= elem.target.scrollHeight) {
      this.groupListManager.fetchNext().then((groups: CometChat.Group[]) => {

        if (groups.length > 0) {

          groups.map((group, i) => {
            if (!group.getIcon()) {
              group.setIcon(Helper.getSVGAvatar(group.getGuid(), '#' + group.getName().substr(0, 1)));
              groups[i] = group;
            }
          });
        }
        this.groups = [...this.groups, ...groups];
      }, error => {
        this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.ERROR_LOADING_USERS;
      });
    }
  }

  fetchNext() {
    this.groupListManager.fetchNext().then((groups: CometChat.Group[]) => {
      if (groups.length > 0) {

        groups.map((group, i) => {
          if (!group.getIcon()) {
            group.setIcon(Helper.getSVGAvatar(group.getGuid(), '#' + group.getName().substr(0, 1)));
            groups[i] = group;
          }
        });
        this.groups = groups;
      } else {
        this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.ERROR_NO_USERS_FOUND;
        this.groups = [];
      }
    }, error => {
      this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.ERROR_LOADING_USERS;
    });
  }

  // getSVGAvatar = (generator: string, data: string) => {

  //   const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  //   svg1.setAttribute("width", "200");
  //   svg1.setAttribute("height", "200");

  //   const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  //   rect.setAttribute('x', '0');
  //   rect.setAttribute('y', '0');
  //   rect.setAttribute('width', '200');
  //   rect.setAttribute('height', '200');
  //   rect.setAttribute('fill', this.stringToColour(generator));
  //   const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  //   text.setAttribute('x', '50%');
  //   text.setAttribute('y', '54%');
  //   text.setAttribute('dominant-baseline', 'middle');
  //   text.setAttribute('text-anchor', 'middle');
  //   text.setAttribute('fill', 'white');
  //   text.setAttribute('font-size', '120');
  //   text.setAttribute('font-family', "'Inter', sans-serif");
  //   text.setAttribute('font-wight', "600");
  //   text.textContent = '#' + data;
  //   svg1.appendChild(rect);
  //   svg1.appendChild(text);
  //   let svgString = new XMLSerializer().serializeToString(svg1);


  //   let decoded = unescape(encodeURIComponent(svgString));
  //   let base64 = btoa(decoded);

  //   let imgSource = `data:image/svg+xml;base64,${base64}`;
  //   return imgSource;
  // }


  // stringToColour = function (str) {
  //   var hash = 0;
  //   for (var i = 0; i < str.length; i++) {
  //     hash = str.charCodeAt(i) + ((hash << 5) - hash);
  //   }
  //   var colour = '#';
  //   for (var i = 0; i < 3; i++) {
  //     var value = (hash >> (i * 8)) & 0xFF;
  //     colour += ('00' + value.toString(16)).substr(-2);
  //   }
  //   return colour;
  // }


  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {
      this.groupListManager.fetchNext().then((groups: CometChat.Group[]) => {

        if (groups.length === 0) {
          this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.ERROR_NO_USERS_FOUND;
        }
        groups.map((group, i) => {
          if (!group.getIcon()) {
            group.setIcon(Helper.getSVGAvatar(group.getGuid(), '#' + group.getName().substr(0, 1)));
            groups[i] = group;
          }
        });
        this.groups = groups;

      }, (err) => {
        // TODO handle is chatusr logedin Failes.
      });
    } else {
      // TODO handle is chatusr logedin Failes.
    }
  }



}
