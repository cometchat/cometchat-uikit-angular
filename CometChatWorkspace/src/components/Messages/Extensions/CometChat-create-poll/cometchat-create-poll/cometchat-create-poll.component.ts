import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
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
  @Input() item = null;
  @Input() type = null;

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
      (this.pollFormData.get(enums.OPTION_ITEMS) as FormArray).push(
        this.fb.control(null)
      );
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Used to remove an extra option
   * @param number index
   */
  removePollOption(index) {
    try {
      (this.pollFormData.get(enums.OPTION_ITEMS) as FormArray).removeAt(index);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * used to add options in poll dynamically as form control
   */
  getOptionsFormControls(): AbstractControl[] {
    try {
      return (<FormArray>this.pollFormData.get(enums.OPTION_ITEMS)).controls;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Creates the poll
   * @param Any values
   */
  createPoll(values) {
    try {
      if (values.question.trim().length === 0) {
        this.errorText = COMETCHAT_CONSTANTS.POLL_QUESTION_BLANK;
        return false;
      }

      if (
        values.firstOption.trim().length === 0 ||
        values.secondOption.trim().length === 0
      ) {
        this.errorText = COMETCHAT_CONSTANTS.POLL_OPTION_BLANK;
        return false;
      }

      let optionList = [
        values.firstOption,
        values.secondOption,
        ...values.optionItems,
      ];

      let receiverId;
      let receiverType = this.type;
      if (this.type === CometChat.RECEIVER_TYPE.USER) {
        receiverId = this.item.uid;
      } else if (this.type === CometChat.RECEIVER_TYPE.GROUP) {
        receiverId = this.item.guid;
      }

      if (this.createBtnText == COMETCHAT_CONSTANTS.CREATING_MESSSAGE) {
        return;
      }

      this.createBtnText = COMETCHAT_CONSTANTS.CREATING_MESSSAGE;

      CometChat.callExtension(enums.POLLS, enums.POST, enums.V1_CREATE, {
        question: values.question,
        options: optionList,
        receiver: receiverId,
        receiverType: receiverType,
      })
        .then((response: any) => {
          const data = response.message.data;
          const customData = data.data.customData;
          const options = customData.options;

          const resultOptions = {};
          for (const option in options) {
            resultOptions[option] = {
              text: options[option],
              count: 0,
            };
          }

          const polls = {
            id: data.id,
            options: options,
            results: {
              total: 0,
              options: resultOptions,
              question: customData.question,
            },
            question: customData.question,
          };

          const message = {
            ...data,
            sender: { uid: data.sender },
            metadata: { "@injected": { extensions: { polls: polls } } },
          };

          this.actionGenerated.emit({
            type: enums.POLL_CREATED,
            payLoad: message,
          });
          this.errorText = "";
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
