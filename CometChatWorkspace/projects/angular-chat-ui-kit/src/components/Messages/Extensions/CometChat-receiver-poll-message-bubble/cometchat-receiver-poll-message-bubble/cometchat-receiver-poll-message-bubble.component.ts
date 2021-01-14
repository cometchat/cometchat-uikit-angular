import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { checkMessageForExtensionsData } from "../../../../utils/common";
import * as enums from "../../../../utils/enums";
import { STRING_MESSAGES } from "../../../../utils/messageConstants";
@Component({
  selector: "cometchat-receiver-poll-message-bubble",
  templateUrl: "./cometchat-receiver-poll-message-bubble.component.html",
  styleUrls: ["./cometchat-receiver-poll-message-bubble.component.css"],
})
export class CometChatReceiverPollMessageBubbleComponent implements OnInit {
  @Input() MessageDetails = null;
  @Input() showReplyCount = true;

  @Input() loggedInUserUid = "";
  @Input() loggedInUser;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  @Input() showToolTip = true;

  isPollExtensionEnabled: boolean = false;
  pollId = "";
  pollExtensionData = null;
  pollOptions = [];
  totalVotes = 0;
  selectedOption = null;
  checkReaction: boolean = false;

  constructor() {}

  ngOnInit() {
    this.checkReaction = checkMessageForExtensionsData(
      this.MessageDetails,
      STRING_MESSAGES.REACTIONS
    );

    this.checkPollExtension();
  }

  /**
   * Displays the poll component , only if it is enabled
   * @param Event action
   */
  checkPollExtension() {
    if (this.MessageDetails.hasOwnProperty("metadata")) {
      if (this.MessageDetails.metadata.hasOwnProperty("@injected")) {
        if (
          this.MessageDetails.metadata["@injected"].hasOwnProperty("extensions")
        ) {
          if (
            this.MessageDetails.metadata["@injected"][
              "extensions"
            ].hasOwnProperty("polls")
          ) {
            this.isPollExtensionEnabled = true;
            this.setPollExtensionData();
          }
        }
      }
    }
  }

  /**
   * Sets Poll Data
   * @param
   */
  setPollExtensionData() {
    this.pollExtensionData = this.MessageDetails.metadata["@injected"][
      "extensions"
    ]["polls"];

    this.pollId = this.pollExtensionData.id;

    this.totalVotes = this.pollExtensionData.results.total;

    let optionKeys = Object.keys(this.pollExtensionData.options);

    let optionList = [];
    optionKeys.forEach((currentItem) => {
      // Add Percentage calculation logic
      const optionData = this.pollExtensionData.results.options[currentItem];
      const vote = optionData["count"];
      let calculatedPercent = 0;

      if (this.totalVotes > 0) {
        calculatedPercent = Math.round((vote / this.totalVotes) * 100);
      }

      let selectedByLoggedInUser = false;
      if (optionData.hasOwnProperty("voters")) {
        if (optionData.voters.hasOwnProperty(this.loggedInUserUid)) {
          selectedByLoggedInUser = true;
        }
      }

      optionList.push({
        id: currentItem,
        percent: calculatedPercent + "%",
        text: this.pollExtensionData.options[currentItem],
        selectedByLoggedInUser,
      });
    });

    this.pollOptions = [...optionList];
  }

  /**
   * sends the  answer selected by the user for the  the poll question
   * @param Any selectedOption
   */
  answerPollQuestion(selectedOption) {
    this.selectedOption = selectedOption;

    CometChat.callExtension("polls", "POST", "v1/vote", {
      vote: selectedOption.id,
      id: this.pollId,
    })
      .then((response) => {
        this.actionGenerated.emit({
          type: enums.POLL_ANSWERED,
          payLoad: response,
        });
      })
      .catch((error) => {
        console.log("answerPollQuestion error", error);
      });
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    this.actionGenerated.emit(action);
  }

  /**
   * dynamically applies styles based on coditions
   * @param Event action
   */
  getStyles(key = null, data = null) {
    switch (key) {
      case "answerWrapperStyle": {
        if (data.id !== this.selectedOption.id) {
          return { background: "none" };
        }

        break;
      }
    }

    //return { background: "none" };
    return {};
  }
}
