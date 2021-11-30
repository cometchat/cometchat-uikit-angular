import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { checkMessageForExtensionsData } from "../../../../../utils/common";
import * as enums from "../../../../../utils/enums";
import { logger } from "../../../../../utils/common";
@Component({
  selector: "cometchat-receiver-poll-message-bubble",
  templateUrl: "./cometchat-receiver-poll-message-bubble.component.html",
  styleUrls: ["./cometchat-receiver-poll-message-bubble.component.css"],
})
export class CometChatReceiverPollMessageBubbleComponent implements OnInit {
  @Input() messageDetails = null;
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
  checkReaction = [];

  GROUP: String = CometChat.RECEIVER_TYPE.GROUP;

  constructor() {}

  ngOnInit() {
    try {
      this.checkReaction = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );

      this.checkPollExtension();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Displays the poll component , only if it is enabled
   */
  checkPollExtension() {
    try {
      if (this.messageDetails.hasOwnProperty(enums.METADATA)) {
        if (
          this.messageDetails[enums.METADATA].hasOwnProperty(enums.INJECTED)
        ) {
          if (
            this.messageDetails[enums.METADATA][enums.INJECTED].hasOwnProperty(
              enums.EXTENSIONS
            )
          ) {
            if (
              this.messageDetails[enums.METADATA][enums.INJECTED][
                enums.EXTENSIONS
              ].hasOwnProperty(enums.POLLS)
            ) {
              this.isPollExtensionEnabled = true;
              this.setPollExtensionData();
            }
          }
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sets Poll Data
   * @param
   */
  setPollExtensionData() {
    try {
      this.pollExtensionData = this.messageDetails[enums.METADATA][
        enums.INJECTED
      ][enums.EXTENSIONS][enums.POLLS];

      this.pollId = this.pollExtensionData.id;

      this.totalVotes = this.pollExtensionData.results.total;

      let optionKeys = Object.keys(this.pollExtensionData.options);

      let optionList = [];
      optionKeys.forEach((currentItem) => {
        const optionData = this.pollExtensionData.results.options[currentItem];
        const vote = optionData[enums.COUNT];
        let calculatedPercent = 0;

        if (this.totalVotes > 0) {
          calculatedPercent = Math.round((vote / this.totalVotes) * 100);
        }

        let selectedByLoggedInUser = false;
        if (optionData.hasOwnProperty(enums.VOTERS)) {
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
    } catch (error) {
      logger(error);
    }
  }

  /**
   * sends the  answer selected by the user for the  the poll question
   * @param Any selectedOption
   */
  answerPollQuestion(selectedOption) {
    try {
      this.selectedOption = selectedOption;

      CometChat.callExtension(enums.POLLS, enums.POST, enums.V1_VOTE, {
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
          logger("answerPollQuestion error", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    try {
      this.actionGenerated.emit(action);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * dynamically applies styles based on coditions
   * @param Event action
   */
  getStyles(key = null, data = null) {
    try {
      switch (key) {
        case enums.ANSWER_WRAPPER_STYLE: {
          if (data.id !== this.selectedOption.id) {
            return { background: "none" };
          }

          break;
        }
      }

      return {};
    } catch (error) {
      logger(error);
    }
  }
}
