import { styles } from "../../Types/interface";
export interface actionSheetStyles extends styles{
    layoutModeIconTint?: string,
    titleFont?: string,
    titleColor?: string,
    listItemIconTint?:string,
    listItemTitleFont?:string,
    listItemTitleColor?:string,
    listItemIconBackground?:string,
    listItemIconBorderRadius?:string,
}
export interface  actionSheetItemStyle extends styles{
    iconBackground?:string,
    iconTint?:string,
    textFont?:string,
    display ?: string,
    flexDirection ?: string,
    justifyContent ?: string,
}