



/**
 * @class FontDetails
 * @param {String} fontFamily
 * @param {String} fontWeight
 * @param {String} fontSize
 */
 class FontDetails {
	fontFamily:string;
	fontWeight:string = "";
	fontSize:string = "";
	constructor({
		fontFamily = "",
		fontWeight = "",
		fontSize = ""
	}) {
		this.fontFamily = fontFamily;
		this.fontWeight = fontWeight;
		this.fontSize = fontSize;
	}
}



/**
 * @class Typography
 * @param {String} fontFamily
 * @param {String} fontWeightRegular
 * @param {String} fontWeightMedium
 * @param {String} fontWeightSemibold
 * @param {String} fontWeightBold
 * @param {Object} heading
 * @param {Object} name
 * @param {Object} title1
 * @param {Object} title2
 * @param {Object} subtitle1
 * @param {Object} subtitle2
 * @param {Object} text1
 * @param {Object} text2
 * @param {Object} caption1
 * @param {Object} caption2
 */

class Typography {
	public fontFamily:string = ["Inter,sans-serif"].join(",");
	public fontWeightRegular:string = "400";
	public fontWeightMedium:string = "500";
	public fontWeightSemibold:string = "600";
	public fontWeightBold:string = "700";
	public heading:FontDetails = new FontDetails({});
	public name:FontDetails = new FontDetails({});
	public title1:FontDetails = new FontDetails({});
	public title2:FontDetails = new FontDetails({});
	public subtitle1:FontDetails = new FontDetails({});
	public subtitle2:FontDetails = new FontDetails({});
	public text1:FontDetails = new FontDetails({});
	public text2:FontDetails = new FontDetails({});
	public caption1:FontDetails = new FontDetails({});
	public caption2:FontDetails = new FontDetails({});

	constructor(


		{
			fontFamily = ["Inter,sans-serif"].join(","),
			fontWeightRegular = "400",
			fontWeightMedium = "500",
			fontWeightSemibold = "600",
			fontWeightBold = "700",
		heading = new FontDetails({
			fontFamily: ["Inter","sans-serif"].join(","),
			fontWeight: "700",
			fontSize: "22px",
		}),

		name = new FontDetails({
			fontFamily: ["Inter","sans-serif"].join(","),
			fontWeight: "500",
			fontSize: "16px",
		}),

		title1 = new FontDetails({
			fontFamily: ["Inter","sans-serif"].join(","),
			fontWeight: "600",
			fontSize: "22px",
		}),

		title2 = new FontDetails({
			fontFamily: ["Inter","sans-serif"].join(","),
			fontWeight: "700",
			fontSize: "15px",
		}),

		subtitle1 = new FontDetails({
			fontFamily: ["Inter","sans-serif"].join(","),
			fontWeight: "400",
			fontSize: "15px",
		}),

		subtitle2 = new FontDetails({
			fontFamily: ["Inter","sans-serif"].join(","),
			fontWeight: "400",
			fontSize: "13px",
		}),

		text1 = new FontDetails({
			fontFamily: ["Inter","sans-serif"].join(","),
			fontWeight: "500",
			fontSize: "15px",
		}),

		text2 = new FontDetails({
			fontFamily: ["Inter","sans-serif"].join(","),
			fontWeight: "500",
			fontSize: "13px",
		}),

		caption1 = new FontDetails({
			fontFamily: ["Inter","sans-serif"].join(","),
			fontWeight: "500",
			fontSize: "12px",
		}),

		caption2 = new FontDetails({
			fontFamily: ["Inter","sans-serif"].join(","),
			fontWeight: "500",
			fontSize: "11px",
		})
	}) {
		this.fontFamily = fontFamily;
		this.fontWeightRegular = fontWeightRegular;
		this.fontWeightMedium = fontWeightMedium;
		this.fontWeightSemibold = fontWeightSemibold;
		this.fontWeightBold = fontWeightBold;
		this.heading = heading;
		this.name = name;
		this.title1 = title1;
		this.title2 = title2;
		this.subtitle1 = subtitle1;
		this.subtitle2 = subtitle2;
		this.text1 = text1;
		this.text2 = text2;
		this.caption1 = caption1;
		this.caption2 = caption2;
	}

