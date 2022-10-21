import { styles as baseStyle} from "../../Shared/Types/interface"

export interface composerStyles extends baseStyle{
    inputBackground?:string,
    inputTextFont?: string,
    inputTextColor?: string,
    attachmentIconTint?: string,
sendButtonIconTint?: string,
emojiIconTint?: string,
stickerCloseIconTint?: string,

}
export interface toolTipStyles extends baseStyle{
    boxShadow?:string;

}

export interface messagePreviewStyle extends baseStyle{
    messagePreviewBorder?: string
    messagePreviewBackground?: string
    messagePreviewTitleFont?:string
    messagePreviewTitleColor?: string
    messagePreviewSubtitleColor?: string
    messagePreviewSubtitleFont?: string
    messagePreviewCloseButtonIconTint?: string
}
export interface createPollStyle extends baseStyle{
    placeholderTextFont?:string
    placeholderTextColor?:string
    deleteIconTint?:string
    titleFont?:string
    titleColor?:string
    closeIconTint?:string
    questionBackground?:string
    answerHelpTextFont?:string
    answerHelpTextColor?:string
    addAnswerIconTint?:string
    createPollButtonTextFont?:string
    createPollButtonTextColor?:string
    createPollButtonBackground?:string
    addAnswerTextFont?:string
    addAnswerTextColor?:string
    errorTextFont?:string;
    errorTextColor?:string
    optionPlaceholderTextFont:string
    optionPlaceholderTextColor:string
}