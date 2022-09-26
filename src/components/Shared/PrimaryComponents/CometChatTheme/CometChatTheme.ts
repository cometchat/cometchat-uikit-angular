import { Palette } from "./Palette";
import { Typography } from "./Typography";
import { Breakpoints } from "./Breakpoint";
import { DefaultStyles } from "./DefaultStyles";
import {fontHelper} from "./Typography"
class CometChatTheme {
	 palette = new Palette({}); //(each palette will have dark and light mode)
	 typography = new Typography(); //Typography will contain fonts and is customizable
	 globalStyles = { ...DefaultStyles };
	 breakpoints = new Breakpoints();
	 constructor({
		palette = new Palette({}),
		typography = new Typography(),
		globalStyles = { ...DefaultStyles },
		breakpoints = new Breakpoints()

	 }){
		 this.palette =palette
		 this.typography=typography
		 this.globalStyles=globalStyles
		 this.breakpoints=breakpoints


	 }
}
export { CometChatTheme, Palette, Typography, Breakpoints,fontHelper };