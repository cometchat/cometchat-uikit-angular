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
import * as enums from "../../../../utils/enums";
import { checkMessageForExtensionsData } from "../../../../utils/common";
import { REACTION_ICON } from "../../../../resources/icons/reaction";
import { STRING_MESSAGES } from "../../../../utils/messageConstants";

@Component({
  selector: "cometchat-message-reactions",
  templateUrl: "./cometchat-message-reactions.component.html",
  styleUrls: ["./cometchat-message-reactions.component.css"],
})
export class CometChatMessageReactionsComponent implements OnInit, OnChanges {
  @Input() MessageDetails = null;
  @Input() loggedInUser;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  extensionData;
  reactionsName;
  messageReactions = [];
  reactionIcon = REACTION_ICON;

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    if (change["MessageDetails"]) {
      if (
        change["MessageDetails"].previousValue !==
        change["MessageDetails"].currentValue
      ) {
        let extensionData = checkMessageForExtensionsData(
          this.MessageDetails,
          STRING_MESSAGES.REACTIONS
        );
        this.getMessageReactions(extensionData);
        // this.MessageDetails = change["MessageDetails"].currentValue;
      }
    }
  }

  ngOnInit() {
    this.extensionData = checkMessageForExtensionsData(
      this.MessageDetails,
      STRING_MESSAGES.REACTIONS
    );
    this.getMessageReactions(this.extensionData);
  }

  getMessageReactions(reaction) {
    if (reaction === null) {
      return null;
    }
    let messageReactions = [];
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
        userList.push(reactionData[user]["name"]);
      }

      if (userList.length) {
        reactionTitle = userList.join(", ");
        reactionTitle = reactionTitle.concat(" reacted");
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

  reactToMessages(emoji = null) {
    CometChat.callExtension(
      STRING_MESSAGES.REACTIONS,
      STRING_MESSAGES.POST,
      STRING_MESSAGES.V1_REACT,
      {
        msgId: this.MessageDetails.id,
        emoji: emoji.colons || emoji.reactionName,
      }
    )
      .then((response) => {
        // Reaction added successfully
      })
      .catch((error) => {
        // Some error occured
      });
  }

  triggerEmojiClick(event) {
    event.stopPropagation();
  }

  sendReaction() {
    this.actionGenerated.emit({
      type: enums.REACT_TO_MESSAGE,
      payLoad: this.MessageDetails,
    });
  }
}
