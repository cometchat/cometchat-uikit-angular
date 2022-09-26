import {font} from './values'
export class Typography  {
	fontFamily = ["Inter","sans-serif"].join(",");
	fontWeightRegular = "400";
	fontWeightMedium = "500";
	fontWeightSemibold = "600";
	fontWeightBold = "700";
	heading:font = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightBold,
		fontSize: "22px",
	};
	name:font = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightMedium,
		fontSize: "16px",
	};
	title1:font = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightSemibold,
		fontSize: "15px",
	};
	title2:font = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightBold,
		fontSize: "22px",
	};
	subtitle1:font = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightRegular,
		fontSize: "15px",
	};
	subtitle2 :font= {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightRegular,
		fontSize: "13px",
	};
	text1 :font= {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightMedium,
		fontSize: "15px",
	};
	text2:font = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightMedium,
		fontSize: "13px",
	};
	caption1:font = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightMedium,
		fontSize: "12px",
	};
	caption2:font = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightMedium,
		fontSize: "11px",
	};
	/**
	 * @param  {string} fontFamily
	 */
	setFontFamily(fontFamily:string) {
		this.fontFamily = fontFamily;

	}
	/**
	 * @param  {string} fontWeightRegular
	 */
	setFontWeightRegular(fontWeightRegular:string) {
		this.fontWeightRegular = fontWeightRegular;
	}
	/**
	 * @param  {string} fontWeightMedium
	 */
	setFontWeightMedium(fontWeightMedium:string) {
		this.fontWeightMedium = fontWeightMedium;
	}
	/**
	 * @param  {string} fontWeightSemibold
	 */
	setFontWeightSemibold(fontWeightSemibold:string) {
		this.fontWeightSemibold = fontWeightSemibold;
	}
	/**
	 * @param  {string} fontWeightBold
	 */
	setFontWeightBold(fontWeightBold:string) {
		this.fontWeightBold = fontWeightBold;
	}
	/**
	 * @param  {any} headingFont
	 */
	setHeading(headingFont:font) {
		if (headingFont && headingFont.fontSize) {
			this.heading.fontSize = headingFont.fontSize;
		}
		if (headingFont && headingFont.fontWeight) {
			this.heading.fontWeight = headingFont.fontWeight;
		}
		if(headingFont && headingFont.fontFamily){
			this.heading.fontFamily = headingFont.fontFamily
		}
	}
	/**
	 * @param  {font} nameFont
	 */
	setName(nameFont:font) {
		if (nameFont && nameFont.fontSize) {
			this.name.fontSize = nameFont.fontSize;
		}
		if (nameFont && nameFont.fontWeight) {
			this.name.fontWeight = nameFont.fontWeight;
		}
		if(nameFont && nameFont.fontFamily){
			this.name.fontFamily = nameFont.fontFamily
		}
	}
	/**
	 * @param  {font} titleFont
	 */
	setTitle1(titleFont:font) {
		if (titleFont && titleFont.fontSize) {
			this.title1.fontSize = titleFont.fontSize;
		}
		if (titleFont && titleFont.fontWeight) {
			this.title1.fontWeight = titleFont.fontWeight;
		}
		if(titleFont && titleFont.fontFamily){
			this.title1.fontFamily = titleFont.fontFamily
		}
	}
	/**
	 * @param  {font} titleFont
	 */
	setTitle2(titleFont:font) {
		if (titleFont && titleFont.fontSize) {
			this.title2.fontSize = titleFont.fontSize;
		}
		if (titleFont && titleFont.fontWeight) {
			this.title2.fontWeight = titleFont.fontWeight;
		}
		if(titleFont && titleFont.fontFamily){
			this.title2.fontFamily = titleFont.fontFamily
		}
	}
	/**
	 * @param  {font} subtitleFont
	 */
	setSubtitle1(subtitleFont:font) {
		if (subtitleFont && subtitleFont.fontSize) {
			this.subtitle1.fontSize = subtitleFont.fontSize;
		}
		if (subtitleFont && subtitleFont.fontWeight) {
			this.subtitle1.fontWeight = subtitleFont.fontWeight;
		}
		if(subtitleFont && subtitleFont.fontFamily){
			this.subtitle1.fontFamily = subtitleFont.fontFamily
		}
	}
	/**
	 * @param  {font} subtitleFont
	 */
	setSubtitle2(subtitleFont:font) {
		if (subtitleFont && subtitleFont.fontSize) {
			this.subtitle2.fontSize = subtitleFont.fontSize;
		}
		if (subtitleFont && subtitleFont.fontWeight) {
			this.subtitle2.fontWeight = subtitleFont.fontWeight;
		}
		if(subtitleFont && subtitleFont.fontFamily){
			this.subtitle2.fontFamily = subtitleFont.fontFamily
		}
	}
	/**
	 * @param  {font} textFont
	 */
	setText1(textFont:font) {
		if (textFont && textFont.fontSize) {
			this.text1.fontSize = textFont.fontSize;
		}
		if (textFont && textFont.fontWeight) {
			this.text1.fontWeight = textFont.fontWeight;
		}
		if(textFont && textFont.fontFamily){
			this.text1.fontFamily = textFont.fontFamily
		}
	}
	/**
	 * @param  {font} textFont
	 */
	setText2(textFont:font) {
		if (textFont && textFont.fontSize) {
			this.text2.fontSize = textFont.fontSize;
		}
		if (textFont && textFont.fontWeight) {
			this.text2.fontWeight = textFont.fontWeight;
		}
		if(textFont && textFont.fontFamily){
			this.text2.fontFamily = textFont.fontFamily
		}
	}
	/**
	 * @param  {font} captionFont
	 */
	setCaption1(captionFont:font) {
		if (captionFont && captionFont.fontSize) {
			this.caption1.fontSize = captionFont.fontSize;
		}
		if (captionFont && captionFont.fontWeight) {
			this.caption1.fontWeight = captionFont.fontWeight;
		}
		if(captionFont && captionFont.fontFamily){
			this.caption1.fontFamily = captionFont.fontFamily
		}
	}
	/**
	 * @param  {font} captionFont
	 */
	setCaption2(captionFont:font) {
		if (captionFont && captionFont.fontSize) {
			this.caption2.fontSize = captionFont.fontSize;
		}
		if (captionFont && captionFont.fontWeight) {
			this.caption2.fontWeight = captionFont.fontWeight;
		}
		if(captionFont && captionFont.fontFamily){
			this.caption2.fontFamily = captionFont.fontFamily
		}
	}
}
export  const fontHelper = (obj:any) => {
    return `${obj.fontWeight} ${obj.fontSize} ${obj.fontFamily}`;
  };