	setFontFamily(fontFamily:any) {
		this.fontFamily = fontFamily.join(",");
	}

	setFontWeightRegular(fontWeightRegular:string) {
		this.fontWeightRegular = fontWeightRegular;
	}

	setFontWeightMedium(fontWeightMedium:string) {
		this.fontWeightMedium = fontWeightMedium;
	}

	setFontWeightSemibold(fontWeightSemibold:string) {
		this.fontWeightSemibold = fontWeightSemibold;
	}

	setFontWeightBold(fontWeightBold:string) {
		this.fontWeightBold = fontWeightBold;
	}

	setHeading(headingFont:FontDetails) {

		if (headingFont && headingFont.fontSize) {
			this.heading.fontSize = headingFont.fontSize;
		}

		if (headingFont && headingFont.fontWeight) {
			this.heading.fontWeight = headingFont.fontWeight;
		}
	}

	setName(nameFont:FontDetails) {

		if (nameFont && nameFont.fontSize) {
			this.name.fontSize = nameFont.fontSize;
		}

		if (nameFont && nameFont.fontWeight) {
			this.name.fontWeight = nameFont.fontWeight;
		}
	}

	setTitle1(titleFont:FontDetails) {

		if (titleFont && titleFont.fontSize) {
			this.title1.fontSize = titleFont.fontSize;
		}

		if (titleFont && titleFont.fontWeight) {
			this.title1.fontWeight = titleFont.fontWeight;
		}
	}

	setTitle2(titleFont:FontDetails) {

		if (titleFont && titleFont.fontSize) {
			this.title2.fontSize = titleFont.fontSize;
		}

		if (titleFont && titleFont.fontWeight) {
			this.title2.fontWeight = titleFont.fontWeight;
		}
	}

	setSubtitle1(subtitleFont:FontDetails) {

		if (subtitleFont && subtitleFont.fontSize) {
			this.subtitle1.fontSize = subtitleFont.fontSize;
		}

		if (subtitleFont && subtitleFont.fontWeight) {
			this.subtitle1.fontWeight = subtitleFont.fontWeight;
		}
	}

	setSubtitle2(subtitleFont:FontDetails) {

		if (subtitleFont && subtitleFont.fontSize) {
			this.subtitle2.fontSize = subtitleFont.fontSize;
		}

		if (subtitleFont && subtitleFont.fontWeight) {
			this.subtitle2.fontWeight = subtitleFont.fontWeight;
		}
	}

	setText1(textFont:FontDetails) {

		if (textFont && textFont.fontSize) {
			this.text1.fontSize = textFont.fontSize;
		}

		if (textFont && textFont.fontWeight) {
			this.text1.fontWeight = textFont.fontWeight;
		}
	}

	setText2(textFont:FontDetails) {

		if (textFont && textFont.fontSize) {
			this.text2.fontSize = textFont.fontSize;
		}

		if (textFont && textFont.fontWeight) {
			this.text2.fontWeight = textFont.fontWeight;
		}
	}

	setCaption1(captionFont:FontDetails) {

		if (captionFont && captionFont.fontSize) {
			this.caption1.fontSize = captionFont.fontSize;
		}

		if (captionFont && captionFont.fontWeight) {
			this.caption1.fontWeight = captionFont.fontWeight;
		}
	}

	setCaption2(captionFont:FontDetails) {

		if (captionFont && captionFont.fontSize) {
			this.caption2.fontSize = captionFont.fontSize;
		}

		if (captionFont && captionFont.fontWeight) {
			this.caption2.fontWeight = captionFont.fontWeight;
		}
	}
}
  const fontHelper = (obj:any) => {
    return `${obj.fontWeight} ${obj.fontSize} ${obj.fontFamily}`;
  };

export { Typography,fontHelper };