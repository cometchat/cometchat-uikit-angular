import { styles } from "../../Shared/Types/interface";
export interface style extends styles {
    backButtonIconTint?:string
}
export interface dataItemStyle extends styles {
    activeBackground?: string,
    titleFont?: string,
    titleColor?: string,
    subtitleFont?: string,
    subtitleColor?: string,
}
export interface avatarStyles extends styles {
    outerView?:string,
    outerViewSpacing?:string,
}
export interface inputData {
    thumbnail: boolean,
    title: boolean,
    subtitle: any,
    status: boolean
}
