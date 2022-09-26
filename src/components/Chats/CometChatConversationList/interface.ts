import { styles } from "../../Shared/Types/interface";

export interface listItemStyle extends styles {
    titleFont: string,
    titleColor: string,
    subTitleColor: string,
    subTitleFont: string,
    typingIndicatorTextColor: string,
    typingIndicatorTextFont: string,
    threadIndicatorTextColor: string,
    threadIndicatorTextFont: string,
    activeBackground?:string,
}