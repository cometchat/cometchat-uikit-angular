import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-create-group",
  templateUrl: "./cometchat-create-group.component.html",
  styleUrls: ["./cometchat-create-group.component.css"],
})
export class CometChatCreateGroupComponent implements OnInit {
  error = null;
  passwordInput: boolean = false;
  name: String = "";
  type: String = "";
  password = "";

  createBtnText: String = STRING_MESSAGES.CREATE;
  SELECT_GROUP_TYPE: String = STRING_MESSAGES.SELECT_GROUP_TYPE;
  ENTER_GROUP_NAME: String = STRING_MESSAGES.ENTER_GROUP_NAME;
  PUBLIC: String = STRING_MESSAGES.PUBLIC;
  PRIVATE: String = STRING_MESSAGES.PRIVATE;
  PASSWORD_PROTECTED: String = STRING_MESSAGES.PASSWORD_PROTECTED;
  ENTER_GROUP_PASSWORD: String = STRING_MESSAGES.ENTER_GROUP_PASSWORD;
  CREATE_GROUP: String = STRING_MESSAGES.CREATE_GROUP;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  /**
   * Changes the password according to the text entered by the user
   * @param Event event
   */
  passwordChangeHandler(event) {
    this.password = event.target.value;
  }

  /**
   * Changes the Group Name according to the text entered by the user
   * @param Event event
   */
  nameChangeHandler(event) {
    this.name = event.target.value;
  }

  /**
   * Changes the Type of  according to the option seletced by the user by the user
   * @param Event event
   */
  typeChangeHandler(event) {
    const type = event.target.value;
    this.type = event.target.value;

    if (type === "protected") {
      this.passwordInput = true;
    } else {
      this.passwordInput = false;
    }
  }

  /**
   * Validates all the group details that were entered before creating the group
   * @param
   */
  validate = () => {
    const groupName = this.name.trim();
    const groupType = this.type.trim();

    if (!groupName) {
      this.error = STRING_MESSAGES.GROUP_NAME_BLANK;
      return false;
    }

    if (!groupType) {
      this.error = STRING_MESSAGES.GROUP_TYPE_BLANK;

      return false;
    }

    let password = "";
    if (groupType === "protected") {
      const password = this.password;

      if (!password.length) {
        this.error = STRING_MESSAGES.GROUP_PASSWORD_BLANK;

        return false;
      }
    }
    return true;
  };

  /**
   * If the Group Data is successfully validated , below function creates the group
   * @param
   */
  createGroup() {
    if (!this.validate()) {
      return false;
    }

    if (this.createBtnText == STRING_MESSAGES.CREATING_MESSSAGE) {
      return;
    }

    this.createBtnText = STRING_MESSAGES.CREATING_MESSSAGE;

    const groupType = this.type.trim();

    const password = this.password;
    const guid = "group_" + new Date().getTime();
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
        this.createBtnText = STRING_MESSAGES.CREATE;
      });
  }

  /**
   * Emits an action indicating the parent to close the create group view
   * @param
   */
  closeCreateGroupView() {
    this.actionGenerated.emit({
      type: enums.CLOSE_CREATE_GROUP_VIEW,
      payLoad: null,
    });
  }

  /**
   * Resets all the Group creation form data to initial values
   * @param
   */
  resetGroupData() {
    this.error = null;
    this.passwordInput = false;
    this.name = "";
    this.type = "";
    this.password = "";
  }
}
