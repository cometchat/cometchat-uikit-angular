import { Palette } from "./Palette";
import { Typography } from "./Typography";
import {fontHelper} from "./Typography"
class CometChatTheme {
	 palette = new Palette({}); //(each palette will have dark and light mode)
	 typography = new Typography({}); //Typography will contain fonts and is customizable
	 constructor({
		palette = new Palette({}),
		typography = new Typography({}),

	 }){
		 this.palette = palette
		 this.typography= typography


	 }
}
export { CometChatTheme, Palette, Typography,fontHelper };