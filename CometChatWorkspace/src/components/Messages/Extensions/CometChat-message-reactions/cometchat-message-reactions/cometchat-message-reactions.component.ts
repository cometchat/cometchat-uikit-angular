import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  SimpleChanges,
  OnChanges,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../../utils/enums";
import {
  checkMessageForExtensionsData,
  logger,
} from "../../../../../utils/common";
import { REACTION_ICON } from "./resources/reaction";
import { COMETCHAT_CONSTANTS } from "../../../../../utils/messageConstants";

@Component({
  selector: "cometchat-message-reactions",
  templateUrl: "./cometchat-message-reactions.component.html",
  styleUrls: ["./cometchat-message-reactions.component.css"],
})
export class CometChatMessageReactionsComponent implements OnInit, OnChanges {
  @Input() messageDetails: any = null;
  @Input() loggedInUser: any;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  extensionData: any;
  reactionsName: any;
  messageReactions: any;
  reactionIcon = REACTION_ICON;

  emojiSize: number = 16;

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.MESSAGE_DETAILS]) {
        if (
          change[enums.MESSAGE_DETAILS].previousValue !==
          change[enums.MESSAGE_DETAILS].currentValue
        ) {
          let extensionData = checkMessageForExtensionsData(
            this.messageDetails,
            enums.REACTIONS
          );
          this.getMessageReactions(extensionData);
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    try {
      this.extensionData = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );
      this.getMessageReactions(this.extensionData);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * fetches the reactions that are already present on the current message
   */
  getMessageReactions(reaction: any) {
      if (reaction === null) {
        return null;
      }
      let messageReactions: any = [];
      Object.keys(reaction).map((data, key) => {
        const reactionData = reaction[data];
        const reactionCount = Object.keys(reactionData).length;

        let showBlueOutline = false;
        if (reactionData.hasOwnProperty(this.loggedInUser.uid)) {
          showBlueOutline = true;
        }

        const reactionName = data;
        let messageReaction;

        const userList = [];
        let reactionTitle = "";

        for (const user in reactionData) {
          userList.push(reactionData[user][enums.NAME]);
        }

        if (userList.length) {
          reactionTitle = userList.join(", ");
          reactionTitle = reactionTitle.concat(
            ` ${COMETCHAT_CONSTANTS.REACTED}`
          );
        }

        if (reactionCount) {
          messageReaction = {
            reactionName,
            reactionCount,
            reactionTitle,
            showBlueOutline,
          };
        } else {
          messageReaction = { reactionName, reactionTitle, showBlueOutline };
        }

        messageReactions.push(messageReaction);
      });
      this.messageReactions = messageReactions;
      return;
  }

  /**
   * helps to react to a message
   */
  reactToMessages(emoji: any = null) {
    try {
      CometChat.callExtension(enums.REACTIONS, enums.POST, enums.V1_REACT, {
        msgId: this.messageDetails.id,
        emoji: emoji.colons || emoji.reactionName,
      })
        .then((response) => {
          // Reaction added successfully
        })
        .catch((error) => {
          // Some error occured
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * stops the emoji click even from bubbling
   */
  triggerEmojiClick(event: any) {
    try {
      event.stopPropagation();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * emits an action to send reaction to the current message
   */
  sendReaction() {
    try {
      this.actionGenerated.emit({
        type: enums.REACT_TO_MESSAGE,
        payLoad: this.messageDetails,
      });
    } catch (error) {
      logger(error);
    }
  }
}
