import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import {
  SIDEBAR_ACTIONS,
  CONTACT_LIST_ACTIONS,
  GROUP_LIST_ACTIONS,
  CONVERSATION_LIST_ACTIONS,
  NAVIGATION_MENU_ACTIONS,
  CONVERSATIONS_SCREEN_ACTIONS
} from '../string_constants';


@Component({
  selector: 'cometchat-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnChanges {

  item: object;
  selectedUser?;
  selectedGroup?;
  json = JSON;
  selectedTab = 'conversation';
  @Input() friendsOnly?= false;

  @Input() actionRequired: { action: string, payload?: object | any };
  @Output() actionPerformed = new EventEmitter<{ action: string, payload?: object }>();


  messagesActions: { action: string, payload?: object | any };
  ngOnInit(): void { }

  ngOnChanges(change: SimpleChanges) {
    let event: { action: string, payload: object | any } = change.actionRequired.currentValue;
    this.messagesActions = event;
  }

  /**
   * Options menu selected
   * @param event:{ action: string, payload?: object }
   */
  optionMenuSelected(event: { action: string, payload?: object }) {
    this.actionPerformed.emit(event);
  }

  /**
   * Determines whether item selected on
   * @param event :  { action: string, payload?: object }
   */
  onItemSelected(event: { action: string, payload?: object | any }) {

    let type; let item;
    switch (event.action) {
      case CONTACT_LIST_ACTIONS.CONTACT_ITEM_SELECTED:
        type = 'user';
        item = event.payload.user;
        this.selectedUser = item;
        this.selectedGroup = undefined;
        break;
      case GROUP_LIST_ACTIONS.GROUP_ITEM_SELECTED:
        type = 'group';
        item = event.payload.group;
        this.selectedGroup = item;
        this.selectedUser = undefined;
        break;
      case CONVERSATION_LIST_ACTIONS.CONVERSATION_ITEM_SELECTED:

        if (event.payload.hasOwnProperty('user')) {
          type = 'user';
          item = event.payload.user;
          this.selectedUser = item;
          this.selectedGroup = undefined;
        } else {
          type = 'group';
          item = event.payload.group;
          this.selectedGroup = item;
          this.selectedUser = undefined;
        }
        break;
    }

    this.item = item;
    if (type === 'group') {
      if (!item.hasJoined) {

        const publicGroup: CometChat.Group = new CometChat.Group(item.guid, item.name, item.type);
        Object.assign(publicGroup as CometChat.Group, item);

        CometChat.joinGroup(publicGroup).then(group => {
          this.actionPerformed.emit({ action: SIDEBAR_ACTIONS.ITEM_SELECTED, payload: { item, type } });
        }, error => {
          if (error.code === 'ERR_ALREADY_JOINED') {

            this.actionPerformed.emit({ action: SIDEBAR_ACTIONS.ITEM_SELECTED, payload: { item, type } });
          } else {
            // TODO show log error in joining the public group.
          }

        });
      } else {

        this.actionPerformed.emit({ action: SIDEBAR_ACTIONS.ITEM_SELECTED, payload: { item, type } });
      }

    } else {
      this.actionPerformed.emit({ action: SIDEBAR_ACTIONS.ITEM_SELECTED, payload: { item, type } });
    }

  }

  /**
   * Handles navigation change
   * @param event: {action:string, payload:object}
   */
  handleNavigationChange(event) {
    if (event.action === NAVIGATION_MENU_ACTIONS.TAB_CHANGED) {
      this.actionPerformed.emit({ action: NAVIGATION_MENU_ACTIONS.TAB_CHANGED, payload: event.payload });
      this.selectedTab = event.payload.item;
    }
  }


}
