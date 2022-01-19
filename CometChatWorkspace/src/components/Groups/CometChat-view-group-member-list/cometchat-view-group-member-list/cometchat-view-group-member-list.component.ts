import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";
@Component({
  selector: "cometchat-view-group-member-list",
  templateUrl: "./cometchat-view-group-member-list.component.html",
  styleUrls: ["./cometchat-view-group-member-list.component.css"],
})
export class CometChatViewGroupMemberListComponent implements OnInit {
  @Input() item: any = null;
  @Input() type: string = '';
  @Input() loggedInUser = null;
  @Input() memberList = [];

  PARTICIPANT = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
  NAME: String = COMETCHAT_CONSTANTS.NAME;
  SCOPE: String = COMETCHAT_CONSTANTS.SCOPE;
  GROUP_MEMBERS: String = COMETCHAT_CONSTANTS.GROUP_MEMBERS;
  BAN: String = COMETCHAT_CONSTANTS.BAN;
  KICK: String = COMETCHAT_CONSTANTS.KICK;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action: any) {
    try {
      let data = action.payLoad;

      switch (action.type) {
        case enums.CHANGE_SCOPE: {
          this.changeScope(data.member, data.scope);
          break;
        }
        case enums.BAN: {
          this.banMember(data.member);
          break;
        }
        case enums.KICK: {
          this.kickMember(data.member);
          break;
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Changes the scope of a member of a group
   * @param Any member
   */
  changeScope = (member: any, scope: any) => {
    try {
      const guid = this.item.guid;

      CometChat.updateGroupMemberScope(guid, member.uid, scope)
        .then((response) => {
          if (response) {
            logger("updateGroupMemberScope success with response: ", response);
            const updatedMember = Object.assign({}, member, { scope: scope });
            this.actionGenerated.emit({
              type: enums.UPDATE_GROUP_PARTICIPANTS,
              payLoad: updatedMember,
            });
          }
        })
        .catch((error) => {
          logger("updateGroupMemberScope failed with error: ", error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Bans a  member of a group
   * @param Any memberToBan
   */
  banMember = (memberToBan: any) => {
    try {
      const guid = this.item.guid;
      CometChat.banGroupMember(guid, memberToBan.uid)
        .then((response) => {
          if (response) {
            logger("banGroupMember success with response: ", response);
            this.actionGenerated.emit({
              type: enums.REMOVE_GROUP_PARTICIPANTS,
              payLoad: memberToBan,
            });
          }
        })
        .catch((error) => {
          logger("banGroupMember failed with error: ", error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * kicks the member member of a group
   * @param Any memberToKick
   */
  kickMember = (memberToKick: any) => {
    try {
      const guid = this.item.guid;
      CometChat.kickGroupMember(guid, memberToKick.uid)
        .then((response) => {
          if (response) {
            logger("kickGroupMember success with response: ", response);
            this.actionGenerated.emit({
              type: enums.REMOVE_GROUP_PARTICIPANTS,
              payLoad: memberToKick,
            });
          }
        })
        .catch((error) => {
          logger("kickGroupMember failed with error: ", error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Emits an action to indicate the parent component to close the view member modal
   * @param
   */
  closeViewMemberModal() {
    try {
      this.actionGenerated.emit({
        type: enums.OPEN_VIEW_MEMBER,
        payLoad: null,
      });
    } catch (error) {
      logger(error);
    }
  }
}
