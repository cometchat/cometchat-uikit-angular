import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";

// import {SEND_SMART_REPLY,SEND_STICKER,CLOSE_STICKER} from '../../utils/enums'

import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";

import { OUTGOING_MESSAGE_SOUND } from "../../../resources/audio/outgoingMessageSound";
import { STRING_MESSAGES } from "../../../utils/messageConstants";
@Component({
  selector: "cometchat-message-composer",
  templateUrl: "./cometchat-message-composer.component.html",
  styleUrls: ["./cometchat-message-composer.component.css"],
  animations: [
    trigger("FadeInFadeOut", [
      state(
        "normal",
        style({
          width: "0px",
        })
      ),
      state(
        "animated",
        style({
          width: "26px",
          margin: "auto 1px",
        })
      ),
      transition("normal=>animated", animate(500)),
    ]),
    trigger("slideInOut", [
      transition(":enter", [
        style({ transform: "translateY(100%)" }),
        animate("400ms ease-in", style({ transform: "translateY(0%)" })),
      ]),
    ]),
  ],
})
export class CometChatMessageComposerComponent implements OnInit, OnChanges {
  @Input() parentMessageId = null;

  // can be user or a group
  @Input() item = null;
  @Input() type = null;
  @Input() messageToBeEdited = null;
  @Input() replyPreview = null;
  @Input() messageToReact = null;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  @ViewChild("imgPicker", { static: false }) imgPicker: ElementRef;
  @ViewChild("vidPicker", { static: false }) vidPicker: ElementRef;
  @ViewChild("audPicker", { static: false }) audPicker: ElementRef;
  @ViewChild("filePicker", { static: false }) filePicker: ElementRef;

  senddisable = false;
  reactdisable = true;
  messageSending: boolean = false;
  messageInput = "";
  messageType = "";
  emojiViewer = false;
  createPoll = false;
  stickerViewer = false;
  checkAnimatedState = "normal";
  openEditMessageWindow: boolean = false;
  createPollView: boolean = false;

  emojiToggled: boolean = false;
  isTyping: any;
  userBlocked: boolean = false;

