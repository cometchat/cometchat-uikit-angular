import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { CometChatManager } from "../../../utils/controller";
import { INCOMING_OTHER_MESSAGE_SOUND } from "../../../resources/audio/incomingOtherMessageSound";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

@Component({
  selector: "cometchat-conversation-list",
  templateUrl: "./cometchat-conversation-list.component.html",
  styleUrls: ["./cometchat-conversation-list.component.css"],
})
export class CometChatConversationListComponent implements OnInit, OnChanges {
  @Input() item = null;
  @Input() type = null;
  @Input() lastMessage;
  @Output() onUserClick: EventEmitter<any> = new EventEmitter();
  @Input() groupToUpdate = null;
  @Input() groupToLeave = null;
  @Input() groupToDelete = null;

  decoratorMessage: string = STRING_MESSAGES.LOADING_MESSSAGE;
  loggedInUser = null;
  conversationList = [];
  onItemClick = null;
  selectedConversation = undefined;
  ConversationListManager;
  checkItemChange: boolean = false;

  conversationRequest = null;

  conversationListenerId = "chatlist_" + new Date().getTime();
  userListenerId = "chatlist_user_" + new Date().getTime();
  groupListenerId = "chatlist_group_" + new Date().getTime();
  callListenerId = "chatlist_call_" + new Date().getTime();

  CHATS: String = STRING_MESSAGES.CHATS;

  constructor(private ref: ChangeDetectorRef) {
    setInterval(() => {
      if (!this.ref["destroyed"]) {
        this.ref.detectChanges();
      }
    }, 1500);
  }

  ngOnDestroy() {
    this.removeListeners();
  }

