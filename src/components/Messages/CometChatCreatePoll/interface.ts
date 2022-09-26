import { styles as baseStyle} from "../../Shared/Types/interface"

export interface style extends baseStyle {
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
    addAnswerTextFont?:string
    addAnswerTextColor?:string
    optionPlaceholderTextFont?:string
    optionPlaceholderTextColor?:string
    errorTextFont?:string
    errorTextColor?:string
    createPollButtonBackground?:string
}