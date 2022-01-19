import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-create-group",
  templateUrl: "./cometchat-create-group.component.html",
  styleUrls: ["./cometchat-create-group.component.css"],
})
export class CometChatCreateGroupComponent implements OnInit {
  error: any = null;
  passwordInput: boolean = false;
  name: String = "";
  type: string = "";
  password = "";

  createBtnText: String = COMETCHAT_CONSTANTS.CREATE;
  SELECT_GROUP_TYPE: String = COMETCHAT_CONSTANTS.SELECT_GROUP_TYPE;
  ENTER_GROUP_NAME: String = COMETCHAT_CONSTANTS.ENTER_GROUP_NAME;
  PUBLIC: String = COMETCHAT_CONSTANTS.PUBLIC;
  PRIVATE: String = COMETCHAT_CONSTANTS.PRIVATE;
  PASSWORD_PROTECTED: String = COMETCHAT_CONSTANTS.PASSWORD_PROTECTED;
  ENTER_GROUP_PASSWORD: String = COMETCHAT_CONSTANTS.ENTER_GROUP_PASSWORD;
  CREATE_GROUP: String = COMETCHAT_CONSTANTS.CREATE_GROUP;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  /**
   * Changes the password according to the text entered by the user
   * @param Event event
   */
  passwordChangeHandler(event: any) {
    try {
      this.password = event.target.value;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Changes the Group Name according to the text entered by the user
   * @param Event event
   */
  nameChangeHandler(event: any) {
    try {
      this.name = event.target.value;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Changes the Type of group ,   according to the option seletced by the user by the user
   * @param Event event
   */
  typeChangeHandler(event: any) {
    try {
      this.type = event.target.value;

      if (this.type === enums.PROTECTED_GROUP) {
        this.passwordInput = true;
      } else {
        this.passwordInput = false;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Validates all the group details that were entered before creating the group
   * @param
   */
  validate() {
      const groupName = this.name.trim();
      const groupType = this.type.trim();

      if (!groupName) {
        this.error = COMETCHAT_CONSTANTS.GROUP_NAME_BLANK;
        return false;
      }

      if (!groupType) {
        this.error = COMETCHAT_CONSTANTS.GROUP_TYPE_BLANK;

        return false;
      }

      if (groupType === enums.PROTECTED_GROUP) {
        const password = this.password;

        if (!password.length) {
          this.error = COMETCHAT_CONSTANTS.GROUP_PASSWORD_BLANK;

          return false;
        }
      }
      return true;
  };

  /**
   * If the Group Data is successfully validated , below function creates the group
   * @param
   */
  createGroup(): boolean {
    try {
      if (!this.validate()) {
        return false;
      }

      if (this.createBtnText == COMETCHAT_CONSTANTS.CREATING_MESSSAGE) {
        return true;
      }

      this.createBtnText = COMETCHAT_CONSTANTS.CREATING_MESSSAGE;

      const groupType = this.type.trim();

      const password = this.password;
      const guid = enums.GROUP_ + new Date().getTime();
      const name = this.name.trim();
      let type = CometChat.GROUP_TYPE.PUBLIC;

      switch (groupType) {
        case enums.PUBLIC_GROUP:
          type = CometChat.GROUP_TYPE.PUBLIC;
          break;
        case enums.PRIVATE_GROUP:
          type = CometChat.GROUP_TYPE.PRIVATE;
          break;
        case enums.PROTECTED_GROUP:
          type = CometChat.GROUP_TYPE.PASSWORD;
          break;
        default:
          break;
      }

      const group = new CometChat.Group(guid, name, type, password);

      CometChat.createGroup(group)
        .then((group) => {
          this.resetGroupData();
          this.actionGenerated.emit({
            type: enums.GROUP_CREATED,
            payLoad: group,
          });
        })
        .catch((error) => {
          this.error = error;
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
   * Emits an action indicating the parent to close the create group view
   * @param
   */
  closeCreateGroupView() {
    try {
      this.actionGenerated.emit({
        type: enums.CLOSE_CREATE_GROUP_VIEW,
        payLoad: null,
      });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Resets all the Group creation form data to initial values
   * @param
   */
  resetGroupData() {
    try {
      this.error = null;
      this.passwordInput = false;
      this.name = "";
      this.type = "";
      this.password = "";
    } catch (error) {
      logger(error);
    }
  }
}
