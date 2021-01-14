import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import * as enums from "../../../utils/enums";
@Component({
  selector: "cometchat-nav-bar",
  templateUrl: "./cometchat-nav-bar.component.html",
  styleUrls: ["./cometchat-nav-bar.component.css"],
})
export class CometChatNavBarComponent implements OnInit {
  @Input() item = null;
  @Input() type = null;
  @Input() lastMessage;
  @Input() enableSelectedGroupStyling = false;
  @Input() groupToUpdate = null;
  @Input() groupToLeave = null;
  @Input() groupToDelete = null;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  @Output() onUserClick: EventEmitter<any> = new EventEmitter();

  displayConversationList: boolean = true;
  displayGroupList: boolean = false;
  displayUserList: boolean = false;
  displayUserInfoScreen: boolean = false;

  groupMessage = [];
  curentItem;
  constructor() {}

  ngOnInit() {}

  /**
   * Toggles the List to be opened on user clicked
   * @param
   */
  checkScreen(type) {
    this.displayConversationList = type === "conversationList" ? true : false;
    this.displayGroupList = type === "groupList" ? true : false;
    this.displayUserList = type === "userList" ? true : false;
    this.displayUserInfoScreen = type === "infoScreen" ? true : false;
  }

  /**
   * Opens ConversationList
   */
  openConversationList() {
    this.checkScreen("conversationList");
    this.closeDetailView();
  }

  /**
   * Opens GroupList
   */
  openGroupList() {
    this.checkScreen("groupList");
    this.closeDetailView();
  }

  /**
   * Opens userlist
   */
  openUserList() {
    this.checkScreen("userList");
    this.closeDetailView();
  }

  /**
   * Opens User Info Screnn
   */
  openUserInfoScreen() {
    this.checkScreen("infoScreen");
    this.closeDetailView();
  }

  /**
   * Closes Detail View when tab is changed
   */
  closeDetailView() {
    this.actionGenerated.emit({
      type: enums.TAB_CHANGED,
    });
  }

  /**
   * Listen to the user emitted by the userList component
   * @param Event user
   */
  userClicked(user) {
    if (user.hasOwnProperty("conversationWith")) {
      this.item = user.conversationWith;
      this.curentItem = this.item;
    } else {
      this.item = user;
      this.curentItem = this.item;
    }
    if (this.item.hasOwnProperty("uid")) {
      this.type = "user";
    } else {
      this.type = "group";
    }
    this.lastMessage = user.lastMessage;
    this.onUserClick.emit(this.item);
  }

  /**
   * Listen to the group emitted by the groupList component
   * @param Event user
   */
  groupClicked(group) {
    this.item = group;
    this.curentItem = this.item;

    //Close Thread And User Detail Screen When Chat Window Is Changed
    //this.closeThreadMessages();
    //this.viewDetailScreen = false;

    if (this.item.hasOwnProperty("uid")) {
      this.type = "user";
    } else {
      this.type = "group";
    }

    this.onUserClick.emit(this.item);
  }
}