  ngOnChanges(change: SimpleChanges) {
    if (change["item"]) {
      this.checkItemChange = true;
      if (
        change["item"].previousValue !== change["item"].currentValue &&
        change["item"].currentValue
      ) {
        if (Object.keys(change["item"].currentValue).length === 0) {
          // this.chatListRef.scrollTop = 0;
          this.selectedConversation = {};
        } else {
          const conversationlist = [...this.conversationList];

          const conversationObj = conversationlist.find((c) => {
            if (
              (c.conversationType === this.type &&
                this.type === "user" &&
                c.conversationWith.uid === this.item.uid) ||
              (c.conversationType === this.type &&
                this.type === "group" &&
                c.conversationWith.guid === this.item.guid)
            ) {
              return c;
            }
            return false;
          });
          if (conversationObj) {
            let conversationKey = conversationlist.indexOf(conversationObj);
            let newConversationObj = {
              ...conversationObj,
              unreadMessageCount: 0,
            };
            conversationlist.splice(conversationKey, 1, newConversationObj);
            this.conversationList = conversationlist;
            this.selectedConversation = newConversationObj;
          }
        }

        // if user is blocked/unblocked, update conversationlist i.e user is removed from conversationList
        if (
          change["item"].previousValue &&
          Object.keys(change["item"].previousValue).length &&
          change["item"].previousValue.uid ===
            change["item"].currentValue.uid &&
          change["item"].previousValue.blockedByMe !==
            change["item"].currentValue.blockedByMe
        ) {
          let conversationlist = [...this.conversationList];

          //search for user
          let convKey = conversationlist.findIndex(
            (c, k) =>
              c.conversationType === "user" &&
              c.conversationWith.uid === change["item"].currentValue.uid
          );
          if (convKey > -1) {
            conversationlist.splice(convKey, 1);
            this.conversationList = conversationlist;
          }
        }
      }
    }

    if (change["groupToUpdate"]) {
      let prevProps = { groupToUpdate: null };
      let props = { groupToUpdate: null };

      prevProps["groupToUpdate"] = change["groupToUpdate"].previousValue;
      props["groupToUpdate"] = change["groupToUpdate"].currentValue;

      if (
        prevProps.groupToUpdate &&
        (prevProps.groupToUpdate.guid !== props.groupToUpdate.guid ||
          (prevProps.groupToUpdate.guid === props.groupToUpdate.guid &&
            (prevProps.groupToUpdate.membersCount !==
              props.groupToUpdate.membersCount ||
              prevProps.groupToUpdate.scope !== props.groupToUpdate.scope)))
      ) {
        const conversationList = [...this.conversationList];
        const groupToUpdate = this.groupToUpdate;

        const groupKey = conversationList.findIndex(
          (group) => group.conversationWith.guid === groupToUpdate.guid
        );
        if (groupKey > -1) {
          const groupObj = conversationList[groupKey];
          const newGroupObj = Object.assign({}, groupObj, groupToUpdate, {
            scope: groupToUpdate["scope"],
            membersCount: groupToUpdate["membersCount"],
          });

          conversationList.splice(groupKey, 1, newGroupObj);

          this.conversationList = conversationList;
        }
      }
    }

    if (change["groupToLeave"]) {
      let prevProps = { groupToLeave: null };
      let props = { groupToLeave: null };

      prevProps["groupToLeave"] = change["groupToLeave"].previousValue;
      props["groupToLeave"] = change["groupToLeave"].currentValue;

      if (
        prevProps.groupToLeave &&
        prevProps.groupToLeave.guid !== props.groupToLeave.guid
      ) {
        const conversationList = [...this.conversationList];
        const groupKey = conversationList.findIndex(
          (group) => group.conversationWith.guid === props.groupToLeave.guid
        );

        if (groupKey > -1) {
          const groupToLeave = props.groupToLeave;
          const groupObj = { ...conversationList[groupKey] };
          const membersCount = parseInt(groupToLeave["membersCount"]) - 1;

          let newgroupObj = Object.assign({}, groupObj, {
            membersCount: membersCount,
            hasJoined: false,
          });

          conversationList.splice(groupKey, 1, newgroupObj);

          this.conversationList = conversationList;
        }
      }
    }

    if (change["groupToDelete"]) {
      let prevProps = { groupToDelete: null };
      let props = { groupToDelete: null };

      prevProps["groupToDelete"] = change["groupToDelete"].previousValue;
      props["groupToDelete"] = change["groupToDelete"].currentValue;

      if (
        prevProps.groupToDelete &&
        prevProps.groupToDelete.guid !== props.groupToDelete.guid
      ) {
        const conversationList = [...this.conversationList];
        const groupKey = conversationList.findIndex(
          (group) => group.conversationWith.guid === props.groupToDelete.guid
        );

        if (groupKey > -1) {
          conversationList.splice(groupKey, 1);

          this.conversationList = conversationList;

          if (conversationList.length === 0) {
            this.decoratorMessage = STRING_MESSAGES.NO_CHATS_FOUND;
          }
        }
      }
    }

    /**
     * When user sends message conversationList is updated with latest message
     */
    if (this.checkItemChange === false) {
      if (change["lastMessage"]) {
        if (
          change["lastMessage"].previousValue !==
            change["lastMessage"].currentValue &&
          change["lastMessage"].currentValue !== undefined
        ) {
          const lastMessage = change["lastMessage"].currentValue[0];

          const conversationList = [...this.conversationList];
          const conversationKey = conversationList.findIndex((c) => {
            if (lastMessage === undefined) {
              return false;
            }
            return c.conversationId === lastMessage.conversationId;
          });

          if (conversationKey > -1) {
            const conversationObj = conversationList[conversationKey];
            let newConversationObj = {
              ...conversationObj,
              lastMessage: lastMessage,
            };

            conversationList.splice(conversationKey, 1);
            conversationList.unshift(newConversationObj);
            this.conversationList = conversationList;
          }
        }
      }
    }
    this.checkItemChange = false;
  }
  ngOnInit() {
    this.conversationRequest = new CometChat.ConversationsRequestBuilder()
      .setLimit(30)
      .build();
    this.getConversation();
    this.attachListeners(this.conversationUpdated);
  }

  fetchNextConversation() {
    return this.conversationRequest.fetchNext();
  }

