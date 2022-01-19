import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../utils/enums";
import { EDIT_SCOPE_ICON } from "./resources/editScopeIcon";
import { BAN_ICON } from "./resources/banIcon";
import { KICK_ICON } from "./resources/kickIcon";
import { RIGHT_TICK_ICON } from "./resources/rightTickIcon";
import { CLOSE_ICON } from "./resources/closeIcon";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";
@Component({
  selector: "cometchat-view-group-member-list-item",
  templateUrl: "./cometchat-view-group-member-list-item.component.html",
  styleUrls: ["./cometchat-view-group-member-list-item.component.css"],
})
export class CometChatViewGroupMemberListItemComponent implements OnInit {
  @Input() item: any = null;
  @Input() type: string = '';
  @Input() member: any = null;
  @Input() loggedInUser: any = null;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  scope: any;
  showChangeScope: boolean = false;
  roles: any = {};
  roleCodes: any = [];
  hasGreaterRole: boolean = false;

  PARTICIPANT = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
  YOU: String = COMETCHAT_CONSTANTS.YOU;

  editScopeIcon = EDIT_SCOPE_ICON;
  banIcon = BAN_ICON;
  kickIcon = KICK_ICON;
  rightTick = RIGHT_TICK_ICON;
  closeIcon = CLOSE_ICON;

  constructor() {}

  ngOnInit() {
    try {
      this.scope = this.member.scope;

      //checking if logged in user is owner
      if (this.item.owner == this.loggedInUser.uid) {
        this.item.scope = COMETCHAT_CONSTANTS.OWNER;
      }

      // checking if the current member passed to member view is an owner
      if (this.item.owner == this.member.uid) {
        this.member.scope = COMETCHAT_CONSTANTS.OWNER;
      }

      this.setRoles();

      if (
        this.checkRoleAuthorityLevel(this.item) >
        this.checkRoleAuthorityLevel(this.member)
      ) {
        this.hasGreaterRole = true;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * returns the level of authority on current item on the group
   * @param
   */
  checkRoleAuthorityLevel(item: any) {
      if (item.scope == COMETCHAT_CONSTANTS.OWNER) {
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
    try {
      this.roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN] =
        COMETCHAT_CONSTANTS.ADMINISTRATOR;
      this.roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR] =
        COMETCHAT_CONSTANTS.MODERATOR;
      this.roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT] =
        COMETCHAT_CONSTANTS.PARTICIPANT;

      this.roleCodes = [
        CometChat.GROUP_MEMBER_SCOPE.ADMIN,
        CometChat.GROUP_MEMBER_SCOPE.MODERATOR,
        CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
      ];
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Closes or opens  the edit scope dropdown field
   * @param
   */
  toggleChangeScope(show: any) {
    try {
      this.showChangeScope = show;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Closes or opens  the edit scope dropdown field
   * @param Event event
   */
  scopeChangeHandler(event: any) {
    try {
      this.scope = event.target.value;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * emits an event to update the scope of the current member
   * @param
   */
  updateMemberScope = () => {
    try {
      this.actionGenerated.emit({
        type: enums.CHANGE_SCOPE,
        payLoad: { member: this.member, scope: this.scope },
      });
      this.toggleChangeScope(false);
    } catch (error) {
      logger(error);
    }
  };

  /**
   * emits an event to ban  the current member
   * @param
   */
  banMember = () => {
    try {
      this.actionGenerated.emit({
        type: enums.BAN,
        payLoad: { member: this.member, scope: this.scope },
      });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * emits an event to kick the current member out of the group
   * @param
   */
  kickMember = () => {
    try {
      this.actionGenerated.emit({
        type: enums.KICK,
        payLoad: { member: this.member, scope: this.scope },
      });
    } catch (error) {
      logger(error);
    }
  };
}
