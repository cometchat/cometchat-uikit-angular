
import { styles as baseStyle } from "../../Shared/Types/interface";
export interface joinGroupStyle extends baseStyle{
    boxShadow?:string,
    titleTextFont?: string,
    titleTextColor?: string,
    errorTextFont?: string,
    errorTextColor?: string,
    passwordTextFont?:string,
    passwordTextColor?:string,
    passwordPlaceholderTextFont?:string,
    passwordPlaceholderTextColor?:string,
    passwordInputBackground?:string,
    passwordInputBorder?: string,
    passwordInputBorderRadius?: string,
    passwordInputBoxShadow?:string,
    joinButtonTextFont?:string,
    joinButtonTextColor?:string,
    joinButtonBackground?:string,
    joinButtonBorderRadius?:string

}