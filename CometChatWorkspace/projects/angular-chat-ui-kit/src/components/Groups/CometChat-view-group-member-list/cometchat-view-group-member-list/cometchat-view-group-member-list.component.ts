import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { STRING_MESSAGES } from "../../../utils/messageConstants";
@Component({
  selector: "cometchat-view-group-member-list",
  templateUrl: "./cometchat-view-group-member-list.component.html",
  styleUrls: ["./cometchat-view-group-member-list.component.css"],
})
export class CometChatViewGroupMemberListComponent implements OnInit {
  @Input() item = null;
  @Input() type = null;
  @Input() loggedInUser = null;
  @Input() memberlist = [];

  PARTICIPANT = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
  NAME: String = STRING_MESSAGES.NAME;
  SCOPE: String = STRING_MESSAGES.SCOPE;
  GROUP_MEMBERS: String = STRING_MESSAGES.GROUP_MEMBERS;
  BAN: String = STRING_MESSAGES.BAN;
  KICK: String = STRING_MESSAGES.KICK;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
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
  }

  /**
   * Changes the scope of a member of a group
   * @param Any member
   */
  changeScope = (member, scope) => {
    const guid = this.item.guid;

    CometChat.updateGroupMemberScope(guid, member.uid, scope)
      .then((response) => {
        if (response) {
          console.log(
            "updateGroupMemberScope success with response: ",
            response
          );
          const updatedMember = Object.assign({}, member, { scope: scope });
          this.actionGenerated.emit({
            type: enums.UPDATE_GROUP_PARTICIPANTS,
            payLoad: updatedMember,
          });
        }
      })
      .catch((error) => {
        console.log("updateGroupMemberScope failed with error: ", error);
      });
  };

  /**
   * Bans a  member of a group
   * @param Any memberToBan
   */
  banMember = (memberToBan) => {
    const guid = this.item.guid;
    CometChat.banGroupMember(guid, memberToBan.uid)
      .then((response) => {
        if (response) {
          console.log("banGroupMember success with response: ", response);
          this.actionGenerated.emit({
            type: enums.REMOVE_GROUP_PARTICIPANTS,
            payLoad: memberToBan,
          });
        }
      })
      .catch((error) => {
        console.log("banGroupMember failed with error: ", error);
      });
  };

  /**
   * kicks the member member of a group
   * @param Any memberToKick
   */
  kickMember = (memberToKick) => {
    const guid = this.item.guid;
    CometChat.kickGroupMember(guid, memberToKick.uid)
      .then((response) => {
        if (response) {
          console.log("kickGroupMember success with response: ", response);
          this.actionGenerated.emit({
            type: enums.REMOVE_GROUP_PARTICIPANTS,
            payLoad: memberToKick,
          });
        }
      })
      .catch((error) => {
        console.log("kickGroupMember failed with error: ", error);
      });
  };

  /**
   * Emits an action to indicate the parent component to close the view member modal
   * @param
   */
  closeViewMemberModal() {
    // console.log("cometchat view member --> close view member clicked");
    this.actionGenerated.emit({ type: enums.OPEN_VIEW_MEMBER, payLoad: null });
  }
}
