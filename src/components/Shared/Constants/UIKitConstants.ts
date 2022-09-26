import { CometChat } from "@cometchat-pro/chat";
export const MessageCategory = {
    message: CometChat.CATEGORY_MESSAGE,
    custom: CometChat.CATEGORY_CUSTOM,
    action: CometChat.CATEGORY_ACTION,
    call: CometChat.CATEGORY_CALL
}
export const MessageTypes = {
    text: CometChat.MESSAGE_TYPE.TEXT,
    file: CometChat.MESSAGE_TYPE.FILE,
    image: CometChat.MESSAGE_TYPE.IMAGE,
    audio: CometChat.MESSAGE_TYPE.AUDIO,
    video: CometChat.MESSAGE_TYPE.VIDEO,
    delete: "delete",
    edited: "edited",
    poll: "extension_poll",
    sticker: "extension_sticker",
    document: "extension_document",
    whiteboard: "extension_whiteboard",
    meeting: "meeting",
    location: "location",
    groupMember:"groupMember"
}
export const UsersConstants = {
    MESSAGE_ : "message_",
    GROUP_LIST_ : "grouplist_",
    GROUPS: "Groups",
    SEARCH: "Search",
    SCOPE : "scope",
    USERS: "Users",
    USER_LIST_ : "userlist_",



    CALL_TYPE_DIRECT:"DIRECT_CALL",
    LOADING_MESSSAGE: "Loading...",
    ERROR : "error",
    NO_USERS_FOUND:"No users found",
    SOMETHING_WENT_WRONG:"Something went wrong!"

    

}
export const GroupsConstants = {
    MESSAGE_ : "message_",
    GROUP_MEMBERS:"members",
    GROUP_MEMBER:"member",

    GROUP_ : "group_",
    ENTER_GROUP_NAME: "Name",
    CREATING_MESSSAGE: "Creating...",
    GROUP_PASSWORD_BLANK: "Group password cannot be blank",
    PARTICIPANT: "Participant",
    PUBLIC: "Public",
    PRIVATE: "Private",

    CREATE_GROUP: "Create Group",
    GROUP_LIST_ : "grouplist_",
    GROUPS: "Groups",
    GUID : "guid",
    VIEW_MESSAGE_THREAD : "viewMessageThread",
    CLOSE_THREAD_CLICKED : "closeThreadClicked",
     CLOSE_FULL_SCREEN_IMAGE : "closeFullScreenImage",
     VIEW_ACTUAL_IMAGE : "viewActualImage",
     ACTION_TYPE_GROUPMEMBER : "groupMember",
     EDIT : "edit",
 DELETE : "delete",
     MENU_CLICKED : "menuClicked",
      PUBLIC_GROUP : "public",
 PRIVATE_GROUP : "private",
 PROTECTED_GROUP : "protected",
 MEMBER_SCOPE_CHANGED : "memberScopeChanged",
 MEMBERS_ADDED : "membersAdded",
 MEMBER_UNBANNED : "memberUnbanned",
 MEMBERS_UPDATED : "membersUpdated",
 MEMBER_UPDATED : "memberUpdated",
 GROUP_UPDATED : "groupUpdated",
 LEFT_GROUP : "leftGroup",
  DELETE_GROUP : "groupDeleted",
 BREAKPOINT_MIN_WIDTH : "320",
 BREAKPOINT_MAX_WIDTH : "767",
     UID : "uid",
    SEARCH: "Search",
    GROUP_TO_UPDATE : "groupToUpdate",
    SCOPE : "scope",
    GROUP_TO_DELETE : "groupToDelete",
    MEMBERS_COUNT : "membersCount",
    NO_GROUPS_FOUND: "No groups found",
    LOADING_MESSSAGE: "Loading...",
    ERROR : "error",
    GROUP_MEMBER_KICKED: "onGroupMemberKicked",
    HAS_JOINED : "hasJoined",
    CLOSE_CREATE_GROUP_VIEW : "closeCreateGroupView",
    GROUP_CREATED : "groupCreated",
    GROUP_MEMBER_SCOPE_CHANGED: "onGroupMemberScopeChanged",
    GROUP_MEMBER_BANNED: "onGroupMemberBanned",
    GROUP_MEMBER_UNBANNED: "onGroupMemberUnbanned",
    GROUP_MEMBER_ADDED: "onMemberAddedToGroup",
    GROUP_MEMBER_LEFT: "onGroupMemberLeft",
    GROUP_MEMBER_JOINED: "onGroupMemberJoined",
    

}


