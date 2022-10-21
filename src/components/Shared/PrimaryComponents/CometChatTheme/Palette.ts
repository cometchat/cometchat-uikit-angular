/**
 * @class PaletteItem
 * @param {String} light
 * @param {String} dark
 */
 class PaletteItem {
	light: string = "";
	dark: string = "";
	constructor({ light = "", dark = "" }) {
	  this.light = light;
	  this.dark = dark;
	}
  }
export const modes = {
    light: "light",
    dark: "dark"
}
const opacity = {
	accent50: {
		[modes.light]: "0.04",
		[modes.dark]: "0.04",
	},
	accent100: {
		[modes.light]: "0.08",
		[modes.dark]: "0.08",
	},
	accent200: {
		[modes.light]: "0.15",
		[modes.dark]: "0.14",
	},
	accent300: {
		[modes.light]: "0.24",
		[modes.dark]: "0.23",
	},
	accent400: {
		[modes.light]: "0.33",
		[modes.dark]: "0.34",
	},
	accent500: {
		[modes.light]: "0.46",
		[modes.dark]: "0.46",
	},
	accent600: {
		[modes.light]: "0.58",
		[modes.dark]: "0.58",
	},
	accent700: {
		[modes.light]: "0.69",
		[modes.dark]: "0.71",
	},
	accent800: {
		[modes.light]: "0.82",
		[modes.dark]: "0.84",
	},
};
const getAccentOpacity = (colorCode:string, opacity:string) => {
	if (colorCode.startsWith("#")) {
		return hexToRGBA(colorCode, opacity);
	};
	return RGBToRGBA(colorCode, opacity);
};
const hexToRGBA = (hex:string, opacity:string) => {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return "rgba(" + +r + "," + +g + "," + +b + "," + opacity + ")";
};
const RGBToRGBA = (rgb:any, opacity:string) => {
	// Choose correct separator
	let sep = rgb.indexOf(",") > -1 ? "," : " ";
	// Turn "rgb(r,g,b)" into [r,g,b]
	rgb = rgb.substr(4).split(")")[0].split(sep);
	let r = (+rgb[0]).toString(16),
		g = (+rgb[1]).toString(16),
		b = (+rgb[2]).toString(16);
  	return "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
}
export class Palette {
	mode = modes.light;
	background:any = {
		[modes.light]: "rgba(255,255,255)",
		[modes.dark]: "rgba(0,0,0)",
	};
	primary:any = {
		[modes.light]: "rgba(51, 153, 255)",
		[modes.dark]: "rgba(51, 153, 255)",
	};
	error :any= {
		[modes.light]: "rgba(255, 59, 48)",
		[modes.dark]: "rgba(255, 59, 48)",
	};
	accent:any = {
		[modes.light]: "rgba(20, 20, 20)",
		[modes.dark]: "rgba(255, 255, 255)",
	};
	accent50 :any= {
		[modes.light]: "rgba(20, 20, 20, 0.04)",
		[modes.dark]: "rgba(255, 255, 255, 0.4)",
	};
	accent100 :any= {
		[modes.light]: "rgba(20, 20, 20, 0.08)",
		[modes.dark]: "rgba(255, 255, 255, 0.08)",
	};
	accent200 :any= {
		[modes.light]: "rgba(20, 20, 20, 0.15)",
		[modes.dark]: "rgba(255, 255, 255, 0.14)",
	};
	accent300:any = {
		[modes.light]: "rgba(20, 20, 20, 0.24)",
		[modes.dark]: "rgba(255, 255, 255, 0.23)",
	};
	accent400 :any= {
		[modes.light]: "rgba(20, 20, 20, 0.33)",
		[modes.dark]: "rgba(255, 255, 255, 0.34)",
	};
	accent500 :any= {
		[modes.light]: "rgba(20, 20, 20, 0.46)",
		[modes.dark]: "rgba(255, 255, 255, 0.46)",
	};
	accent600:any = {
		[modes.light]: "rgba(20, 20, 20, 0.58)",
		[modes.dark]: "rgba(255, 255, 255, 0.58)",
	};
	accent700 :any= {
		[modes.light]: "rgba(20, 20, 20, 0.69)",
		[modes.dark]: "rgba(255, 255, 255, 0.71)",
	};
	accent800 :any= {
		[modes.light]: "rgba(20, 20, 20, 0.82)",
		[modes.dark]: "rgba(255, 255, 255, 0.84)",
	};
	accent900 :any= {
        [modes.light]: "rgba(255, 255, 255)",
        [modes.dark]: "rgb(20, 20, 20)",
    };
	success:any = {
		[modes.light]: "rgb(0, 200, 111)",
		[modes.dark]: "rgb(0, 200, 111)",
	};
	secondary:any = {
        [modes.light]: "rgba(248, 248, 248, 0.92)",
        [modes.dark]: "rgb(248, 248, 248, 0.92)",
    };
	constructor({
		mode = modes.light,
		background = new PaletteItem({
			[modes.light]: "rgba(255,255,255)",
			[modes.dark]: "rgba(0,0,0)",
		}),
		primary = new PaletteItem({
			[modes.light]: "rgba(51, 153, 255)",
			[modes.dark]: "rgba(51, 153, 255)",
		}),
		error = new PaletteItem({
			[modes.light]: "rgba(255, 59, 48)",
			[modes.dark]: "rgba(255, 59, 48)",
		}),
		accent = new PaletteItem({
			[modes.light]: "rgba(20, 20, 20)",
			[modes.dark]: "rgba(255, 255, 255)",
		}),
		accent50 = new PaletteItem({
			[modes.light]: "rgba(20, 20, 20, 0.04)",
			[modes.dark]: "rgba(255, 255, 255, 0.4)",
		}),
		accent100 = new PaletteItem({
			[modes.light]: "rgba(20, 20, 20, 0.08)",
			[modes.dark]: "rgba(255, 255, 255, 0.08)",
		}),
		accent200 = new PaletteItem({
			[modes.light]: "rgba(20, 20, 20, 0.15)",
			[modes.dark]: "rgba(255, 255, 255, 0.14)",
		}),
		accent300 = new PaletteItem({
			[modes.light]: "rgba(20, 20, 20, 0.24)",
			[modes.dark]: "rgba(255, 255, 255, 0.23)",
		}),
		accent400 = new PaletteItem({
			[modes.light]: "rgba(20, 20, 20, 0.33)",
			[modes.dark]: "rgba(255, 255, 255, 0.34)",
		}),
		accent500 = new PaletteItem({
			[modes.light]: "rgba(20, 20, 20, 0.46)",
			[modes.dark]: "rgba(255, 255, 255, 0.46)",
		}),
		accent600 = new PaletteItem({
			[modes.light]: "rgba(20, 20, 20, 0.58)",
			[modes.dark]: "rgba(255, 255, 255, 0.58)",
		}),
		accent700 = new PaletteItem({
			[modes.light]: "rgba(20, 20, 20, 0.69)",
			[modes.dark]: "rgba(255, 255, 255, 0.71)",
		}),
		accent800 = new PaletteItem({
			[modes.light]: "rgba(20, 20, 20, 0.82)",
			[modes.dark]: "rgba(255, 255, 255, 0.84)",
		}),
		accent900 = new PaletteItem({
			[modes.light]: "rgba(255, 255, 255)",
			[modes.dark]: "rgb(20, 20, 20)",
		}),
		success = new PaletteItem({
			[modes.light]: "rgb(0, 200, 111)",
			[modes.dark]: "rgb(0, 200, 111)",
		}),
		secondary = new PaletteItem({
			[modes.light]: "rgba(248, 248, 248, 0.92)",
			[modes.dark]: "rgb(248, 248, 248, 0.92)",
		})
	  }) {
		this.mode = mode;
		this.background = background;
		this.primary = primary;
		this.secondary = secondary;
		this.error = error;
		this.success = success;
		this.accent = accent;
		this.accent50 = accent50;
		this.accent100 = accent100;
		this.accent200 = accent200;
		this.accent300 = accent300;
		this.accent400 = accent400;
		this.accent500 = accent500;
		this.accent600 = accent600;
		this.accent700 = accent700;
		this.accent800 = accent800;
		this.accent900 = accent900;
	  }
	getAccent =(mode:string = this.mode)=>{
		return this.accent[mode]
	}
	getAccent50 =(mode:string = this.mode)=>{
		return this.accent50[mode]
	}
	getAccent100 =(mode:string = this.mode)=>{
		return this.accent100[mode]
	}
	getAccent200 =(mode:string = this.mode)=>{
		return this.accent200[mode]
	}
	getAccent300 =(mode:string = this.mode)=>{
		return this.accent300[mode]
	}
	getAccent400 =(mode:string = this.mode)=>{
		return this.accent400[mode]
	}
	getAccent500 =(mode:string = this.mode)=>{
		return this.accent500[mode]
	}
	getAccent600 =(mode:string = this.mode)=>{
		return this.accent600[mode]
	}
	getAccent700 =(mode:string = this.mode)=>{
		return this.accent700[mode]
	}
	getAccent800 =(mode:string = this.mode)=>{
		return this.accent800[mode]
	}
	getAccent900 =(mode:string = this.mode)=>{
		return this.accent900[mode]
	}
	getSuccess =(mode:string = this.mode)=>{
		return this.success[mode]
	}
	getError =(mode:string = this.mode)=>{
		return this.error[mode]
	}
	getPrimary =(mode:string = this.mode)=>{
		return this.primary[mode]
	}
	getSecondary =(mode:string = this.mode)=>{
		return this.secondary[mode]
	}
	getBackground =(mode:string = this.mode)=>{
		return this.background[mode]
	}
	/**
	 * @param  {string} mode
	 */
	setMode(mode:string) {
		this.mode = mode;
	}
	/**
	 * @param  {any} colorset
	 */
	setBackground(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.background = colorset;
		}
	}
	/**
	 * @param  {any} colorset
	 */
	setPrimary(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.primary = colorset;
		}
	}
		/**
	 * @param  {any} colorset
	 */
		 setSecondary(colorset:any) {
			if (colorset && colorset[modes.light] && colorset[modes.dark]) {
				this.secondary = colorset;
			}
		}
	/**
	 * @param  {any} colorset
	 */
	setError(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.error = colorset;
		}
	}
	/**
	 * @param  {any} colorset
	 */
	setAccent(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.accent = {
				[modes.light]: colorset[modes.light],
				[modes.dark]: colorset[modes.dark],
			};
			this.setAccent50({
				[modes.light]: getAccentOpacity(colorset[modes.light], opacity.accent50[modes.light]),
				[modes.dark]: getAccentOpacity(colorset[modes.light], opacity.accent50[modes.dark]),
			});
			this.setAccent100({
				[modes.light]: getAccentOpacity(colorset.light, opacity.accent100[modes.light]),
				[modes.dark]: getAccentOpacity(colorset.dark, opacity.accent100[modes.dark]),
			});
			this.setAccent200({
				[modes.light]: getAccentOpacity(colorset.light, opacity.accent200[modes.light]),
				[modes.dark]: getAccentOpacity(colorset.dark, opacity.accent200[modes.dark]),
			});
			this.setAccent300({
				[modes.light]: getAccentOpacity(colorset.light, opacity.accent300[modes.light]),
				[modes.dark]: getAccentOpacity(colorset.dark, opacity.accent300[modes.dark]),
			});
			this.setAccent400({
				[modes.light]: getAccentOpacity(colorset.light, opacity.accent400[modes.light]),
				[modes.dark]: getAccentOpacity(colorset.dark, opacity.accent400[modes.dark]),
			});
			this.setAccent500({
				[modes.light]: getAccentOpacity(colorset.light, opacity.accent500[modes.light]),
				[modes.dark]: getAccentOpacity(colorset.dark, opacity.accent500[modes.dark]),
			});
			this.setAccent600({
				[modes.light]: getAccentOpacity(colorset.light, opacity.accent600[modes.light]),
				[modes.dark]: getAccentOpacity(colorset.dark, opacity.accent600[modes.dark]),
			});
			this.setAccent700({
				[modes.light]: getAccentOpacity(colorset.light, opacity.accent700[modes.light]),
				[modes.dark]: getAccentOpacity(colorset.dark, opacity.accent700[modes.dark]),
			});
			this.setAccent800({
				[modes.light]: getAccentOpacity(colorset.light, opacity.accent800[modes.light]),
				[modes.dark]: getAccentOpacity(colorset.dark, opacity.accent800[modes.dark]),
			});
		}
	}
	/**
	 * @param  {any} colorset
	 */
	setAccent50(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.accent50 = {
				[modes.light]: colorset[modes.light],
				[modes.dark]: colorset[modes.dark],
			};
		}
	}
	setAccent100(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.accent100 = {
				[modes.light]: colorset[modes.light],
				[modes.dark]: colorset[modes.dark],
			};
		}
	}
	/**
	 * @param  {any} colorset
	 */
	setAccent200(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.accent200 = {
				[modes.light]: colorset[modes.light],
				[modes.dark]: colorset[modes.dark],
			};
		}
	}
	/**
	 * @param  {any} colorset
	 */
	setAccent300(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.accent300 = {
				[modes.light]: colorset[modes.light],
				[modes.dark]: colorset[modes.dark],
			};
		}
	}
	/**
	 * @param  {any} colorset
	 */
	setAccent400(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.accent400 = {
				[modes.light]: colorset[modes.light],
				[modes.dark]: colorset[modes.dark],
			};
		}
	}
	/**
	 * @param  {any} colorset
	 */
	setAccent500(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.accent500 = {
				[modes.light]: colorset[modes.light],
				[modes.dark]: colorset[modes.dark],
			};
		}
	}
	/**
	 * @param  {any} colorset
	 */
	setAccent600(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.accent600 = {
				[modes.light]: colorset[modes.light],
				[modes.dark]: colorset[modes.dark],
			};
		}
	}
	/**
	 * @param  {any} colorset
	 */
	setAccent700(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.accent700 = {
				[modes.light]: colorset[modes.light],
				[modes.dark]: colorset[modes.dark],
			};
		}
	}
	/**
	 * @param  {any} colorset
	 */
	setAccent800(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.accent800 = {
				[modes.light]: colorset[modes.light],
				[modes.dark]: colorset[modes.dark],
			};
		}
	}
	/**
	 * @param  {any} colorset
	 */
	 setAccent900(colorset:any) {
		if (colorset && colorset[modes.light] && colorset[modes.dark]) {
			this.accent900 = {
				[modes.light]: colorset[modes.light],
				[modes.dark]: colorset[modes.dark],
			};
		}
	}
}
const palette = new Palette({});
export {palette}