import { styles as baseStyle } from "../../Types/interface";

export interface confirmDialogStyle extends baseStyle {
    height?:string,
    width?:string,
    background?:string,
    borderRadius?:string,
    border?:string,
    titleFont?:string,
    titleColor?:string,
    subtitleFont?:string,
    subtitleColor?:string,
    confirmTextFont?:string,
    confirmTextColor?:string,
    confirmBackground?:string,
    cancelTextColor?:string,
    cancelTextFont?:string,
    cancelBackground?:string

}