export const MessageReceiverType = {
    user: CometChat.RECEIVER_TYPE.USER,
    group: CometChat.RECEIVER_TYPE.GROUP,
}
export const userStatusType = {
    online: CometChat.USER_STATUS.ONLINE,
    offline: CometChat.USER_STATUS.OFFLINE,
}
export const MessageOption = {
    editMessage: "edit",
    deleteMessage: "delete",
    replyMessage: "reply",
    replyInThread: "replyInThread",
    translateMessage: "translate",
    reactToMessage: "react",
    messageInformation: "messageInformation",
    copyMessage: "copy",
    shareMessage: "share",
    forwardMessage: "forward",
    sendMessagePrivately: "sendMessagePrivately",
    replyMessagePrivately: "replyMessagePrivately",
}
export const MessageOptionForConstants = {
sender:"sender",
receiver:"receiver",
both:"both"
}
export const MessageListAlignment = {
    left: "left",
    standard: "standard",
}
export const tooltipPosition = {
    left: "left",
    right: "standarightrd",
    top: "top",
    bottom: "bottom",
}
export const MessageBubbleAlignment = {
    left: "left",
    right: "right",
    center: "center",
}
export const MessageTimeAlignment = {
    top: "top",
    bottom: "bottom"
}
export const MessageStatus = {
    inprogress: "inprogress",
    success: "success",
}
export const GroupOptions = {
    leave: "leave",
    delete: "delete",
    viewMembers: "viewMembers",
    addMembers: "addMembers",
    bannedMembers: "bannedMembers",
    voiceCall: "voiceCall",
    videoCall: "videoCall",
    viewInformation: "viewInformation",
}
export const GroupMemberOptions = {
    kick: "kick",
    ban: "ban",
    unban: "unban",
    changeScope: "changeScope",
}
export const UserOptions = {
    blockUnblock: "blockUnblock",
    viewProfile: "viewProfile",
    voiceCall: "voiceCall",
    videoCall: "videoCall",
    viewInformation: "viewInformation",
}
export const ConversationOption = {
    delete: "delete"
}
export const ConversationType = {
    users: "users",
    groups: "groups",
    both: "both",
}
export const GroupType = {
    private: CometChat.GROUP_TYPE.PRIVATE,
    password: CometChat.GROUP_TYPE.PASSWORD,
    public: CometChat.GROUP_TYPE.PUBLIC
}
export const messageConstants = {
    animate:1500,
    JOIN: "Join",
    MAX_MESSAGE_COUNT: 1000,
    COMPOSED_THREAD_MESSAGE: "composedThreadMessage",
    MESSAGE_FETCHED: "messageFetched",
    MESSAGE_FETCHED_AGAIN: "messageFetchedAgain",
    INCOMING_CALL_RECEIVED: "onIncomingCallReceived",
    MESSAGE_OBJECT: "messageObject",
    TEXT:"text",
    OUTGOING_CALL_ACCEPTED: "onOutgoingCallAccepted",
    YOU_DELETED_THIS_MESSAGE: "⚠️ You deleted this message",
	THIS_MESSAGE_DELETED: "⚠️ This message was deleted",
    OUTGOING_CALL_REJECTED: "onOutgoingCallRejected",
    INCOMING_CALL_CANCELLED: "onIncomingCallCancelled",
    GROUP_MEMBER_SCOPE_CHANGED: "onGroupMemberScopeChanged",
    MESSAGE_IS_DELETED:"MESSAGE_IS_DELETED",
    GROUP_MEMBER_KICKED: "onGroupMemberKicked",
    GROUP_MESSAGE: "groupMessage",
    CALL_MESSAGE: "callMessage",
    GROUP_MEMBER_BANNED: "onGroupMemberBanned",
    GROUP_MEMBER_UNBANNED: "onGroupMemberUnbanned",
    GROUP_MEMBER_ADDED: "onMemberAddedToGroup",
    GROUP_MEMBER_LEFT: "onGroupMemberLeft",
    GROUP_MEMBER_JOINED: "onGroupMemberJoined",
    HEART: "heart",
    MESSAGE_DELIVERED: "onMessagesDelivered",
    MESSAGE_READ: "onMessagesRead",
    MESSAGE_DELETED: "onMessageDeleted",
    MESSAGE_EDITED: "onMessageEdited",
    MESSAGE_SENT: "messageSent",
    TEXT_MESSAGE_RECEIVED: "onTextMessageReceived",
    YESTERDAY: "Yesterday",
    MEDIA_MESSAGE_RECEIVED: "onMediaMessageReceived",
    CUSTOM_MESSAGE_RECEIVED: "onCustomMessageReceived",
    PARENT_MESSAGE_ID: "parentMessageId",
    HEAD_GROUP_: "head_group_",
    MESSAGE_: "message_",
    GROUP_: "group_",
    CALL_: "call_",
    CALL_TYPE_DIRECT: "DIRECT_CALL",
    REACHED_TOP_OF_CONVERSATION: "reachedTopOfConversation",
    MESSAGED: "messages",
    DELIVERY: "delivery",
    READ: "read",
    SENT: "sent",
    DESTROYED: "destroyed",
    LAST_ACTIVE_AT: "Last Active At: ",
    REACTED: "reacted",
    APP_SYSTEM: "app_system",
    LOADING: "Loading...",
    ERROR: "Error",
    NO_CHATS_FOUND: "No messages here yet...",
    GET: "GET",
    POST: "POST",
    V1_FETCH: "v1/fetch",
    V1_CREATE: "v1/create",
    SUCCESS: "success",
    V1_VOTE: "v1/vote",
    V1_REACT: "v1/react",
    V2_CREATE: "v2/create",
    MESSAGE_TRANSLATION:"message-translation",
    V2_VOTE: "v2/vote",
    V2_TRANSLATE:"v2/translate",
    POLLS: "polls",
    REACTIONS: "reactions",
}
export const conversationConstants = {
    IS_ACTIVE: "isActive",
    CONVERSATION__LISTENER__ID:"conversation__LISTENER",
    NO_ITEM_SELECTED_MESSAGE: "Select a chat to start messaging",
    NO_LAST_MESSAGE: "tap to start conversation",
    BREAKPOINT_MIN_WIDTH: "320",
    BREAKPOINT_MAX_WIDTH: "767",
    CUSTOM_MESSAGE_POLL: "📊 Poll",
    CUSTOM_MESSAGE_STICKER: "💟 Sticker",
    CUSTOM_MESSAGE_DOCUMENT: "📃 Document",
    CUSTOM_MESSAGE_WHITEBOARD: "📝 Whiteboard",
    YOU_DELETED_THIS_MESSAGE: "⚠️ You deleted this message",
    CUSTOM_MESSAGE: "You have a message",
    MEDIA_MESSAGE: "Media message",
    THIS_MESSAGE_DELETED: "⚠️ This message was deleted",
    CHAT_LIST_: "chatlist_",
    CHAT_LIST_USER_: "chatlist_user_",
    MESSAGE_IMAGE: "📷 Image",
    MESSAGE_FILE: "📁 File",
    MESSAGE_VIDEO: "🎥 Video",
    MESSAGE_AUDIO: "🎵 Audio",
    CHAT_LIST_GROUP_: "chatlist_group_",
    CUSTOM_MESSAGE_RECEIVE: "customMessageReceived",
    CUSTOM_TYPE_POLL: "extension_poll",
    CUSTOM_TYPE_STICKER: "extension_sticker",
    CHAT_LIST_CALL_: "chatlist_call_",
    DESTROYED: "destroyed",
    ITEM: "item",
    GROUP_TO_UPDATE: "groupToUpdate",
    SCOPE: "scope",
    MEMBERS_COUNT: "membersCount",
    USER_JOINED: "onUserJoined",
    USER_LEFT: "onUserLeft",
    USER_ONLINE: "onUserOnline",
    USER_OFFLINE: "onUserOffline",
    CONVERSATION_OBJECT: "conversationObject",
    TEXT_MESSAGE_RECEIVED: "onTextMessageReceived",
    MEDIA_MESSAGE_RECEIVED: "onMediaMessageReceived",
    YESTERDAY: "Yesterday",
    CUSTOM_MESSAGE_RECEIVED: "onCustomMessageReceived",
    MESSAGE_DELIVERED: "onMessagesDelivered",
    MESSAGE_READ: "onMessagesRead",
    MESSAGE_DELETED: "onMessageDeleted",
    MESSAGE_EDITED: "onMessageEdited",
    MESSAGE_SENT: "messageSent",
    GROUP_TO_LEAVE: "groupToLeave",
    GROUP_TO_DELETE: "groupToDelete",
    LAST_MESSAGE: "lastMessage",
    CONVERSATION_DETAILS: "conversationDetails",
    DELETED_AT: "deletedAt",
    SENT_AT: "sentAt",
    USER_LIST_: "userlist_",
    IS_TYPING: 'IS_TYPING',
    IN_A_THREAD: "IN_A_THREAD",
    CHATS: "CHATS",
    SEARCH: "Search",
    LOADING: "Loading...",
    DELETE_CONVERSATION: "Delete Conversation?",
    DELETE_BUTTON: "Delete",
    CANCEL_BUTTON: "Cancel",
    ERROR: "Error",
    GUID: "guid",
    UID: "uid",
    DECREMENT: "decrement",
    SUCCESS: "success",
    NO_CHATS_FOUND: "No chats found",
    EDIT: "edit",
    DELETE: "delete",
    GROUP_MEMBER_SCOPE_CHANGED: "onGroupMemberScopeChanged",
    GROUP_MEMBER_KICKED: "onGroupMemberKicked",
    GROUP_MEMBER_BANNED: "onGroupMemberBanned",
    GROUP_MEMBER_UNBANNED: "onGroupMemberUnbanned",
    GROUP_MEMBER_ADDED: "onMemberAddedToGroup",
    GROUP_MEMBER_LEFT: "onGroupMemberLeft",
    GROUP_MEMBER_JOINED: "onGroupMemberJoined",
    USER: "user",
    GROUP: "group",
    TYPING_STARTED: "onTypingStarted",
    TYPING_ENDED: "onTypingEnded",
}
export const states = {
    initial:"initial",
    success:"success",
    error:"error",
    loading:"loading"
}
export const callConstants = {
    incomingCall: "incomingCall",
    incomingMessage: "incomingMessage",
    incomingMessageFromOther: "incomingMessageFromOther",
    outgoingCall: "outgoingCall",
    outgoingMessage: "outgoingMessage",
    INCOMING_CALL_RECEIVED: "onIncomingCallReceived",
    OUTGOING_CALL_ACCEPTED: "onOutgoingCallAccepted",
    OUTGOING_CALL_REJECTED: "onOutgoingCallRejected",
    INCOMING_CALL_CANCELLED: "onIncomingCallCancelled",
    CALL_SCREEN_: "callscreen_",
    CALL_TYPE_DIRECT: "DIRECT_CALL",
}
export const MetadataKey = Object.freeze({
    file: "file",
    liveReaction: "live_reaction",
    extension: "extensions",
    extensions: {
        thumbnailGeneration: "thumbnail-generation",
        polls: "polls",
        document: "document",
        whiteboard: "whiteboard",
        xssfilter: "xss-filter",
        datamasking: "data-masking",
        profanityfilter: "profanity-filter",
        reactions: "reactions",
        linkpreview: "link-preview",
        smartReply: "smart-reply",
        REPLY_POSITIVE: "reply_positive",
        REPLY_NEUTRAL: "reply_neutral",
        REPLY_NEGATIVE: "reply_negative",
    },
    metadata: "metadata",
    injected: "@injected",
    links: "links",
});

  
  export const ExtensionURLs = {
    reaction: "v1/react",
    poll: "v2/create",
    stickers: "v1/fetch",
    document: "v1/create",
    whiteboard: "v1/create",
  };
