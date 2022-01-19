import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-ban-group-member-list-item",
  templateUrl: "./cometchat-ban-group-member-list-item.component.html",
  styleUrls: ["./cometchat-ban-group-member-list-item.component.css"],
})
export class CometChatBanGroupMemberListItemComponent implements OnInit {
  @Input() item: any = null;
  @Input() bannedMemberList = [];
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  decoratorMessage = COMETCHAT_CONSTANTS.LOADING_MESSSAGE;
  displayDecoratorMessage: boolean = true;
  membersToBan = [];
  membersToUnban = [];

  BANNED_MEMBERS: String = COMETCHAT_CONSTANTS.BANNED_MEMBERS;
  NAME: String = COMETCHAT_CONSTANTS.NAME;
  SCOPE: String = COMETCHAT_CONSTANTS.SCOPE;
  UNBAN: String = COMETCHAT_CONSTANTS.UNBAN;

  constructor() {}

  ngOnInit() {
    try {
      if (this.bannedMemberList.length === 0) {
        this.decoratorMessage = COMETCHAT_CONSTANTS.NO_BANNED_MEMBERS_FOUND;
      } else if (this.bannedMemberList.length > 0) {
        this.displayDecoratorMessage = false;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Get the detail of member to be unbanned
   * @param
   */
  unbanMember(memberToUnBan: any) {
    try {
      const guid = this.item.guid;
      CometChat.unbanGroupMember(guid, memberToUnBan.uid)
        .then((response) => {
          if (response) {
            logger("Group member unbanning success with response", response);
            this.actionGenerated.emit({
              type: enums.UNBAN_GROUP_MEMBERS,
              payLoad: [memberToUnBan],
            });
          }
        })
        .catch((error) => {
          logger("Group member banning failed with error", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action: any) {
    try {
      let data = action.payLoad;

      switch (action.type) {
        case enums.UNBAN:
          this.unbanMember(data.member);
          break;
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * If User scrolls to the bottom of the current Contact list than fetch next items of the contact list and append
   * @param Event e
   */
  handleScroll(e: any) {
    try {
      const bottom =
        Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
        Math.round(e.currentTarget.clientHeight);
      if (bottom) {
        this.actionGenerated.emit({
          type: enums.FETCH_BANNED_MEMBERS,
        });
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Emits action to Close Ban member Window
   */
  closeBanMemberModal() {
    try {
      this.actionGenerated.emit({ type: enums.BAN_MEMBER, payLoad: [] });
    } catch (error) {
      logger(error);
    }
  }
}
