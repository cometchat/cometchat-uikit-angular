import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "cometchat-avatar",
  templateUrl: "./cometchat-avatar.component.html",
  styleUrls: ["./cometchat-avatar.component.scss"],
})
export class CometChatAvatarComponent implements OnInit, OnChanges {
  @Input() item = null;

  @Input() avatar: any =
    "https://data-eu.cometchat.io/assets/images/avatars/spiderman.png";
  @Input() userStatus = "";
  @Input() enableUserStatus: boolean = true;

  constructor(private _sanitizer: DomSanitizer) {}

  ngOnChanges(change: SimpleChanges) {
    if (change["item"]) {
      if (change["item"].previousValue !== change["item"].currentValue) {
        this.setAvatarIfNotPresent();
      }
    }
  }

  ngOnInit() {
    this.setAvatarIfNotPresent();
  }

  setAvatarIfNotPresent() {
    if (this.item) {
      this.avatar = this.item.avatar || this.item.icon;
      this.userStatus = this.item.status;

      if (this.avatar === undefined || this.avatar === null) {
        if (this.item.hasOwnProperty("guid")) {
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
  }

  getAvatar = (generator, data) => {
    const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg1.setAttribute("width", "200");
    svg1.setAttribute("height", "200");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", "200");
    rect.setAttribute("height", "200");
    rect.setAttribute("fill", this.stringToColour(generator));
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
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
  stringToColour = function (str) {
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