export const messageAlignment = {
    left: "left",
    right: "right",
}
export const listenerEnums = {
    head_user_: "head_user_",
    head_message_: "head_message_",
    head_group_: "head_group_",
}
export const groupEnums = {
    group_member_kicked: "onGroupMemberKicked",
    group_member_banned: "onGroupMemberBanned",
    group_member_added: "onMemberAddedToGroup",
    group_member_left: "onGroupMemberLeft",
    group_member_joined: "onGroupMemberJoined",
   
}
export const typingEnums = {
    typing_started: "onTypingStarted",
    typing_ended: "onTypingEnded",
    is_typing: "is typing...",
    typing: "typing...",
}
export const userStatusEnums = {
    user_online: "onUserOnline",
    user_offline: "onUserOffline",
}
export const chatOptionEnums = {
    view_detail: "viewDetail",
    audio_call: "audioCall",
    video_call: "videoCall",
    direct_call: "directCall",
}
export const composerEnums = {
    attach_video: "Attach video",
    attach_audio: "Attach audio",
    attach_file: "Attach file",
    attach_image: "Attach image",
    add_emoji: "Add Emoji",
}
export const stickerEnums = {
    no_stickers_found: "No stickers found",
    default_stickers: "defaultStickers",
    custom_stickers: "customStickers",
    stickers: "stickers",
    loading_message: "Loading...",
    data: "data",
    customData: "customData",
    sticker_url: "sticker_url",
    sticker_name: "sticker_name",
    sticker: "Sticker",
}
export const dateFormat = {
    timeFormat: "timeFormat", // "hh:mm"
    dayDateFormat: "DayDateFormat", //Jun 1, 2022
    dayDateTimeFormat: "DayDateTimeFormat" //day,EEEE,year
}
export const timeFormat = {
    twelvehours: "hh:mm",
    twentyFourHours: "HH:mm"
}