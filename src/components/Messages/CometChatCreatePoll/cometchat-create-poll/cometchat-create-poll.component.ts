import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { messageConstants } from "../../../Shared/Constants/UIKitConstants";
import { checkHasOwnProperty } from '../../../Shared/Helpers/CometChatHelper';
import { CometChatMessageEvents } from "../../CometChatMessageEvents.service";
import { style } from "../interface";
  /**
*
* CometChatCreatePoll is used to send poll options to groups and users.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-create-poll",
  templateUrl: "./cometchat-create-poll.component.html",
  styleUrls: ["./cometchat-create-poll.component.scss"],
})
export class CometChatCreatePollComponent implements OnInit {
        /**
   * This properties will come from Parent.
   */
  @Input() errorText = "";
  @Input() user: CometChat.User | null = null;
  @Input() group: CometChat.Group | null = null;
  @Input() title: string = "Create Poll";
  @Input() onClose!: () => void;
  @Input() onCreatePoll!: () => void;
  @Input() defaultAnswers: number = 2;
  @Input() questionPlaceholderText: string = "Question";
  @Input() optionPlaceholderText: string = "Answer";
  @Input() answerHelpText: string = "Set Answers";
  @Input() closeIconURL: string = "assets/resources/close2x.svg";
  @Input() deleteIconURL: string = "assets/resources/deleteicon.svg";
  @Input() addAnswerIconURL: string = "assets/resources/Plus.svg";
  @Input() AddAnswerButtonText: string = "Add Answer";
  @Input() createPollButtonText: string = "Send";
  @Input() style: style = {
    width: "100%",
    height: "100%",
    border: "",
    borderRadius: "8px",
    background: "white",
    placeholderTextFont: "",
    placeholderTextColor: "",
    deleteIconTint: "grey",
    titleFont: "700 22px Inter, sans-serif",
    titleColor: "rgb(20, 20, 20)",
    closeIconTint: "rgb(51, 153, 255)",
    questionBackground: "rgba(20, 20, 20, 0.08)",
    answerHelpTextFont: "500 12px Inter, sans-serif",
    answerHelpTextColor: "rgba(20, 20, 20, 0.58)",
    addAnswerIconTint: "rgb(51, 153, 255)",
    createPollButtonTextFont: "600 15px Inter, sans-serif",
    createPollButtonTextColor: "rgb(255, 255, 255)",
    createPollButtonBackground: "rgb(51, 153, 255)",
    addAnswerTextFont: "500 15px Inter, sans-serif",
    addAnswerTextColor: "rgb(51, 153, 255)",
    errorTextFont: "400 15px Inter, sans-serif",
    errorTextColor: "rgb(255, 59, 48)",
    optionPlaceholderTextFont: "",
    optionPlaceholderTextColor: ""
  }
     /**
     * Properties for internal use
     */
  inputQuestion: string = "";
  inputOptionItems: { key: string, value: string }[] = [];
  isError: boolean = false;
  public type: string = ""
  constructor(private messageEvents:CometChatMessageEvents) {
  }
  ngOnInit() {
    if (this.user) {
      this.type = CometChat.RECEIVER_TYPE.USER
    }
    else if (this.group) {
      this.type = CometChat.RECEIVER_TYPE.GROUP
    }
    let arr = Array(this.defaultAnswers)
    for (let i = 0; i < arr.length; i++) {
      this.addPollOption()
    }
  }
  /**
   * Used to add an extra option
   * @param
   */
  addPollOption() {
    try {
      this.inputOptionItems.push({
        key: '',
        value: ''
      });
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  /**
   * Used to remove an extra option
   * @param number index
   */
  removePollOption(index: number) {
    try {
      this.inputOptionItems.splice(index, 1);
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  /**
   * Creates the poll
   */
  createPoll(): boolean {
    try {
      let inputValue = this.inputOptionItems.map(item => item.value);
      if (this.inputQuestion.trim().length === 0) {
        this.isError = true
        this.errorText = "Question cannot be blank";
        return false;
      }
      this.isError = false
      let receiverId;
      let receiverType = this.type;
      if (this.type === CometChat.RECEIVER_TYPE.USER) {
        receiverId = this.user?.getUid();
      } else if (this.type === CometChat.RECEIVER_TYPE.GROUP) {
        receiverId = this.group?.getGuid();
      }
      let optionList: any[] = [
        ...inputValue
      ];
      CometChat.callExtension(messageConstants.POLLS, "POST", messageConstants.V2_CREATE, {
        question: this.inputQuestion,
        options: optionList,
        receiver: receiverId,
        receiverType: receiverType,
      })
        .then((response: any) => {
          this.isError = false
          if (this.onCreatePoll) {
            this.onCreatePoll()
          }
          if (response &&  checkHasOwnProperty(response,"success")   && response["success"] === true) {
            this.closePollView();
          }
        })
        .catch((error:any) => {

          this.isError = true
          this.messageEvents.publishEvents(this.messageEvents.onError, error);
          this.errorText = "Something wen wrong!";
        })
        .finally(() => {
        });
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
    return true;
  }
  /**
   * Resets Information of poll to initial conditons
   * @param
   */
  /**
   * @param  {number} count
   */
  getOptionCount(count: number): string {
    let text = this.optionPlaceholderText + " " + (count + 1)
    return text
  }
  /**
   * Emits an action to close the poll view
   * @param
   */
  closePollView() {
    try {
      if (this.onClose) {
        this.onClose()
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  /**
* Props dependent styles for the CometChatCreatePoll.
*
*/
  styles: any = {
    closeButtonStyle: () => {
      return {
        WebkitMask: `url(${this.closeIconURL})`,
        background: this.style.closeIconTint
      }
    },
    addIconStyle: () => {
      return {
        WebkitMask: `url(${this.addAnswerIconURL})`,
        background: this.style.addAnswerIconTint
      }
    },
    removeIconStyle: () => {
      return {
        WebkitMask: `url(${this.deleteIconURL})`,
        background: this.style.deleteIconTint
      }
    },
    titleStyle: () => {
      return {
        font: this.style.titleFont,
        color: this.style.titleColor
      }
    },
    subtitleStyle: () => {
      return {
        font: this.style.answerHelpTextFont,
        color: this.style.answerHelpTextColor
      }
    },
    placeHolderStyle: () => {
      return {
        font: this.style.placeholderTextFont,
        color: this.style.placeholderTextColor,
      }
    },
    optionPlaceHolderStyle: () => {
      return {
        font: this.style.optionPlaceholderTextFont,
        color: this.style.optionPlaceholderTextColor,
      }
    },
    addIconTextStyle: () => {
      return {
        font: this.style.addAnswerTextFont,
        color: this.style.addAnswerTextColor
      }
    },
    errorTextStyle: () => {
      return {
        font: this.style.errorTextFont,
        color: this.style.errorTextColor
      }
    },
    buttonTextStyle: () => {
      return {
        font: this.style.createPollButtonTextFont,
        color: this.style.createPollButtonTextColor,
        background: this.style.createPollButtonBackground
      }
    },
    createPollWrapperStyle: () => {
      return {
        height: this.style.height,
        width: this.style.width,
        background: this.style.background,
        border: this.style.border,
        borderRadius: this.style.borderRadius
      }
    },
    optionBorderStyle: () => {
      return {
        border: this.style.border || "1px solid rgba(248, 248, 248, 0.92)",
        borderRadius: this.style.borderRadius,
        background: this.style.questionBackground
      }
    }
  }
}
