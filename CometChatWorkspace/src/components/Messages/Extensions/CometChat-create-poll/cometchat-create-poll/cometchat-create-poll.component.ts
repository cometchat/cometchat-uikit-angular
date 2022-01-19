import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
  FormControl,
  NgControl,
} from "@angular/forms";

import { CometChat } from "@cometchat-pro/chat";
import { COMETCHAT_CONSTANTS } from "../../../../../utils/messageConstants";
import * as enums from "../../../../../utils/enums";
import { logger } from "../../../../../utils/common";
@Component({
  selector: "cometchat-create-poll",
  templateUrl: "./cometchat-create-poll.component.html",
  styleUrls: ["./cometchat-create-poll.component.css"],
})
export class CometChatCreatePollComponent implements OnInit {
  pollFormData: FormGroup;
  errorText = "";
  @Input() item: any = null;
  @Input() type: string = "";
  inputQuestion: string = ""; 
  inputOptionOne: string = "";
  inputOptionTwo: string = "";
  inputOptionItems: {key: string, value: string}[] = [];
  

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  createBtnText = COMETCHAT_CONSTANTS.CREATE;
  CREATE_POLL: String = COMETCHAT_CONSTANTS.CREATE_POLL;
  QUESTION: String = COMETCHAT_CONSTANTS.QUESTION;
  ENTER_YOUR_QUESTION: String = COMETCHAT_CONSTANTS.ENTER_YOUR_QUESTION;
  OPTIONS: String = COMETCHAT_CONSTANTS.OPTIONS;
  ENTER_YOUR_OPTION: String = COMETCHAT_CONSTANTS.ENTER_YOUR_OPTION;
  ADD_NEW_OPTION: String = COMETCHAT_CONSTANTS.ADD_NEW_OPTION;

  constructor(private fb: FormBuilder) {
    this.pollFormData = this.fb.group({
      question: "",
      firstOption: "",
      secondOption: "",
      optionItems: this.fb.array([]),
    });
  }

  ngOnInit() {}

  /**
   * Used to add an extra option
   * @param
   */
  addPollOption() {
    try {
      this.inputOptionItems.push({ key: '',
      value: ''});
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Used to remove an extra option
   * @param number index
   */
  removePollOption(index: any) {
    try {
      this.inputOptionItems.splice(index, 1);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Creates the poll
   * @param Any values
   */
  createPoll(): boolean {
    try {
      let inputValue = this.inputOptionItems.map(item => item.value);
      if (this.inputQuestion.trim().length === 0) {
        this.errorText = COMETCHAT_CONSTANTS.POLL_QUESTION_BLANK;
        return false;
      }

      if (
        this.inputOptionOne.trim().length === 0 ||
        this.inputOptionTwo.trim().length === 0
      ) {
        this.errorText = COMETCHAT_CONSTANTS.POLL_OPTION_BLANK;
        return false;
      }

      let receiverId;
      let receiverType = this.type;
      if (this.type === CometChat.RECEIVER_TYPE.USER) {
        receiverId = this.item.uid;
      } else if (this.type === CometChat.RECEIVER_TYPE.GROUP) {
        receiverId = this.item.guid;
      }

      if (this.createBtnText == COMETCHAT_CONSTANTS.CREATING_MESSSAGE) {
        return false;
      }

      let optionList: any[] = [
        this.inputOptionOne,
        this.inputOptionTwo,
        ...inputValue
      ];

      this.createBtnText = COMETCHAT_CONSTANTS.CREATING_MESSSAGE;

      CometChat.callExtension(enums.POLLS, enums.POST, enums.V2_CREATE, {
        question: this.inputQuestion,
        options: optionList,
        receiver: receiverId,
        receiverType: receiverType,
      })
        .then((response: any) => {
          if (response && response.hasOwnProperty("success") && response["success"] === true) {
            this.closePollView();
          }
        })
        .catch((error) => {
          logger(enums.ERROR, error);
          this.errorText = error.message.message;
        })
        .finally(() => {
          this.createBtnText = COMETCHAT_CONSTANTS.CREATE;
        });
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Resets Information of poll to initial conditons
   * @param
   */
  resetPollFormData() {
    try {
      this.pollFormData.reset();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Emits an action to close the poll view
   * @param
   */
  closePollView() {
    try {
      this.actionGenerated.emit({ type: enums.CLOSE_POLL_VIEW, payLoad: null });
    } catch (error) {
      logger(error);
    }
  }
}
