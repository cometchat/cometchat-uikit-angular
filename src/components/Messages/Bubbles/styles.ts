import {styles as baseStyle} from '../../Shared/Types/interface'
export interface styles {
    height?: string,
    width?: string,
    border?: string,
    background?: string,
   borderRadius?: string,
   textFont:string,
   textColor:string,
   linkPreviewTitleColor?:string,
   linkPreviewTitleFont?:string,
   linkPreviewSubtitleColor?:string,
   linkPreviewSubtitleFont?:string
}

export interface documentStyles extends baseStyle{
    titleFont?: string,
    titleColor?: string,
    subTitleFont?: string,
    subTitleColor?: string,
    iconTint?: string,
    buttonTextFont?: string,
    buttonTextColor?: string,
    buttonBackground?: string,
}

export interface whiteboardStyles extends documentStyles{}

export interface fileBubbleStyle extends baseStyle {
	titleFont?: string,
	titleColor?: string,
	subtitleFont?: string,
	subtitleColor?: string,
	iconTint?: string,

}

export interface pollBubbleStyle extends baseStyle{

    pollQuestionTextFont?: string,
    pollQuestionTextColor?:string,
    pollOptionTextFont?: string,
    pollOptionTextColor?:string,
    pollOptionBackground?: string,
    optionsIconTint?:string,
    totalVoteCountTextFont?:string,
    totalVoteCountTextColor?: string,
    votePercentTextFont?:string,
    votePercentTextColor?:string,
    selectedPollOptionBackground?:string
}
export interface avatarStyles extends baseStyle {
	backgroundColor?: string,
	nameTextFont?: string
	nameTextColor?: string
	outerView?:string,
  outerViewSpacing ?:string

}
export interface groupActionStyles extends baseStyle {
	textFont?: string,
	textColor?: string

}
export interface witeboardStyles extends baseStyle {
    titleFont?: string,
    titleColor?: string,
    subTitleFont?: string,
    subTitleColor?: string,
    iconTint?: string,
    buttonBackgroundColor?: string,
    whiteBoardBackgroundColor?: string,
    buttonTextColor?: string,
    buttonTextFont?: string,


}
export interface placeHolderStyles extends baseStyle {
	textFont?: string
	textColor?: string

}
export interface pollBubbleStyles extends baseStyle {
    pollQuestionTextFont?: string,
    pollQuestionTextColor?: string,
    pollOptionTextFont?: string,
    pollOptionTextColor?: "",
    pollOptionBackground?: string,
    selectedPollOptionBackground?: string,
    optionsIconTint?:string,
    totalVoteCountTextFont?: string,
    totalVoteCountTextColor?: string,
    votePercentTextFont?:string,
    votePercentTextColor?:string,

}

export interface fileBubbleStyles extends baseStyle {
    titleFont?: string,
    titleColor?: string,
    subtitleFont?: string,
    subtitleColor?: string,
    iconTint?: string,

}
export interface messageReceiptStyles  {
   messageWaitIcon :string,
   messageSentIcon :string,
   messageDeliveredIcon :string,
    messageReadIcon :string,
   messageErrorIcon :string,

}
export interface messageOptionsStyle extends baseStyle  {
    iconTint?:string
 }

export {baseStyle}