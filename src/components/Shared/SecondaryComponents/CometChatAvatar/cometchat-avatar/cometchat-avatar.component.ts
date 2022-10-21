import {
  Component,
  Input,
  OnInit,
  OnChanges,
  ChangeDetectorRef,
} from "@angular/core";
@Component({
  selector: "cometchat-avatar",
  templateUrl: "./cometchat-avatar.component.html",
  styleUrls: ["./cometchat-avatar.component.scss"],
})
export class CometChatAvatarComponent implements OnInit, OnChanges {
  // we will receive this properties from parent component
  @Input() image: string = ""; //The image URL
  @Input() name: any; //Name of the image
  @Input() width: string = "28px"; //Width of the avatar in pixels
  @Input() height: string = "28px"; //Height of the avatar in pixels
  @Input() border: string = "none"; //This property sets an element's border. It sets the values of border-width, border-style, and border-color.
  @Input()borderRadius: string = "24px"; //Rounded corners of the border
  @Input() backgroundColor: string = "rgb(255,255,255)"; //Background Color of the element used for the fallback
  @Input() nameTextColor: string = "rgb(20,20,20)"; //Text color of the name
  @Input() backgroundSize: string = "cover"; //Background Size of the image
  @Input() nameTextFont: string = "500 16px Inter"; //It sets all the different properties of an element's font. font-style(optional) font-variant(optional) font-weight(optional) font-size(mandatory) line-height(optional) font-family(mandatory)
  @Input() outerView: string = ""; //Spacing between the image and the outer border
  @Input() outerViewSpacing: string = ""; //Spacing between the image and the outer border
  public avatar = "";
  constructor(private ref:ChangeDetectorRef) { };
  /**
 * 
 * CometChatAvatarComponent is used to show user and group profile image.
 * 
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
  ngOnChanges() {
   
    if (this.image && this.image.trim().length) {
      this.avatar = this.image
    }
    else if (this.name && Object.keys(this.name).length) {
      let splitName = this.name.split(" ")
      const char = (splitName.length && splitName.length > 1 ) ? splitName[0].substring(0, 1).toUpperCase() + splitName[1].substring(0, 1).toUpperCase():   this.name.substring(0, 2).toUpperCase();
      this.avatar = this.generateAvatar(char);
    }
  }
  ngOnInit() {
  }
  /**
   * generating name image for avatar using first 2 letters of username.
   * @param  {string} data
   */
  generateAvatar = (data: string) => {
    const canvas = document.createElement("canvas");
    const context: any = canvas.getContext("2d");
    canvas.width = 200;
    canvas.height = 200;
    //Draw background
    context.fillStyle = this.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    //Draw text
    context.font = this.getCanvasFontSize(this.nameTextFont);;
    context.fillStyle = this.nameTextColor;
    context.strokeStyle = "rgba(20, 20, 20, 8%)";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(data, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL("image/svg");
  }
  getCanvasFontSize(font:string){
    let fontStyle = font?.split(" ");
    let fontSize = Number(fontStyle[1]?.replace("px", ""));
    let fontInPixel = fontSize * 5.5 + "px"
    return `${fontStyle[0]} ${fontInPixel} ${fontStyle[2]}`
  }
  // this object contains dynamic stylings for this component
  AvatarStyles = {
    getImageStyle: () => {
      return {
        backgroundSize: this.backgroundSize,
        backgroundImage: `url(${this.avatar})`,
        border: `${this.border} `,
        borderRadius: this.borderRadius,
      };
    },
    getContainerStyle: () => {
      return {
        height: this.height,
        width: this.width,
        borderRadius: this.borderRadius,
      };
    },
    getOuterViewStyle: () => {
      return {
        height: this.height,
        width: this.width,
        borderRadius: this.borderRadius,
        outline:this.outerView,
        outlineOffset:this.outerViewSpacing
      };
    }
  }
}
