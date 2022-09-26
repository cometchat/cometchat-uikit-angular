export interface style {
    height?:string,
    width?:string,
    border?:string,
    background?:string,
   borderRadius?:string,
    titleFont?:string,
    titleColor?:string,
    subTitleFont?:string,
    subTitleColor?:string,
    title?:string,
    loadingIconURL?:string,
    loadingIconTint?:string,
    emptyStateTextFont?:string,
    emptyStateTextColor?:string,
    errorStateTextFont?:string,
    errorStateTextColor?:string,
    backIconTint?:string,
	startConversationIconTint?:string,
	searchBorder?:string,
	searchBorderRadius?:string,
	searchBackground?:string,
	searchTextFont?:string,
	searchTextColor?:string,
	searchIconTint?:string,
    nameTextFont?:string,
    nameTextColor?:string,
    timeFont?:string,
    timeColor?:string,
}
import { CometChat } from "@cometchat-pro/chat"

export interface inputData {
    id?:string
    thumbnail?: string,
    status?: string,
    title?: string,
    subtitle?: (object:CometChat.Conversation) => string, 
    time?: string,
    unreadCount?: string,
    readReceipt?:string
}