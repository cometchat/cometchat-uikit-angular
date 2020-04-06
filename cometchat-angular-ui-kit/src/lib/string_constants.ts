import { ADD_MEMBERES_CONTS } from './add-members-component/add-members-component-consts';


export const MEDIA_MESSAGES_COMPOSER_ACTIONS = {
    MEDIA_MESSAGE_SENT: 'media_message_sent',
    ERROR_IN_MESSAGE_SENDING: 'error_in_message_sending',
    WHITEBOARD_MESSAGE_SENT: 'whiteboard_message_sent',
    WRITEBOARD_MESSAGE_SENT: 'writeboard_message_sent',
    BROADCAST_MESSAGE_SENT: 'broadcast_message_sent',
    BROADCAST_DEMO_MESSAGE_SENT: 'broadcast_message_demo_sent',
    MESSAGE_SENT: 'message_sent'
};
export const MESSAGES_COMPOSER_ACTIONS = {
    MESSAGE_SENT: 'message_sent',
    CLICK_OPTION_MENU: 'click_option_menu',
    CLICK_TOGGLE_EMOJI: 'click_toggle_emoji',
    CLICK_RECORD_AUDIO: 'click_record_audio',
    CLICK_SEND_MESSAGE: 'send_message',
    ERROR_IN_MESSAGE_SENDING: 'error_in_message_sending'
};

export const CONVERSATION_SCREEN_HEADER_ACTIONS = {
    VIDEO_CALL_STARTED: 'video_call_started',
    AUDIO_CALL_STARTED: 'audio_call_started',
    USER_OPTION_MENU_SELECTED: 'user_option_menu_selected',
    GROUP_OPTION_MENU_SELECTED: 'group_option_menu_selected',
    USER_STATUS_CHANGED: {
        ONLINE: 'online',
        OFFLINE: 'offline'
    },
    TYPING_STATUS_CHANGED: {
        TYPING_STARTED: 'typing_started',
        TYPING_ENDED: 'typing_ended'
    }
};
export const USER_LIST_ACTIONS = {

    USER_STATUS_CHANGED: {
        ONLINE: 'online',
        OFFLINE: 'offline'
    },

};
export const CALL_SCREEN_ACTIONS = {
    INCOMING_CALL_RECEIVED: 'incoming_call_received',
    INCOMING_CALL_STARTED: 'incoming_call_started',
    INCOMING_CALL_CANCELLED: 'incoming_call_cancelled',
    INCOMING_CALL_REJECTED: 'incoming_call_rejected',
    OUTGOING_CALL_INITIATED: 'outgoing_call_initiated',
    OUTGOING_CALL_STARTED: 'outgoing_call_started',
    OUTGOING_CALL_ACCEPTED: 'outgoing_call_accepted',
    OUTGOING_CALL_REJECTED: 'outgoing_call_rejected',
    OUTGOING_CALL_ENDED: 'outgoing_call_ended',
    HIDE_SCREEN: 'hide_screen'
}

export const MORE_SETTINGS_ACTIONS = {
    NOTIFICATION_OPTIONS: 'notification_options',
    PRIVACY_AND_SECURITY_OPTION: 'privacy_and_security_option',
    CHAT_OPTIONS: 'chat_options',
    HELP_OPTIONS: 'help_options',
    REPORT_A_PROBLEM: 'report_a_problem'

};
export const CONTACT_LIST_ACTIONS = {
    CONTACT_ITEM_SELECTED: 'contact_item_selected',
};
export const GROUP_LIST_ACTIONS = {
    GROUP_ITEM_SELECTED: 'group_item_selected',
};
export const CONVERSATION_LIST_ACTIONS = {
    CONVERSATION_ITEM_SELECTED: 'conversation_item_selected',
};
export const NAVIGATION_MENU_ACTIONS = {
    TAB_CHANGED: 'tab_changed',
};

export const SIDEBAR_ACTIONS = {
    ITEM_SELECTED: 'contact_user_conversation_item_selected',
    MORE_INFO_ITEM_SELECTED: 'more_info_item_selected',
    NOTIFICATION_OPTIONS: MORE_SETTINGS_ACTIONS.NOTIFICATION_OPTIONS,
    PRIVACY_AND_SECURITY_OPTION: MORE_SETTINGS_ACTIONS.PRIVACY_AND_SECURITY_OPTION,
    CHAT_OPTIONS: MORE_SETTINGS_ACTIONS.CHAT_OPTIONS,
    HELP_OPTIONS: MORE_SETTINGS_ACTIONS.HELP_OPTIONS,
    REPORT_A_PROBLEM: MORE_SETTINGS_ACTIONS.REPORT_A_PROBLEM,
};

export const CONVERSATIONS_SCREEN_ACTIONS = {
    MESSAGES_COMPOSER_ACTIONS,
    CONVERSATION_SCREEN_HEADER_ACTIONS,
    MEDIA_MESSAGES_COMPOSER_ACTIONS,
    ADD_MEMBERES_CONTS
}