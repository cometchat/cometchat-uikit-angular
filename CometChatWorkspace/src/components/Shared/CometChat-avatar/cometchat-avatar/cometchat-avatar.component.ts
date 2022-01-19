import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import * as enums from "../../../../utils/enums";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-avatar",
  templateUrl: "./cometchat-avatar.component.html",
  styleUrls: ["./cometchat-avatar.component.scss"],
})
export class CometChatAvatarComponent implements OnInit, OnChanges {
  @Input() item: any = null;

  @Input() avatar: any = 
    "https://data-eu.cometchat.io/assets/images/avatars/spiderman.png";
  @Input() userStatus = "";
  @Input() enableUserStatus: boolean = true;

  constructor(private _sanitizer: DomSanitizer) {}

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.ITEM]) {
        if (
          change[enums.ITEM].previousValue !== change[enums.ITEM].currentValue
        ) {
          this.setAvatarIfNotPresent();
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    try {
      this.setAvatarIfNotPresent();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * If Avatar of user is not present Sets Avatar as First Character of User Name
   */
  setAvatarIfNotPresent() {
    try {
      if (this.item) {
        this.avatar = this.item.avatar || this.item.icon;
        this.userStatus = this.item.status;

        if (this.avatar === undefined || this.avatar === null) {
          if (this.item.hasOwnProperty(enums.GUID)) {
            this.avatar = this._sanitizer.bypassSecurityTrustResourceUrl(
              this.getAvatar(
                this.item.guid,
                this.item.name.charAt(0).toUpperCase()
              )
            );
          } else {
            this.avatar = this._sanitizer.bypassSecurityTrustResourceUrl(
              this.getAvatar(
                this.item.uid,
                this.item.name.charAt(0).toUpperCase()
              )
            );
          }
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * if a user doesn't have an avatar , it take the first character of username in data paramter and converts it into an svg image
   * @param
   */
  getAvatar (generator: any, data: string) {
      const svg1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      svg1.setAttribute("width", "200");
      svg1.setAttribute("height", "200");

      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", "200");
      rect.setAttribute("height", "200");
      rect.setAttribute("fill", this.stringToColour(generator));
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", "50%");
      text.setAttribute("y", "54%");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "white");
      text.setAttribute("font-size", "120");
      text.setAttribute("font-family", "'Inter', sans-serif");
      text.setAttribute("font-wight", "600");
      text.textContent = data;
      svg1.appendChild(rect);
      svg1.appendChild(text);
      let svgString = new XMLSerializer().serializeToString(svg1);

      let decoded = unescape(encodeURIComponent(svgString));
      let base64 = btoa(decoded);

      let imgSource = `data:image/svg+xml;base64,${base64}`;
      return imgSource;
  };

  /**
   * Sets Color to String
   * @param str
   */
  stringToColour (str: string) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      let colour = "#";
      for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xff;
        colour += ("00" + value.toString(16)).substr(-2);
      }
      return colour;
  };
}
