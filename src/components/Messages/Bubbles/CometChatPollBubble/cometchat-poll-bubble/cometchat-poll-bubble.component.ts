import { Component, OnInit, Input, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { ExtensionURLs, MetadataKey } from '../../../../Shared/Constants/UIKitConstants';
import { CometChat } from '@cometchat-pro/chat';
import { checkMessageForExtensionsData, checkHasOwnProperty } from '../../../../Shared/Helpers/CometChatHelper';
import { pollBubbleStyle } from '../../styles';
import { CometChatMessageEvents } from '../../../CometChatMessageEvents.service';
import { CometChatTheme, fontHelper } from '../../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme';
@Component({
  selector: 'cometchat-poll-bubble',
  templateUrl: './cometchat-poll-bubble.component.html',
  styleUrls: ['./cometchat-poll-bubble.component.scss']
})
export class CometChatPollBubbleComponent implements OnInit, OnChanges {
  @Input() messageObject: CometChat.BaseMessage | null = null;
  @Input() title: string = "";
  @Input() subTitle: string = "";
  @Input() pollQuestion: string = "";
  @Input() totalVoteCount: number = 0;
  @Input() optionBackgroundIcon:string = 'assets/resources/checkmark.svg';
  @Input() loggedInUserUid:string = "";
  @Input() theme: CometChatTheme = new CometChatTheme({});
  isPollExtensionEnabled: boolean = true;
  pollId:string = "";
  pollExtensionData: any = null;
  pollOptions: any[] = [];
  totalVotes:number = 0;
  selectedOption: any = null;
  checkReaction: any[]= [];
  @Input() style: pollBubbleStyle = {
    width: "100%",
    height: "auto",
    border: "0 none",
    borderRadius: "12px",
    background: "",
    votePercentTextFont:"",
    votePercentTextColor:"",
    pollQuestionTextFont: "500 12px Inter, sans-serif",
    pollQuestionTextColor: "#39f",
    pollOptionTextFont: "400 15px Inter,sans-serif",
    pollOptionTextColor: "#39f",
    pollOptionBackground: "#fff",
    optionsIconTint:"rgba(20, 20, 20, 0.58)",
    totalVoteCountTextFont: "400 13px Inter,sans-serif",
    totalVoteCountTextColor: "#fff",
    selectedPollOptionBackground:""
  };
  GROUP :string = "Group";
  constructor(private ref:ChangeDetectorRef, private messageEvents:CometChatMessageEvents) {}
  ngOnChanges(changes: SimpleChanges): void {
    try {
      this.checkReaction = checkMessageForExtensionsData(
        (this.messageObject as CometChat.BaseMessage),
        MetadataKey.extensions.reactions
      );
      this.checkPollExtension();
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  ngOnInit() {
    

  }
  
  /**
   * Displays the poll component , only if it is enabled
   */
  checkPollExtension() {
    try {
      if (checkHasOwnProperty(this.messageObject,MetadataKey.metadata)) {
        if (
          checkHasOwnProperty((this.messageObject as any)[MetadataKey.metadata],MetadataKey.injected)
        ) {
          if (
            checkHasOwnProperty((this.messageObject as any)[MetadataKey.metadata][MetadataKey.injected],
              MetadataKey.extension
            )
          ) {
            if (
              (this.messageObject as any)[MetadataKey.metadata][MetadataKey.injected]
              [MetadataKey.extension]
              [MetadataKey.extensions.polls]
            ) {
              this.isPollExtensionEnabled = true;
              this.setPollExtensionData();
            }
          }
        }
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * Sets Poll Data
   * @param
   */
  setPollExtensionData() {
    try {
      this.pollExtensionData = (this.messageObject as any)[MetadataKey.metadata][MetadataKey.injected][MetadataKey.extension][MetadataKey.extensions.polls];
      this.pollId = this.pollExtensionData.id;
      this.totalVotes = this.pollExtensionData.results.total;
      let optionKeys = Object.keys(this.pollExtensionData.options);
      let optionList: any = [];
      optionKeys.forEach((currentItem) => {
        const optionData = this.pollExtensionData.results.options[currentItem];
        const vote = optionData["count"];
        let calculatedPercent = 0;
        if (this.totalVotes > 0) {
          calculatedPercent = Math.round((vote / this.totalVotes) * 100);
        }
        let selectedByLoggedInUser = false;
        if (checkHasOwnProperty(optionData,"voters")) {
          if (checkHasOwnProperty(optionData.voters,this.loggedInUserUid)) {
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
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * sends the  answer selected by the user for the  the poll question
   * @param Any selectedOption
   */
  answerPollQuestion(selectedOption: any) {
      try {
      if(this.loggedInUserUid != this.messageObject?.getSender().getUid()){
        this.selectedOption = selectedOption;
        this.ref.detectChanges()
      CometChat.callExtension( "polls" , "POST", "v2/vote", {
        vote: selectedOption.id,
        id: this.pollId,
      })
      }
      else{
        return
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action: any) {
    try {
    } catch (error:any) {
      this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * dynamically applies styles based on coditions
   * @param Event action
   */
  pollBubbleStyle: any = {
      messageContainer: () => {
        return {
          background: "transparent",
          height: this.style.height,
          width: this.style.width,
        }
      },
      setvotePercentageStyle:()=>{
        return {
          font: this.style.votePercentTextFont || fontHelper(this.theme.typography.subtitle1),
          color: this.style.votePercentTextColor || this.theme.palette.getAccent600("light"),
        };
      },
      setPollOptionStyle:()=>{
        return {
          font: this.style.pollOptionTextFont || fontHelper(this.theme.typography.subtitle1),
          color: this.style.pollOptionTextColor || this.theme.palette.getAccent("light"),
        };
      },
      percentageBackground: () => {
        return {
          background: this.style.background,
        }
      },
      pollResultStyle: () => {
        let justifyContent = { justifyContent: "flex-start" };
          return {
            font: this.style.totalVoteCountTextFont || fontHelper(this.theme.typography.subtitle2),
            color: this.style.totalVoteCountTextColor || this.theme.palette.getAccent600("light"),
            ...justifyContent
          };
      },
      pollQuestion: () => {
        let justifyContent = { justifyContent: "flex-start" };
          return {
            font: this.style.pollQuestionTextFont || fontHelper(this.theme.typography.subtitle1),
            color: this.style.pollQuestionTextColor || this.theme.palette.getAccent("light"),
            borderRadius:this.style.borderRadius,
            border:this.style.border,
            ...justifyContent
          };
      },
      pollOption: (option:any) => {
        return {
          background: option.selectedByLoggedInUser ? `linear-gradient(to right, ${this.style.selectedPollOptionBackground || this.theme.palette.getPrimary()} ${option.percent}, white 0%)` : `linear-gradient(to right, ${this.style.pollOptionBackground || this.theme.palette.getAccent100("light")} ${option.percent}, white 0%)`,
          borderRadius:"8px"
        }
      },
      checkIconStyle:()=>{
        return {
          width: "24px",
          height: "24px",
          WebkitMask: `url(${this.optionBackgroundIcon})`,
          background: this.style?.optionsIconTint || this.theme.palette.getAccent600("light"),
        }
      }
    }
}