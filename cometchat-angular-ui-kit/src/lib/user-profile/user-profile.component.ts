import { Component, OnInit, OnChanges, ElementRef, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { MyInfoManager } from './cometchat-manager';
import { MORE_SETTINGS_ACTIONS } from '../string_constants';

@Component({
  selector: 'cometchat-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  myInfoManager = new MyInfoManager();
  user;
  EVENTS = [
    MORE_SETTINGS_ACTIONS.NOTIFICATION_OPTIONS,
    MORE_SETTINGS_ACTIONS.PRIVACY_AND_SECURITY_OPTION,
    MORE_SETTINGS_ACTIONS.CHAT_OPTIONS,
    MORE_SETTINGS_ACTIONS.HELP_OPTIONS,
    MORE_SETTINGS_ACTIONS.REPORT_A_PROBLEM
  ];
  @Output() actionPerformed = new EventEmitter<{ action: string, payload: object }>();
  constructor(private cdRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.init();
  }


  onItemClick = ($event, id) => {
    switch (id) {
      case this.EVENTS[0]:
        this.actionPerformed.emit({ action: id, payload: { user: JSON.parse(this.user) } });
        break;
      case this.EVENTS[1]:
        this.actionPerformed.emit({ action: id, payload: { user: JSON.parse(this.user) } });
        break;
      case this.EVENTS[2]:
        this.actionPerformed.emit({ action: id, payload: { user: JSON.parse(this.user) } });
        break;
      case this.EVENTS[3]:
        this.actionPerformed.emit({ action: id, payload: { user: JSON.parse(this.user) } });
        break;
      case this.EVENTS[4]:
        this.actionPerformed.emit({ action: id, payload: { user: JSON.parse(this.user) } });
        break;
    }
  }

  init() {
    this.myInfoManager.isLoggedIn(this.isChatReady);
  }




  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {
      if (!user.getAvatar()) {
        user.setAvatar(this.getSVGAvatar(user.getUid(), user.getName().substr(0, 1)))
      }
      this.user = JSON.stringify(user);
    } else {
      // TODO show error if chat is not loaded,
    }
  }



  // TODO move bellow two functions to helpers
  getSVGAvatar = (generator: string, data: string) => {
    const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg1.setAttribute("width", "200");
    svg1.setAttribute("height", "200");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '200');
    rect.setAttribute('height', '200');
    rect.setAttribute('fill', this.stringToColour(generator));
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', '50%');
    text.setAttribute('y', '54%');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'white');
    text.setAttribute('font-size', '120');
    text.setAttribute('font-family', "'Inter', sans-serif");
    text.setAttribute('font-wight', "600");
    text.textContent = data;
    svg1.appendChild(rect);
    svg1.appendChild(text);
    let svgString = new XMLSerializer().serializeToString(svg1);


    let decoded = unescape(encodeURIComponent(svgString));
    let base64 = btoa(decoded);

    let imgSource = `data:image/svg+xml;base64,${base64}`;
    return imgSource;
  }


  stringToColour = function (str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      // tslint:disable-next-line: no-bitwise
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let i = 0; i < 3; i++) {
      // tslint:disable-next-line: no-bitwise
      const value = (hash >> (i * 8)) & 0xFF;
      colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
  }

}
