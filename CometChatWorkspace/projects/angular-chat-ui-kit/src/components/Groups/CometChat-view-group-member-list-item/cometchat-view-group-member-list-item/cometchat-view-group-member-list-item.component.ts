import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { EDIT_SCOPE_ICON } from "../../../resources/icons/editScopeIcon";
import { BAN_ICON } from "../../../resources/icons/banIcon";
import { KICK_ICON } from "../../../resources/icons/kickIcon";
import { RIGHT_TICK_ICON } from "../../../resources/icons/rightTickIcon";
import { CLOSE_ICON } from "../../../resources/icons/closeIcon";
import { STRING_MESSAGES } from "../../../utils/messageConstants";
@Component({
  selector: "cometchat-view-group-member-list-item",
  templateUrl: "./cometchat-view-group-member-list-item.component.html",
  styleUrls: ["./cometchat-view-group-member-list-item.component.css"],
})
export class CometChatViewGroupMemberListItemComponent implements OnInit {
  @Input() item = null;
  @Input() type = null;
  @Input() member = null;
  @Input() loggedInUser = null;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  scope;
  showChangeScope: boolean = false;
  roles = {};
  roleCodes = [];
  hasGreaterRole: boolean = false;

  PARTICIPANT = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
  YOU: String = STRING_MESSAGES.YOU;

  editScopeIcon = EDIT_SCOPE_ICON;
  banIcon = BAN_ICON;
  kickIcon = KICK_ICON;
  rightTick = RIGHT_TICK_ICON;
  closeIcon = CLOSE_ICON;

  constructor() {}

  ngOnInit() {
    //this.getLoggedInUserInfo();

    this.scope = this.member.scope;

    //checking if logged in user is owner
    if (this.item.owner == this.loggedInUser.uid) {
      this.item.scope = STRING_MESSAGES.OWNER;
    }

    // checking if the current member passed to member view is an owner
    if (this.item.owner == this.member.uid) {
      this.member.scope = STRING_MESSAGES.OWNER;
    }

    this.setRoles();

    if (
      this.checkRoleAuthorityLevel(this.item) >
      this.checkRoleAuthorityLevel(this.member)
    ) {
      this.hasGreaterRole = true;
    }
  }

  /**
   * returns the level of authority on current item on the group
   * @param
   */
  checkRoleAuthorityLevel(item) {
    if (item.scope == STRING_MESSAGES.OWNER) {
      return 4;
    }

    if (item.scope == CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
      return 3;
    }

    if (item.scope == CometChat.GROUP_MEMBER_SCOPE.MODERATOR) {
      return 2;
    }

    if (item.scope == CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
      return 1;
    }

    return 1;
  }

  /**
   * Sets the values for the roles dropdown
   * @param
   */
  setRoles() {
    this.roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN] =
      STRING_MESSAGES.ADMINISTRATOR;
    this.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR] =
      STRING_MESSAGES.MODERATOR;
    this.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT] =
      STRING_MESSAGES.PARTICIPANT;

    this.roleCodes = [
      CometChat.GROUP_MEMBER_SCOPE.ADMIN,
      CometChat.GROUP_MEMBER_SCOPE.MODERATOR,
      CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
    ];
  }

  /**
   * Closes or opens  the edit scope dropdown field
   * @param
   */
  toggleChangeScope(show) {
    this.showChangeScope = show;
  }

  /**
   * Closes or opens  the edit scope dropdown field
   * @param Event event
   */
  scopeChangeHandler(event) {
    this.scope = event.target.value;
  }

  /**
   * emits an event to update the scope of the current member
   * @param
   */
  updateMemberScope = () => {
    this.actionGenerated.emit({
      type: enums.CHANGE_SCOPE,
      payLoad: { member: this.member, scope: this.scope },
    });
    this.toggleChangeScope(false);
  };

  /**
   * emits an event to ban  the current member
   * @param
   */
  banMember = () => {
    this.actionGenerated.emit({
      type: enums.BAN,
      payLoad: { member: this.member, scope: this.scope },
    });
  };

  /**
   * emits an event to kick the current member out of the group
   * @param
   */
  kickMember = () => {
    this.actionGenerated.emit({
      type: enums.KICK,
      payLoad: { member: this.member, scope: this.scope },
    });
  };
}
