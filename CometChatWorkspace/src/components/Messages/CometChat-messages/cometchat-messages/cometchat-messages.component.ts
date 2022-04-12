import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { INCOMING_MESSAGE_SOUND } from "../../../../resources/audio/incomingMessageSound";
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";
import CometChatManager from "../../.././../utils/controller";
@Component({
  selector: "cometchat-messages",
  templateUrl: "./cometchat-messages.component.html",
  styleUrls: ["./cometchat-messages.component.css"],
})
export class CometChatMessagesComponent implements OnInit, OnChanges {
  @ViewChild("messageWindow", { static: false }) chatWindow!: ElementRef;

  @Input() item = null;
  @Input() type: string = '';
  @Input() composedThreadMessage = null;
  @Input() groupMessage: object = {};
  @Input() callMessage:Object | null = null;
  @Input() loggedInUser:any = null;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  messageList: any = [];
  scrollToBottom: boolean = true;
  messageToBeEdited = null;
  replyPreview = null;
  liveReaction = false;
  changeNumber = 0;
  reachedTopOfConversation = false;
  scrollVariable = 0;

  reactionName: string = COMETCHAT_CONSTANTS.HEART;
  messageToReact = null;

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.COMPOSED_THREAD_MESSAGE]) {
        // There is a valid Thread parent message , than update it's reply count
        if (change[enums.COMPOSED_THREAD_MESSAGE].currentValue) {
          this.messageEdited(
            change[enums.COMPOSED_THREAD_MESSAGE].currentValue
          );
        }
      }

      if (change[enums.GROUP_MESSAGE]) {
        if (change[enums.GROUP_MESSAGE].currentValue.length > 0) {
          this.appendMessage(change[enums.GROUP_MESSAGE].currentValue);
        }
      }

      // When There is call display proper call messages
      if (change[enums.CALL_MESSAGE]) {
        let prevProps = { callMessage: null };
        let props = { callMessage: null };

        prevProps[enums.CALL_MESSAGE] =
          change[enums.CALL_MESSAGE].previousValue;
        props[enums.CALL_MESSAGE] = change[enums.CALL_MESSAGE].currentValue;

        if (prevProps.callMessage !== props.callMessage && props.callMessage) {

          this.actionHandler({
            type: enums.CALL_UPDATED,
            payLoad: change[enums.CALL_MESSAGE].currentValue,
          });
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    let user = CometChat.getLoggedinUser().then((user) => {
      this.loggedInUser = user;
    });
  }

  /**
   * Updating the reply count of Thread Parent Message
   * @param Any message
   */
  updateReplyCount(messages: any) {
    try {
      const receivedMessage = messages[0];

      let messageList = [...this.messageList];
      let messageKey = messageList.findIndex(
        (m) => m.id === receivedMessage.parentMessageId
      );
      if (messageKey > -1) {
        const messageObj = messageList[messageKey];
        let replyCount = messageObj.replyCount ? messageObj.replyCount : 0;
        replyCount = replyCount + 1;
        const newMessageObj = Object.assign({}, messageObj, {
          replyCount: replyCount,
        });

        messageList.splice(messageKey, 1, newMessageObj);
        this.messageList = [...messageList];
      }
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
      let messages = action.payLoad;

      let data = action.payLoad;

      switch (action.type) {
       
        case enums.CUSTOM_MESSAGE_RECEIVE:
        case enums.MESSAGE_RECEIVED: {
          const message = messages[0];
          if (message.parentMessageId) {
            this.updateReplyCount(messages);
          } else {
            this.smartReplyPreview(messages);

            setTimeout(() => {
              this.scrollToBottomOfChatWindow();
            }, 2500);

            this.appendMessage(messages);
          }

          this.playAudio();

          break;
        }
       

        case enums.MESSAGE_FETCHED: {
    
          this.prependMessages(messages);
          break;
        }
        case enums.OLDER_MESSAGES_FETCHED: {
          
          this.reachedTopOfConversation = false;

          //No Need for below actions if there is nothing to prepend
          if (messages.length == 0) break;

          let prevScrollHeight = this.chatWindow.nativeElement.scrollHeight;

          this.prependMessages(messages);

          setTimeout(() => {
            this.chatWindow.nativeElement.scrollTop =
              this.chatWindow.nativeElement.scrollHeight - prevScrollHeight;
          });

          break;
        }
        case enums.MESSAGE_COMPOSED: {
          this.appendMessage(messages);
          break;
        }
        case enums.MESSAGE_SENT: {
          this.actionGenerated.emit({
            type:enums.MESSAGE_COMPOSED,
            payLoad:messages
          })
          this.messageSent(messages);
          break;
        }
        case enums.MESSAGE_UPDATED: {
      
          this.updateMessages(messages);
          break;
        }
        case enums.VIEW_ACTUAL_IMAGE: {
          this.actionGenerated.emit({
            type: enums.VIEW_ACTUAL_IMAGE,
            payLoad: messages,
          });
          break;
        }
        case enums.NEW_CONVERSATION_OPENED: {
          this.resetPage();
          this.setMessages(messages);

          break;
        }
        case enums.VIEW_MESSAGE_THREAD: {
          this.actionGenerated.emit({
            type: enums.VIEW_MESSAGE_THREAD,
            payLoad: messages,
          });
          break;
        }
        case enums.THREAD_PARENT_MESSAGE_UPDATED: {
          this.actionGenerated.emit({
            type: enums.THREAD_PARENT_MESSAGE_UPDATED,
            payLoad: data,
          });
          break;
        }
        case enums.DELETE_MESSAGE: {
          this.deleteMessage(messages);
          break;
        }
        case enums.EDIT_MESSAGE: {
          this.editMessage(messages);
          break;
        }
        case enums.MESSAGE_EDIT: {
          this.messageEdited(messages);
          break;
        }
        case enums.AUDIO_CALL:
        case enums.VIDEO_CALL:
        case enums.VIEW_DETAIL:
          case enums.DIRECT_CALL:
        case enums.MENU_CLICKED: {
    
          this.actionGenerated.emit(action);
          break;
        }
        // case enums.DIRECT_CALL: {
        //   this.directCall()
        //   break;
        // }

        case enums.SEND_REACTION: {
          this.toggleReaction(true);
          break;
        }
        case enums.SHOW_REACTION: {
          this.showReaction(messages);
          break;
        }
        case enums.STOP_REACTION: {
          this.toggleReaction(false);
          break;
        }
        case enums.CLEAR_MESSAGE_TO_BE_UPDATED: {
          this.messageToBeEdited = null;
          break;
        }
        case enums.MESSAGE_UPDATED: {
          this.updateMessages(messages);
          break;
        }

        case enums.MESSAGE_DELETE: {
          this.removeMessages(messages);
          break;
        }
        case enums.GROUP_UPDATED:
          this.groupUpdated(data.message, data.key, data.group, data.options);
          break;
        case enums.POLL_ANSWERED: {
          // this.updatePollMessage(messages);
          break;
        }
        case enums.CALL_UPDATED: {
          this.callUpdated(messages);
          break;
        }
        // case enums.MESSAGE__READ: {
        
        //   this.messageEdited(messages)
        //   break;
        // }
        case enums.AUDIO_CALL:
        case enums.VIDEO_CALL:
        case enums.VIEW_DETAIL:
        case enums.MENU_CLICKED: {
          this.actionGenerated.emit(action);
          break;
        }
        
        case enums.REACT_TO_MESSAGE:
          this.reactToMessage(messages);
          break;
          case enums.SESSION_ID:
          this.actionGenerated.emit({
            type:"sessionid",
            sessionid:action.sessionid
          })
          break;
          case enums.DIRECT_CALL_STARTED:
    
        
            this.appendMessage(messages);
         
            break;
            case enums.INCOMING_DIRECT_CALL:
             this.actionGenerated.emit({
              
               type:enums.INCOMING_DIRECT_CALL,
               payLoad:messages
             })
            
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sets the message to which reaction has to be set
   * @param
   */
  reactToMessage(message: any) {
    try {
      this.messageToReact = message;
    } catch (error) {
      logger(error);
    }
  }


  /**
   * Resets The component to initial conditions
   * @param
   */
  resetPage() {
    try {
      this.messageToBeEdited = null;
      this.replyPreview = null;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * set Messages Directly , coz new conversation is opened , hence no need to prepend or append
   * @param Any messages
   */
  setMessages(messages: any) {
    try {
      this.messageList = [...messages];

      this.scrollToBottomOfChatWindow();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * prepend Fetched Messages
   * @param Any messages
   */
  prependMessages(messages: any) {
    try {
      this.messageList = [...messages, ...this.messageList];
    } catch (error) {
      logger(error);
    }
  }

  /**
   * append Messages that are sent
   * @param Any messages
   */
  appendMessage(messages: any) {
    try {
      let dummy = [...this.messageList];
      this.messageList = [...new Set([...dummy, ...messages])];
      // this.messageList = [...dummy, ...messages];
      setTimeout(() => {
        this.scrollToBottomOfChatWindow();
      }, 1000);
      

      // this.scrollToBottomOfChatWindow();
     
    } catch (error) {
      logger(error);
    }
  }

  messageSent(messages:any) {
    const message = messages[0];
		const messageList = [...this.messageList];

		let messageKey = messageList.findIndex(m => m._id === message._id);
		if (messageKey > -1) {
			const newMessageObj = { ...message };
			messageList.splice(messageKey, 1, newMessageObj);
			messageList.sort((a, b) => a.id - b.id);
		}
    this.messageList = messageList;
		this.scrollToBottomOfChatWindow();
  }

  /**
   * updates Poll Messages depending on answer given by user
   * @param Any messages
   */
  updatePollMessage(message: any) {

    try {
      const messageList = [...this.messageList];
      const messageId = message.poll.id;
      let messageKey = messageList.findIndex((m: any, k) => m.id === messageId);
      if (messageKey > -1) {
        const messageObj: object = messageList[messageKey];

        const metadataObj = {
          "@injected": { extensions: { polls: message.poll } },
        };

        const newMessageObj = { ...messageObj, metadata: metadataObj };

        this.messageEdited(newMessageObj);
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * update status of message ie. read or deliv
   * @param Any messages
   */
  updateMessages = (messages: any) => {
    try {
      this.messageList = [...messages];
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Delete the message
   * @param Any message
   */
  deleteMessage = (message: any) => {
    try {
      const messageId = message.id;
      CometChat.deleteMessage(messageId)
        .then((deletedMessage) => {
          this.removeMessages([deletedMessage]);

          const messageList = [...this.messageList];
          let messageKey = messageList.findIndex((m: any) => m.id === message.id);

          this.actionGenerated.emit({
            type: enums.THREAD_PARENT_MESSAGE_UPDATED,
            updateType: enums.DELETE,
            payLoad: [deletedMessage],
          });

          if (messageList.length - messageKey === 1 && !message.replyCount) {
            this.actionGenerated.emit({
              type: enums.MESSAGE_DELETE,
              payLoad: [deletedMessage],
            });
          }
        })
        .catch((error) => {
          logger("Message delete failed with error:", error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Sets The message to be edited to pass it to the message composer
   * @param Any messages
   */
  editMessage(messages: any) {
    try {
      this.messageToBeEdited = messages;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Render The Message List after Message has been successfullly edited
   * @param Any message
   */
  messageEdited(message: any) {
    try {
      const messageList = [...this.messageList];
      let messageKey = messageList.findIndex((m: any) => m.id === message.id);
      if (messageKey > -1) {
        const messageObj = messageList[messageKey];

        const newMessageObj = Object.assign({}, messageObj, message);

        messageList.splice(messageKey, 1, newMessageObj);
        this.updateMessages(messageList);

        this.actionGenerated.emit({
          type: enums.THREAD_PARENT_MESSAGE_UPDATED,
          updateType: enums.EDIT,
          payLoad: [newMessageObj],
        });

        if (messageList.length - messageKey === 1 && !message.replyCount) {
          this.actionGenerated.emit({
            type: enums.MESSAGE_EDIT,
            payLoad: [newMessageObj],
          });
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * If the message gets deleted successfull , remove the deleted message in frontend using this function
   * @param Any messages
   */
  removeMessages = (messages: any) => {
    try {
      const deletedMessage = messages[0];
      const messagelist = [...this.messageList];

      let messageKey = messagelist.findIndex(
        (message: any) => message.id === deletedMessage.id
      );
      if (messageKey > -1) {
        let messageObj = { ...messagelist[messageKey] as {} };
        let newMessageObj = Object.assign({}, messageObj, deletedMessage);

        messagelist.splice(messageKey, 1, newMessageObj);

        this.messageList = [...messagelist];
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Checks extension smartReplyPreview
   * @param messages
   */
  smartReplyPreview(messages: any) {
    try {
      const message = messages[0];

      if (message.hasOwnProperty(enums.METADATA)) {
        const metadata = message[enums.METADATA];
        if (metadata.hasOwnProperty(enums.INJECTED)) {
          const injectedObject = metadata[enums.INJECTED];
          if (injectedObject.hasOwnProperty(enums.EXTENSIONS)) {
            const extensionsObject = injectedObject[enums.EXTENSIONS];
            if (extensionsObject.hasOwnProperty(enums.SMART_REPLY)) {
              const smartReply = extensionsObject[enums.SMART_REPLY];
              if (smartReply.hasOwnProperty(enums.ERROR) === false) {
                this.replyPreview = message;
              } else {
                this, (this.replyPreview = null);
              }
            }
          }
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handles scroll of window
   * @param e
   */
  handleScroll(e: any) {
    try {
      const bottom =
        Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
        Math.round(e.currentTarget.clientHeight);

      const top = e.currentTarget.scrollTop === 0;

      if (top) {
        this.reachedTopOfConversation = top;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Scrolls to bottom of chat window
   */
  scrollToBottomOfChatWindow() {
    try {
      setTimeout(() => {
        this.chatWindow.nativeElement.scrollTop =
          this.chatWindow.nativeElement.scrollHeight -
          this.chatWindow.nativeElement.clientHeight;
      });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Toggle Reaction -> true/false
   * @param
   */
  toggleReaction(flag: any) {
    try {
      this.liveReaction = flag;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Shows Reaction on receiving end
   * @param
   */
  showReaction(reaction: any): boolean {
    try {
      if (!reaction.hasOwnProperty(enums.METADATA)) {
        return false;
      }

      if (reaction[enums.METADATA] == undefined) {
        return false;
      }

      if (
        !reaction[enums.METADATA].hasOwnProperty(enums.TYPE) ||
        !reaction[enums.METADATA].hasOwnProperty(enums.REACTION)
      ) {
        return false;
      }
      if (
        !enums.LIVE_REACTIONS.hasOwnProperty(reaction[enums.METADATA].reaction)
      ) {
        return false;
      }

      if (reaction[enums.METADATA].type === enums.LIVE_REACTION_KEY) {
        this.reactionName = reaction[enums.METADATA].reaction;
        this.liveReaction = true;
      }
    } catch (error) {
      logger(error);
    }
    return true;
  }

  /**
   * Appends call message
   * @param message
   */
  callUpdated(message: any) {
    try {
      this.appendMessage([message]);
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
      audio.src = INCOMING_MESSAGE_SOUND;
      audio.play();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Emits an Action Indicating that Group Data has been updated
   * @param
   */
  groupUpdated = (message: any, key: any, group: any, options: any) => {
    try {
      this.appendMessage([message]);

      this.actionGenerated.emit({
        type: enums.GROUP_UPDATED,
        payLoad: { message, key, group, options },
      });
    } catch (error) {
      logger(error);
    }
  };
 
}
