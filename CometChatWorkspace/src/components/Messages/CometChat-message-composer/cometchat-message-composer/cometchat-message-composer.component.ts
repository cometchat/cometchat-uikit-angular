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
import * as enums from "../../../../utils/enums";

import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { logger } from "../../../../utils/common";

import { OUTGOING_MESSAGE_SOUND } from "../../../../resources/audio/outgoingMessageSound";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
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
  @Input() parentMessageId: number = 0;

  // can be user or a group
  @Input() item: any = null;
  @Input() type: string = '';
  @Input() messageToBeEdited: any = null;
  @Input() replyPreview = null;

  @Input() messageToReact:any = null;
  @Input() loggedInUser :any= null;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  @ViewChild("imagePicker", { static: false }) imagePicker!: ElementRef;
  @ViewChild("videoPicker", { static: false }) videoPicker!: ElementRef;
  @ViewChild("audioPicker", { static: false }) audioPicker!: ElementRef;
  @ViewChild("filePicker", { static: false }) filePicker!: ElementRef;

  enableSendButton = false;
  enableReaction = true;
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

  PICK_YOUR_EMOJI: string = COMETCHAT_CONSTANTS.PICK_YOUR_EMOJI;
  ATTACH_FILE: string = COMETCHAT_CONSTANTS.ATTACH_FILE;
  ATTACH_VIDEO: string = COMETCHAT_CONSTANTS.ATTACH_VIDEO;
  ATTACH_AUDIO: string = COMETCHAT_CONSTANTS.ATTACH_AUDIO;
  ATTACH_IMAGE: string = COMETCHAT_CONSTANTS.ATTACH_IMAGE;
  ADD_EMOJI: string = COMETCHAT_CONSTANTS.ADD_EMOJI;
  ENTER_YOUR_MESSAGE_HERE: string = COMETCHAT_CONSTANTS.ENTER_YOUR_MESSAGE_HERE;
  EDIT_MESSAGE: string = COMETCHAT_CONSTANTS.EDIT_MESSAGE;

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.ITEM]) {
        this.checkBlocked();
      }
      if (change[enums.MESSAGE_TO_BE_EDITED]) {
        //edit message only if its not null or undefined
        if (change[enums.MESSAGE_TO_BE_EDITED].currentValue) {
          this.openEditPreview();
        }
      }
      if (
        change[enums.MESSAGE_TO_REACT] &&
        change[enums.MESSAGE_TO_REACT].currentValue
      ) {
        const previousMessage = change[enums.MESSAGE_TO_REACT].previousValue;
        const currentMessage = change[enums.MESSAGE_TO_REACT].currentValue;
        if (previousMessage !== currentMessage) {
          this.messageToReact = change[enums.MESSAGE_TO_REACT].currentValue;

          this.toggleEmoji();
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
         // add below code
         if(!this.loggedInUser){
          CometChat.getLoggedinUser()
          .then(user=>{
            this.loggedInUser = user
          })
        }
  }

  /**
   * Handles all the actions emitted by the child components that make the current component
   * @param Event action
   */
  actionHandler(action: any) {
    
    try {
      let message = action.payLoad;

      // logger("Message Composer --> action generation is ", action);

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
        case enums.SEND_STICKER:
          this.sendSticker(message);
          break;
        case enums.CLOSE_STICKER:
          this.toggleStickerPicker();
          break;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Check If user Blocked then disable input box
   */
  checkBlocked() {
    try {
      if (this.item.blockedByMe) {
        this.userBlocked = true;
      } else {
        this.userBlocked = false;
      }
    } catch (error) {
      logger(error);
    }
  }
  /**
   * Get Details of the User/Group , to whom , you want to send the message
   * @param
   */
  getReceiverDetails() {
      let receiverId;
      let receiverType: any;

      if (this.type == CometChat.RECEIVER_TYPE.USER) {
        receiverId = this.item.uid;
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else if (this.type == CometChat.RECEIVER_TYPE.GROUP) {
        receiverId = this.item.guid;
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      }

      return { receiverId: receiverId, receiverType: receiverType };
  }

  /**
   * Update the Message to be sent on every key press
   * @param event
   */
  changeHandler(event: any) {
    try {
      this.startTyping();
      if (event.target.value.length > 0) {
        this.messageInput = event.target.value;
        this.enableSendButton = true;
        this.enableReaction = false;
      }
      if (event.target.value.length == 0) {
        this.enableSendButton = false;
        this.enableReaction = true;
        this.messageInput = "";
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Send the message if user hits ENTER-key
   * @param Event e
   */
  sendMessageOnEnter(event: any) {
    try {
      if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault();
        this.sendTextMessage(event.target.value);
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Edit and Send a Text message
   * @param
   */
  editMessage() {
    try {
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

          this.closeEditPreview();

          this.enableSendButton = false;
          this.enableReaction = true;

          this.actionGenerated.emit({
            type: enums.MESSAGE_EDIT,
            payLoad: message,
          });
        })
        .catch((error) => {
          this.messageSending = false;
          logger("Message editing failed with error:", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  getUnixTimestamp() {
    return Math.round(+new Date() / 1000);
  }

  ID() {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Send Text Message
   * @param
   */
  sendTextMessage(textMsg: String = "") : boolean {
    try {
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

      let textMessage: any = new CometChat.TextMessage(
        receiverId,
        messageInput,
        receiverType
      );

      if (this.parentMessageId) {
        textMessage.setParentMessageId(this.parentMessageId);
      }

      textMessage.setSender(this.loggedInUser);
		  textMessage.setReceiver(this.type);
      textMessage._composedAt = this.getUnixTimestamp();
		  textMessage._id = this.ID()

      this.actionGenerated.emit({
        type: enums.MESSAGE_COMPOSED,
        payLoad: [textMessage],
      });

      // play audio after action generation
      this.playAudio();

      //clearing Message Input Box
      this.messageInput = "";

      this.messageSending = false;
      // End Typing Indicator Function
      this.endTyping();

      CometChat.sendMessage(textMessage)
        .then((message) => {

          // this Message Emitted will Be Appended to the existing Message List
          this.actionGenerated.emit({
            type: enums.MESSAGE_SENT,
            payLoad: [{...message, _id:textMessage._id}],
          });

          // Change the send button to reaction button
          setTimeout(() => {
            this.enableReaction = true;
            this.enableSendButton = false;
          }, 500);
        })
        .catch((error) => {
          logger("Message sending failed with error:", error);
          this.messageSending = false;
        });
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Opens drawer to send media files and sets animation state
   */
  toggleFilePicker(): boolean {
    try {
      //If user you are chatting with is blocked then return false
      if (this.userBlocked) {
        return false;
      }
      this.checkAnimatedState == "normal"
        ? (this.checkAnimatedState = "animated")
        : (this.checkAnimatedState = "normal");
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Opens window to select and upload video
   */
  getVideo() {
    try {
      this.videoPicker.nativeElement.click();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Opens window to select and upload audio
   */
  getAudio() {
    try {
      this.audioPicker.nativeElement.click();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Opens window to select and upload image
   */
  getImage() {
    try {
      this.imagePicker.nativeElement.click();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Opens window to select and upload file
   */
  getFile() {
    try {
      this.filePicker.nativeElement.click();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Loads and upload the video
   * @param
   */
  onVideoChange(event: any) : boolean {
    try {
      if (!event.target.files[0]) {
        return false;
      }
      const uploadedFile = event.target.files[0];
      const reader: any = new FileReader();
      reader.addEventListener(
        enums.LOAD,
        () => {
          const newFile = new File(
            [reader.result],
            uploadedFile.name,
            uploadedFile
          );
          this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.VIDEO);
        },
        false
      );

      reader.readAsArrayBuffer(uploadedFile);

      this.videoPicker.nativeElement.value = "";
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Loads and upload the audio
   * @param
   */
  onAudChange(event: any) : boolean {
    try {
      if (!event.target.files[0]) {
        return false;
      }
      const uploadedFile = event.target.files[0];
      const reader: any = new FileReader();
      reader.addEventListener(
        enums.LOAD,
        () => {
          const newFile = new File(
            [reader.result],
            uploadedFile.name,
            uploadedFile
          );
          this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.AUDIO);
        },
        false
      );

      reader.readAsArrayBuffer(uploadedFile);

      this.audioPicker.nativeElement.value = "";
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Loads and upload the image
   * @param
   */
  onImgChange(event: any) :boolean {
    try {
      if (!event.target.files[0]) {
        return false;
      }
      const uploadedFile = event.target.files[0];
      const reader: any = new FileReader();
      reader.addEventListener(
        enums.LOAD,
        () => {
          const newFile = new File(
            [reader.result],
            uploadedFile.name,
            uploadedFile
          );
          
          this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.IMAGE);
        },
        false
      );

      reader.readAsArrayBuffer(uploadedFile);

      this.imagePicker.nativeElement.value = "";
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Loads and upload the file
   * @param
   */
  onFileChange(event: any) :boolean {
    try {
  
      if (!event.target.files["0"]) {
        return false;
      }

      const uploadedFile = event.target.files["0"];
      var reader: any = new FileReader();
      reader.addEventListener(
        enums.LOAD,
        () => {
          const newFile = new File(
            [reader.result],
            uploadedFile.name,
            uploadedFile
          );
    
          this.sendMediaMessage(newFile, CometChat.MESSAGE_TYPE.FILE);
        },
        false
      );

      reader.readAsArrayBuffer(uploadedFile);

      this.filePicker.nativeElement.value = "";
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Sends media messages eg. image,audio,file etc.
   * @param
   */
  sendMediaMessage(messageInput: any, messageType: any) :boolean {
    try {
      this.toggleFilePicker();
      if (this.messageSending) {
        return false;
      }
      this.messageSending = true;

      const { receiverId, receiverType } = this.getReceiverDetails();

      let mediaMessage: any = new CometChat.MediaMessage(
        receiverId,
        messageInput,
        messageType,
        receiverType
      );

      if (this.parentMessageId) {
        mediaMessage.setParentMessageId(this.parentMessageId);
      }

      mediaMessage.setSender(this.loggedInUser);
		  mediaMessage.setReceiver(this.type);
		  mediaMessage.setType(messageType);
		  mediaMessage.setMetadata({
			  [enums.FILE_METADATA]: messageInput,
		  });
		  mediaMessage._composedAt = this.getUnixTimestamp();
		  mediaMessage._id = this.ID();

      this.endTyping();

      this.actionGenerated.emit({
        type: enums.MESSAGE_COMPOSED,
        payLoad: [mediaMessage],
      });

      this.playAudio();
      this.messageSending = false;

      CometChat.sendMessage(mediaMessage)
        .then((response) => {
          this.messageSending = false;
          this.actionGenerated.emit({
            type: enums.MESSAGE_SENT,
            payLoad: [{... response, _id: mediaMessage._id}],
          });
        })
        .catch((error) => {
          this.messageSending = false;
          logger("message sending failed with error Message_Composer ", error);
        });
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Add emoji to the input when user clicks on emoji
   * @param
   */
  addEmoji($event: any) {
    try {
      if (this.messageToReact) {
        this.reactToMessages($event.emoji);
        return;
      }
      this.enableSendButton = true;
      this.enableReaction = false;
      let emoji = $event.emoji.native;
      this.messageInput = this.messageInput + emoji;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * opens the edit message window
   * @param
   */
  openEditPreview() {
    try {
      this.openEditMessageWindow = true;
      this.messageInput = this.messageToBeEdited.data.text;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Closes the edit message window
   * @param
   */
  closeEditPreview() {
    try {
      this.openEditMessageWindow = false;
      this.messageToBeEdited = null;
      this.messageInput = "";
      this.actionGenerated.emit({
        type: enums.CLEAR_MESSAGE_TO_BE_UPDATED,
        payLoad: null,
      });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * opens the create poll Modal
   * @param
   */
  openCreatePollPreview() {
    try {
      this.createPollView = true;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Closes the create poll Modal
   * @param
   */
  closeCreatePollPreview() {
    try {
      this.createPollView = false;
    } catch (error) {
      logger(error);
    }
  }
  /**
   * Plays Audio When Message is Sent
   */
  playAudio() {
    try {
      let audio = new Audio();
      audio.src = OUTGOING_MESSAGE_SOUND;
      audio.play();
    } catch (error) {
      logger(error);
    }
  }

  /**
   *  When user starts typing sets typing indicator
   */
  startTyping(timer = null, metadata = null) :boolean {
    try {
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
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * When user stops writing
   */
  endTyping(metadata = null) {
    try {
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
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sends Live Reaction
   */
  sendReaction(event: any): boolean {
    try {
      //If user you are chatting with is blocked then return false
      if (this.userBlocked) {
        return false;
      }
      const typingInterval: any = 1000;

      const typingMetadata: any = {
        type: enums.LIVE_REACTION_KEY,
        reaction: COMETCHAT_CONSTANTS.HEART,
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
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Toggles Sticker Window
   */
  toggleStickerPicker(): boolean {
    try {
      //If user you are chatting with is blocked then return false
      if (this.userBlocked) {
        return false;
      }
      const stickerViewer = this.stickerViewer;
      this.stickerViewer = !stickerViewer;
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Sends Sticker Message
   * @param
   */
  sendSticker(stickerMessage: any) {
    try {
      this.messageSending = true;
      const { receiverId, receiverType } = this.getReceiverDetails();
      const customData = {
        sticker_url: stickerMessage.stickerUrl,
        sticker_name: stickerMessage.stickerName,
      };
      const customType = enums.CUSTOM_TYPE_STICKER;
      const customMessage: any = new CometChat.CustomMessage(
        receiverId,
        receiverType,
        customType,
        customData
      );

      if (this.parentMessageId) {
        customMessage.setParentMessageId(this.parentMessageId);
      }

      customMessage.setSender(this.loggedInUser);
		  customMessage.setReceiver(this.type);
		  customMessage.setMetadata({ incrementUnreadCount: true });
		  customMessage._composedAt = this.getUnixTimestamp();
		  customMessage._id = this.ID();

      this.actionGenerated.emit({
        type: enums.MESSAGE_COMPOSED,
        payLoad: [customMessage],
      })

      this.playAudio();

      CometChat.sendCustomMessage(customMessage)
        .then((message) => {
          this.messageSending = false;
          this.actionGenerated.emit({
            type: enums.MESSAGE_SENT,
            payLoad: [{...message, _id: customMessage._id}],
          });
        })
        .catch((error) => {
          this.messageSending = false;
          logger("custom message sending failed with error", error);
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Toggle emoji window when emoji button is clicked
   */
  toggleEmoji(): boolean {
    try {
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
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * React to message with emoji
   * @param
   */
  reactToMessages(emoji: any) {
    try {
      CometChat.callExtension(enums.REACTIONS, enums.POST, enums.V1_REACT, {
        msgId: this.messageToReact.id,
        emoji: emoji.colons,
      })
        .then((response: any) => {
          if (
            response.hasOwnProperty(enums.SUCCESS) &&
            response[enums.SUCCESS] === true
          ) {
            this.toggleEmoji();
          }
        })
        .catch((error) => {
          // Some error occured
        });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * To set style for emoji selector
   * @param
   */
  emojiStyle(val: any) {
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
