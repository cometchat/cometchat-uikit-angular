import { Component, Input, OnInit, Output, EventEmitter, SimpleChanges, OnChanges } from "@angular/core";
import {
  checkMessageForExtensionsData,
  logger,
} from "../../../../../utils/common";
import * as enums from "../../../../../utils/enums";

@Component({
  selector: "cometchat-sender-poll-message-bubble",
  templateUrl: "./cometchat-sender-poll-message-bubble.component.html",
  styleUrls: ["./cometchat-sender-poll-message-bubble.component.css"],
})
export class CometChatSenderPollMessageBubbleComponent implements OnInit,OnChanges {
  @Input() messageDetails: any = null;
  @Input() showReplyCount = true;
  @Input() loggedInUser: any;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  @Input() showToolTip = true;

  isPollExtensionEnabled: boolean = false;
  checkReaction = [];

  pollExtensionData: any = null;
  pollOptions: any = [];
  totalVotes = 0;

  constructor() {}
  ngOnChanges(changes: SimpleChanges){
    try {
      this.checkPollExtension();
      this.checkReaction = checkMessageForExtensionsData(
        this.messageDetails,
        enums.REACTIONS
      );
    } catch (error) {
      logger(error);
    }
  
  }

  ngOnInit() {
    // try {
    //   this.checkPollExtension();
    //   this.checkReaction = checkMessageForExtensionsData(
    //     this.messageDetails,
    //     enums.REACTIONS
    //   );
    // } catch (error) {
    //   logger(error);
    // }
  }

  /**
   * Displays the poll component , only if it is enabled
   * @param
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

      this.totalVotes = this.pollExtensionData.results.total;

      let optionKeys = Object.keys(this.pollExtensionData.options);

      let optionList: any = [];
      optionKeys.forEach((currentItem) => {
        const optionData = this.pollExtensionData.results.options[currentItem];
        const vote = optionData[enums.COUNT];
        let calculatedPercent = 0;

        if (this.totalVotes > 0) {
          calculatedPercent = Math.round((vote / this.totalVotes) * 100);
        }

        optionList.push({
          id: currentItem,
          percent: calculatedPercent + "%",
          text: this.pollExtensionData.options[currentItem],
        });
      });

      this.pollOptions = [...optionList];
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
      this.actionGenerated.emit(action);
    } catch (error) {
      logger(error);
    }
  }
}
