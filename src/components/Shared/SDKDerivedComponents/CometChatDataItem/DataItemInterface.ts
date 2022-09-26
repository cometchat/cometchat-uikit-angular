import { styles as baseStyle } from "../../Types/interface"
export interface inputData {
	thumbnail?: boolean,
	status?: boolean,
	title?: boolean,
	subtitle?: any,
	id?:boolean,
}
export interface styles extends baseStyle {
	activeBackground?: string,
	titleFont?: string,
	titleColor?: string,
	subtitleFont?: string,
	subtitleColor?: string,
	tailFont?: string,
	tailColor?: string,

}
export interface avatarStyles extends baseStyle {
	backgroundColor?: string,
	nameTextFont?: string
	nameTextColor?: string
	outerView?:string,
  outerViewSpacing ?:string

}
export interface statusIndicatorStyles extends baseStyle {

	style?:any
}