  PICK_YOUR_EMOJI: String = STRING_MESSAGES.PICK_YOUR_EMOJI;
  ATTACH_FILE: String = STRING_MESSAGES.ATTACH_FILE;
  ATTACH_VIDEO: String = STRING_MESSAGES.ATTACH_VIDEO;
  ATTACH_AUDIO: String = STRING_MESSAGES.ATTACH_AUDIO;
  ATTACH_IMAGE: String = STRING_MESSAGES.ATTACH_IMAGE;
  ADD_EMOJI: String = STRING_MESSAGES.ADD_EMOJI;
  ENTER_YOUR_MESSAGE_HERE: String = STRING_MESSAGES.ENTER_YOUR_MESSAGE_HERE;
  EDIT_MESSAGE: String = STRING_MESSAGES.EDIT_MESSAGE;

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    if (change["item"]) {
      this.checkBlocked();
    }
    if (change["messageToBeEdited"]) {
      //edit message only if its not null or undefined
      if (change["messageToBeEdited"].currentValue) {
        this.openEditPreview();
      }
    }
    if (change["messageToReact"] && change["messageToReact"].currentValue) {
      const previousMessage = change["messageToReact"].previousValue;
      const currentMessage = change["messageToReact"].currentValue;
      if (previousMessage !== currentMessage) {
        this.messageToReact = change["messageToReact"].currentValue;

        this.toggleEmoji();
      }
    }
  }

  ngOnInit() {}

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action) {
    let message = action.payLoad;

    // console.log("Message Composer --> action generation is ", action);

    switch (action.type) {
      case enums.SEND_SMART_REPLY: {
        this.sendTextMessage(message);

        //closing smartReply preview window
        this.replyPreview = null;
        break;
      }
      case enums.CLOSE_POLL_VIEW: {
        this.closeCreatePollPreview();
        break;
      }
      case enums.POLL_CREATED: {
        this.closeCreatePollPreview();
        this.actionGenerated.emit({
          type: enums.POLL_CREATED,
          payLoad: [message],
        });

        //temporary check; custom data listener working for sender too
        // if (this.type === "user") {
        //   this.actionGenerated.emit({ type :  "pollCreated", payLoad : [message]});
        // }

        break;
      }
      case enums.SEND_STICKER:
        this.sendSticker(message);
        break;
      case enums.CLOSE_STICKER:
        this.toggleStickerPicker();
        break;
    }
  }

  /**
   * Check If user Blocked then disable input box
   */
  checkBlocked() {
    if (this.item.blockedByMe) {
      this.userBlocked = true;
    } else {
      this.userBlocked = false;
    }
  }
  /**
   * Get Details of the User/Group , to whom , you want to send the message
   * @param
   */
  getReceiverDetails() {
    let receiverId;
    let receiverType;

    if (this.type == "user") {
      receiverId = this.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;
    } else if (this.type == "group") {
      receiverId = this.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    return { receiverId: receiverId, receiverType: receiverType };
  }

  /**
   * Update the Message to be sent on every key press
   * @param event
   */
  changeHandler(event) {
    this.startTyping();
    if (event.target.value.length > 0) {
      this.messageInput = event.target.value;
      this.senddisable = true;
      this.reactdisable = false;
    }
    if (event.target.value.length == 0) {
      this.senddisable = false;
      this.reactdisable = true;
      this.messageInput = "";
    }
  }

  /**
   * Send the message if user hits ENTER-key
   * @param Event e
   */
  sendMessageOnEnter(event) {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      this.sendTextMessage(event.target.value);
      this.playAudio();
    }
  }

  /**
   * Edit and Sent a Text message
   * @param
   */
  editMessage() {
    const messageToBeEdited = this.messageToBeEdited;

    let { receiverId, receiverType } = this.getReceiverDetails();

    let messageText = this.messageInput.trim();
    let textMessage = new CometChat.TextMessage(
      receiverId,
      messageText,
      receiverType
    );
    textMessage.setId(messageToBeEdited.id);

    this.endTyping();

    CometChat.editMessage(textMessage)
      .then((message) => {
        this.messageInput = "";
        this.messageSending = false;

        //this.playAudio();

        this.closeEditPreview();

        this.actionGenerated.emit({
          type: enums.MESSAGE_EDIT,
          payLoad: message,
        });
      })
      .catch((error) => {
        this.messageSending = false;
        console.log("Message editing failed with error:", error);
      });
  }

  /**
   * Send Text Message
   * @param
   */
  sendTextMessage(textMsg: String = "") {
    //If user you are chatting with is blocked then return false
    if (this.userBlocked) {
      return false;
    }

    // Close Emoji Viewer if it is open while sending the message
    if (this.emojiToggled) {
      this.emojiToggled = false;
    }

    // Dont Send Blank text messages -- i.e --- messages that only contain spaces
    if (this.messageInput.trim().length == 0 && textMsg.trim().length == 0) {
      return false;
    }

    // wait for the previous message to be sent before sending the current message
    if (this.messageSending) {
      return false;
    }

    this.messageSending = true;

    // If its an Edit and Send Message Operation , use Edit Message Function
    if (this.messageToBeEdited) {
      this.editMessage();
      return false;
    }

    let { receiverId, receiverType } = this.getReceiverDetails();

    let messageInput;

    if (textMsg !== null) {
      messageInput = textMsg.trim();
    } else {
      messageInput = this.messageInput.trim();
    }

    let textMessage = new CometChat.TextMessage(
      receiverId,
      messageInput,
      receiverType
    );

    if (this.parentMessageId) {
      textMessage.setParentMessageId(this.parentMessageId);
    }

    // End Typing Indicator Function
    this.endTyping();

    CometChat.sendMessage(textMessage)
      .then((message) => {
        this.messageInput = "";
        this.messageSending = false;

        // Clear Message Input Box Logic
        // this.messageInputRef.current.textContent = "";

        // Play Message Sent Successfully Audio
        // this.playAudio();

        // this Message Emitted will Be Appended to the existing Message List
        this.actionGenerated.emit({
          type: enums.MESSAGE_COMPOSED,
          payLoad: [message],
        });

        //clearing Message Input Box
        this.messageInput = "";

        // Change the send button to reaction button
        setTimeout(() => {
          this.reactdisable = true;
          this.senddisable = false;
        }, 500);
      })
      .catch((error) => {
        console.log("Message sending failed with error:", error);
        this.messageSending = false;
      });
  }

  toggleFilePicker() {
    //If user you are chatting with is blocked then return false
    if (this.userBlocked) {
      return false;
    }
    this.checkAnimatedState == "normal"
      ? (this.checkAnimatedState = "animated")
      : (this.checkAnimatedState = "normal");
  }

  getVideo() {
    this.vidPicker.nativeElement.click();
  }
  getAudio() {
    this.audPicker.nativeElement.click();
  }
  getImage() {
    this.imgPicker.nativeElement.click();
  }
  getFile() {
    this.filePicker.nativeElement.click();
  }

  onVideoChange(event) {
    if (!event.target.files[0]) {
      return false;
    }
    const uploadedFile = event.target.files[0];
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        const newFile = new File(
          [reader.result],
          uploadedFile.name,
          uploadedFile
        );
        this.sendMediaMessage(newFile, "video");
      },
      false
    );

    reader.readAsArrayBuffer(uploadedFile);

    this.vidPicker.nativeElement.value = "";
  }

  onAudChange(event) {
    if (!event.target.files[0]) {
      return false;
    }
    const uploadedFile = event.target.files[0];
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        const newFile = new File(
          [reader.result],
          uploadedFile.name,
          uploadedFile
        );
        this.sendMediaMessage(newFile, "audio");
      },
      false
    );

    reader.readAsArrayBuffer(uploadedFile);

    this.audPicker.nativeElement.value = "";
  }

  onImgChange(event) {
    if (!event.target.files[0]) {
      return false;
    }
    const uploadedFile = event.target.files[0];
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        const newFile = new File(
          [reader.result],
          uploadedFile.name,
          uploadedFile
        );
        this.sendMediaMessage(newFile, "image");
      },
      false
    );

    reader.readAsArrayBuffer(uploadedFile);

    this.imgPicker.nativeElement.value = "";
  }

  onFileChange(event) {
    if (!event.target.files["0"]) {
      return false;
    }

    const uploadedFile = event.target.files["0"];
    var reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        const newFile = new File(
          [reader.result],
          uploadedFile.name,
          uploadedFile
        );
        this.sendMediaMessage(newFile, "file");
      },
      false
    );

    reader.readAsArrayBuffer(uploadedFile);

    this.filePicker.nativeElement.value = "";
  }

  sendMediaMessage(messageInput, messageType) {
    this.toggleFilePicker();
    if (this.messageSending) {
      return false;
    }
    this.messageSending = true;

    const { receiverId, receiverType } = this.getReceiverDetails();

    let mediaMessage = new CometChat.MediaMessage(
      receiverId,
      messageInput,
      messageType,
      receiverType
    );

    if (this.parentMessageId) {
      mediaMessage.setParentMessageId(this.parentMessageId);
    }

    this.endTyping();

    CometChat.sendMessage(mediaMessage)
      .then((response) => {
        this.messageSending = false;
        this.playAudio();
        this.actionGenerated.emit({
          type: enums.MESSAGE_COMPOSED,
          payLoad: [response],
        });
      })
      .catch((error) => {
        this.messageSending = false;
        console.log(
          "message sending failed with error Message_Composer ",
          error
        );
      });
  }

  /**
   * Add emoji to the input when user clicks on emoji
   * @param
   */
  addEmoji($event) {
    if (this.messageToReact) {
      this.reactToMessages($event.emoji);
      return;
    }
    this.senddisable = true;
    this.reactdisable = false;
    let emoji = $event.emoji.native;
    this.messageInput = this.messageInput + emoji;
  }

  /**
   * opens the edit message window
   * @param
   */
  openEditPreview() {
    this.openEditMessageWindow = true;
    this.messageInput = this.messageToBeEdited.data.text;
  }

  /**
   * Closes the edit message window
   * @param
   */
  closeEditPreview() {
    this.openEditMessageWindow = false;
    this.messageToBeEdited = null;
    this.messageInput = "";
    this.actionGenerated.emit({
      type: enums.CLEAR_MESSAGE_TO_BE_UPDATED,
      payLoad: null,
    });
  }

  /**
   * opens the create poll Modal
   * @param
   */
  openCreatePollPreview() {
    this.createPollView = true;
  }

  /**
   * Closes the create poll Modal
   * @param
   */
  closeCreatePollPreview() {
    this.createPollView = false;
  }
  /**
   * Plays Audio When Message is Sent
   */
  playAudio() {
    let audio = new Audio();
    audio.src = OUTGOING_MESSAGE_SOUND;
    audio.play();
  }

  /**
   *  When user starts typing
   */
  startTyping(timer = null, metadata = null) {
    let typingInterval = timer || 5000;

    if (this.isTyping > 0) {
      return false;
    }
    let { receiverId, receiverType } = this.getReceiverDetails();
    let typingMetadata = metadata || undefined;

    let typingNotification = new CometChat.TypingIndicator(
      receiverId,
      receiverType,
      typingMetadata
    );
    CometChat.startTyping(typingNotification);

    this.isTyping = setTimeout(() => {
      this.endTyping();
    }, typingInterval);
  }

  /**
   * When user stops writing
   */
  endTyping(metadata = null) {
    let { receiverId, receiverType } = this.getReceiverDetails();

    let typingMetadata = metadata || undefined;

    let typingNotification = new CometChat.TypingIndicator(
      receiverId,
      receiverType,
      typingMetadata
    );
    CometChat.endTyping(typingNotification);

    clearTimeout(this.isTyping);
    this.isTyping = null;
  }
  /**
   * Sends Live Reaction
   */

  sendReaction(event) {
    //If user you are chatting with is blocked then return false
    if (this.userBlocked) {
      return false;
    }
    const typingInterval = 1000;

    const typingMetadata = {
      type: enums.LIVE_REACTION_KEY,
      reaction: "heart",
    };

    this.startTyping(typingInterval, typingMetadata);
    this.actionGenerated.emit({
      type: enums.SEND_REACTION,
    });
    // event.persist();
    setTimeout(() => {
      this.endTyping(typingMetadata);
      this.actionGenerated.emit({
        type: enums.STOP_REACTION,
      });
    }, typingInterval);
  }

  /**
   * Toggles Sticker Window
   */
  toggleStickerPicker() {
    //If user you are chatting with is blocked then return false
    if (this.userBlocked) {
      return false;
    }
    const stickerViewer = this.stickerViewer;
    this.stickerViewer = !stickerViewer;
  }

  /**
   * Sends Sticker Message
   * @param
   */
  sendSticker(stickerMessage) {
    this.messageSending = true;
    const { receiverId, receiverType } = this.getReceiverDetails();
    const customData = {
      sticker_url: stickerMessage.stickerUrl,
      sticker_name: stickerMessage.stickerName,
    };
    const customType = enums.CUSTOM_TYPE_STICKER;
    const customMessage = new CometChat.CustomMessage(
      receiverId,
      receiverType,
      customType,
      customData
    );

    if (this.parentMessageId) {
      customMessage.setParentMessageId(this.parentMessageId);
    }

    CometChat.sendCustomMessage(customMessage)
      .then((message) => {
        this.messageSending = false;
        this.playAudio();
        this.actionGenerated.emit({
          type: enums.MESSAGE_COMPOSED,
          payLoad: [message],
        });
      })
      .catch((error) => {
        this.messageSending = false;
        console.log("custom message sending failed with error", error);
      });
  }

  /**
   * Toggle emoji window when emoji button is clicked
   */
  toggleEmoji() {
    //If user you are chatting with is blocked then return false
    if (this.userBlocked) {
      return false;
    }
    this.emojiToggled = !this.emojiToggled;
    if (!this.emojiToggled) {
      this.actionGenerated.emit({
        type: enums.REACT_TO_MESSAGE,
        payLoad: null,
      });
    }
  }

  reactToMessages(emoji) {
    CometChat.callExtension(
      STRING_MESSAGES.REACTIONS,
      STRING_MESSAGES.POST,
      STRING_MESSAGES.V1_REACT,
      {
        msgId: this.messageToReact.id,
        emoji: emoji.colons,
      }
    )
      .then((response) => {
        if (
          response.hasOwnProperty("success") &&
          response["success"] === true
        ) {
          this.toggleEmoji();
        }
      })
      .catch((error) => {
        // Some error occured
      });
  }

  /**
   * To set style for emoji selector
   * @param
   */
  emojiStyle(val) {
    return val
      ? {
          position: "absolute",
          bottom: "20px",
          right: "15px",
          width: "285px",
          zIndex: "1",
        }
      : {
          position: "absolute",
          bottom: "20px",
          right: "45px",
          width: "285px",
          zIndex: "1",
        };
  }
}
