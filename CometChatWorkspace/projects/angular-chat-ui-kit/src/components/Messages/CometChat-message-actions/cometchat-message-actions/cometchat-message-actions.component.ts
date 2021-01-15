import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { REACTION_ICON } from "../../../resources/icons/reaction";
@Component({
  selector: "cometchat-message-actions",
  templateUrl: "./cometchat-message-actions.component.html",
  styleUrls: ["./cometchat-message-actions.component.css"],
})
export class CometChatMessageActionsComponent implements OnInit {
  @Input() MessageDetails = null;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  @Input() showToolTip: boolean = true;

  @Input() pollView: boolean = false;

  loggedInUser;

  showOnlyReplyButton: boolean = false;
  receivedMessage: boolean = false;
  showReplyOption: boolean = true;
  threadView: boolean = false;
  reactionIcon = REACTION_ICON;

  constructor() {}

  ngOnInit() {
    if (this.MessageDetails.hasOwnProperty("parentMessageId")) {
      //you cannot reply any message inside thread window
      this.showReplyOption = false;
      this.threadView = true;
    }

    let user = CometChat.getLoggedinUser().then((user) => {
      this.loggedInUser = user;

      //for the message that is received , only show the reply button in tooltip
      if (this.MessageDetails.sender.uid !== this.loggedInUser.uid) {
        this.showOnlyReplyButton = true;
        this.receivedMessage = true;
      }
    });
  }

  /**
   * Generates an action to reply to the current message
   *
   */
  replyToMessage() {
    this.actionGenerated.emit({
      type: enums.VIEW_MESSAGE_THREAD,
      payLoad: this.MessageDetails,
    });
  }

  /**
   * Generates an action to edit  the current message
   *
   */
  editMessage() {
    this.actionGenerated.emit({
      type: enums.EDIT_MESSAGE,
      payLoad: this.MessageDetails,
    });
  }

  /**
   * Generates an action to Delete  the current message
   *
   */
  deleteMessage() {
    this.actionGenerated.emit({
      type: enums.DELETE_MESSAGE,
      payLoad: this.MessageDetails,
    });
  }

  /**
   * Generates an action to send Regular Reactions the current message
   *
   */
  sendReaction() {
    this.actionGenerated.emit({
      type: enums.REACT_TO_MESSAGE,
      payLoad: this.MessageDetails,
    });
  }
}