  /**
   * Listeners for respective functionality
   * @param callback
   */
  attachListeners(callback) {
    CometChat.addUserListener(
      this.userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser) => {
          /* when someuser/friend comes online, user will be received here */
          callback(enums.USER_ONLINE, onlineUser);
        },
        onUserOffline: (offlineUser) => {
          /* when someuser/friend went offline, user will be received here */
          callback(enums.USER_OFFLINE, offlineUser);
        },
      })
    );

    CometChat.addGroupListener(
      this.groupListenerId,
      new CometChat.GroupListener({
        onGroupMemberScopeChanged: (
          message,
          changedUser,
          newScope,
          oldScope,
          changedGroup
        ) => {
          callback(enums.GROUP_MEMBER_SCOPE_CHANGED, changedGroup, message, {
            user: changedUser,
            scope: newScope,
          });
        },
        onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
          callback(enums.GROUP_MEMBER_KICKED, kickedFrom, message, {
            user: kickedUser,
            hasJoined: false,
          });
        },
        onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
          callback(enums.GROUP_MEMBER_BANNED, bannedFrom, message, {
            user: bannedUser,
          });
        },
        onGroupMemberUnbanned: (
          message,
          unbannedUser,
          unbannedBy,
          unbannedFrom
        ) => {
          callback(enums.GROUP_MEMBER_UNBANNED, unbannedFrom, message, {
            user: unbannedUser,
          });
        },
        onMemberAddedToGroup: (
          message,
          userAdded,
          userAddedBy,
          userAddedIn
        ) => {
          callback(enums.GROUP_MEMBER_ADDED, userAddedIn, message, {
            user: userAdded,
            hasJoined: true,
          });
        },
        onGroupMemberLeft: (message, leavingUser, group) => {
          callback(enums.GROUP_MEMBER_LEFT, group, message, {
            user: leavingUser,
          });
        },
        onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
          callback(enums.GROUP_MEMBER_JOINED, joinedGroup, message, {
            user: joinedUser,
          });
        },
      })
    );

    CometChat.addMessageListener(
      this.conversationListenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: (textMessage) => {
          callback(enums.TEXT_MESSAGE_RECEIVED, null, textMessage);
        },
        onMediaMessageReceived: (mediaMessage) => {
          callback(enums.MEDIA_MESSAGE_RECEIVED, null, mediaMessage);
        },
        onCustomMessageReceived: (customMessage) => {
          callback(enums.CUSTOM_MESSAGE_RECEIVED, null, customMessage);
        },
        onMessageDeleted: (deletedMessage) => {
          callback(enums.MESSAGE_DELETED, null, deletedMessage);
        },
        onMessageEdited: (editedMessage) => {
          callback(enums.MESSAGE_EDITED, null, editedMessage);
        },
      })
    );

    CometChat.addCallListener(
      this.callListenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call) => {
          callback(enums.INCOMING_CALL_RECEIVED, null, call);
        },
        onIncomingCallCancelled: (call) => {
          callback(enums.INCOMING_CALL_CANCELLED, null, call);
        },
      })
    );
  }

  /**
   * Listeners Removed
   */
  removeListeners() {
    CometChat.removeMessageListener(this.conversationListenerId);
    CometChat.removeUserListener(this.userListenerId);
    CometChat.removeGroupListener(this.groupListenerId);
    CometChat.removeCallListener(this.callListenerId);
  }

  /**
   * Fetches Conversations Details with all the users
   */
  getConversation() {
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
        this.fetchNextConversation()
          .then((conversationList) => {
            conversationList.forEach((conversation) => {
              if (
                conversation.conversationType === "user" &&
                !conversation.conversationWith.avatar
              ) {
                conversation.conversationWith.avatar = this.setAvatar(
                  conversation
                );
              } else if (
                conversation.conversationType === "group" &&
                !conversation.conversationWith.icon
              ) {
                conversation.conversationWith.icon = this.setAvatar(
                  conversation
                );
              }

              if (
                this.type !== null &&
                this.item !== null &&
                this.type === conversation.conversationType
              ) {
                if (
                  (conversation.conversationType === "user" &&
                    this.item.uid === conversation.conversationWith.uid) ||
                  (conversation.conversationType === "group" &&
                    this.item.guid === conversation.conversationWith.guid)
                ) {
                  conversation.unreadMessageCount = 0;
                }
              }
            });
            this.conversationList = [
              ...this.conversationList,
              ...conversationList,
            ];
            if (this.conversationList.length === 0) {
              this.decoratorMessage = STRING_MESSAGES.NO_CHATS_FOUND;
            } else {
              this.decoratorMessage = "";
            }
          })
          .catch((error) => {
            this.decoratorMessage = STRING_MESSAGES.ERROR;
            console.error(
              "[CometChatConversationList] getConversations fetchNext error",
              error
            );
          });
      })
      .catch((error) => {
        this.decoratorMessage = STRING_MESSAGES.ERROR;
        console.log(
          "[CometChatConversationList] getConversations getLoggedInUser error",
          error
        );
      });
  }

  /**
   * Sets User Avatar If Avatar is not present
   * @param
   */
  setAvatar(conversation) {
    if (
      conversation.conversationType === "user" &&
      !conversation.conversationWith.avatar
    ) {
      const uid = conversation.conversationWith.uid;
      const char = conversation.conversationWith.name.charAt(0).toUpperCase();
    } else if (
      conversation.conversationType === "group" &&
      !conversation.conversationWith.icon
    ) {
      const guid = conversation.conversationWith.guid;
      const char = conversation.conversationWith.name.charAt(0).toUpperCase();
    }
  }

  conversationUpdated = (
    key = null,
    item = null,
    message = null,
    options = null
  ) => {
    switch (key) {
      case enums.USER_ONLINE:
      case enums.USER_OFFLINE: {
        this.updateUser(item);
        break;
      }
      case enums.TEXT_MESSAGE_RECEIVED:
      case enums.MEDIA_MESSAGE_RECEIVED:
      case enums.CUSTOM_MESSAGE_RECEIVED:
        this.updateConversation(message);
        break;
      case enums.MESSAGE_EDITED:
      case enums.MESSAGE_DELETED:
        this.conversationEditedDeleted(message);
        break;
    }
  };

  /**
   * Updates Detail when user comes online/offline
   * @param
   */
  updateUser(user) {
    //when user updates
    const conversationlist = [...this.conversationList];

    //Gets the index of user which comes offline/online
    const conversationKey = conversationlist.findIndex(
      (conversationObj) =>
        conversationObj.conversationType === "user" &&
        conversationObj.conversationWith.uid === user.uid
    );
    if (conversationKey > -1) {
      let conversationObj = { ...conversationlist[conversationKey] };
      let conversationWithObj = {
        ...conversationObj.conversationWith,
        status: user.getStatus(),
      };

      let newConversationObj = {
        ...conversationObj,
        conversationWith: conversationWithObj,
      };
      conversationlist.splice(conversationKey, 1, newConversationObj);

      this.conversationList = conversationlist;
    }
  }

  /**
   *
   * Gets the last message
   * @param conversation
   */
  makeLastMessage(message, conversation = {}) {
    const newMessage = Object.assign({}, message);
    return newMessage;
  }

  /**
   *
   * Updates Conversations as Text/Custom Messages are received
   * @param
   *
   */
  updateConversation(message, notification = true) {
    this.makeConversation(message)
      .then((response: any) => {
        const conversationKey = response.conversationKey;
        const conversationObj = response.conversationObj;
        const conversationList = response.conversationList;

        if (conversationKey > -1) {
          let unreadMessageCount = this.makeUnreadMessageCount(conversationObj);
          let lastMessageObj = this.makeLastMessage(message, conversationObj);
          let newConversationObj = {
            ...conversationObj,
            lastMessage: lastMessageObj,
            unreadMessageCount: unreadMessageCount,
          };

          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.conversationList = conversationList;

          if (notification) {
            this.playAudio();
          }
        } else {
          let unreadMessageCount = this.makeUnreadMessageCount();
          let lastMessageObj = this.makeLastMessage(message);
          let newConversationObj = {
            ...conversationObj,
            lastMessage: lastMessageObj,
            unreadMessageCount: unreadMessageCount,
          };
          conversationList.unshift(newConversationObj);
          this.conversationList = conversationList;

          if (notification) {
            this.playAudio();
          }
        }
      })
      .catch((error) => {
        console.log(
          "This is an error in converting message to conversation",
          error
        );
      });
  }

  /**
   *
   * Gets The Count of Unread Messages
   * @param
   */
  makeUnreadMessageCount(conversation: any = {}, operator = null) {
    if (Object.keys(conversation).length === 0) {
      return 1;
    }

    let unreadMessageCount = parseInt(conversation.unreadMessageCount);
    if (
      this.selectedConversation &&
      this.selectedConversation.conversationId === conversation.conversationId
    ) {
      unreadMessageCount = 0;
    } else if (
      (this.item &&
        this.item.hasOwnProperty("guid") &&
        conversation.conversationWith.hasOwnProperty("guid") &&
        this.item.guid === conversation.conversationWith.guid) ||
      (this.item &&
        this.item.hasOwnProperty("uid") &&
        conversation.conversationWith.hasOwnProperty("uid") &&
        this.item.uid === conversation.conversationWith.uid)
    ) {
      unreadMessageCount = 0;
    } else {
      if (operator && operator === "decrement") {
        unreadMessageCount = unreadMessageCount ? unreadMessageCount - 1 : 0;
      } else {
        unreadMessageCount = unreadMessageCount + 1;
      }
    }

    return unreadMessageCount;
  }

  /**
   * Changes detail of conversations
   * @param
   */
  makeConversation(message) {
    const promise = new Promise((resolve, reject) => {
      CometChat.CometChatHelper.getConversationFromMessage(message)
        .then((conversation: any) => {
          let conversationList = [...this.conversationList];
          let conversationKey = conversationList.findIndex(
            (c) => c.conversationId === conversation.conversationId
          );

          let conversationObj = { ...conversation };
          if (conversationKey > -1) {
            conversationObj = { ...conversationList[conversationKey] };
          }

          resolve({
            conversationKey: conversationKey,
            conversationObj: conversationObj,
            conversationList: conversationList,
          });
        })
        .catch((error) => reject(error));
    });
    return promise;
  }

  /**
   * Updates Conversation View when message is edited or deleted
   */
  conversationEditedDeleted(message) {
    this.makeConversation(message)
      .then((response: any) => {
        const conversationKey = response.conversationKey;
        const conversationObj = response.conversationObj;
        const conversationList = response.conversationList;
        if (conversationKey > -1) {
          let lastMessageObj = conversationObj.lastMessage;

          if (lastMessageObj.id === message.id) {
            const newLastMessageObj = Object.assign(
              {},
              lastMessageObj,
              message
            );
            let newConversationObj = Object.assign({}, conversationObj, {
              lastMessage: newLastMessageObj,
            });
            conversationList.splice(conversationKey, 1, newConversationObj);
            this.conversationList = conversationList;
          }
        }
      })
      .catch((error) => {
        console.log(
          "This is an error in converting message to conversation",
          error
        );
      });
  }

  /**
   * If User scrolls to the bottom of the current Conversation list than fetch next items of the Conversation list and append
   * @param Event e
   */
  handleScroll(e) {
    const bottom =
      Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
      Math.round(e.currentTarget.clientHeight);
    if (bottom) {
      this.decoratorMessage = STRING_MESSAGES.LOADING_MESSSAGE;
      this.getConversation();
    }
  }

  /**
   * Emits User on User Click
   * @param user
   */

  userClicked(user) {
    this.onUserClick.emit(user);
  }
  /**
   * Plays Audio When Message is Received
   */
  playAudio() {
    let audio = new Audio();
    audio.src = INCOMING_OTHER_MESSAGE_SOUND;
    audio.play();
  }
}
