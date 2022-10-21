import { Component, OnInit } from '@angular/core';
import {CometChatTheme,Palette} from '@cometchat-pro/angular-ui-kit'
@Component({
  selector: 'message-theme',
  templateUrl: './message-theme.component.html',
  styleUrls: ['./message-theme.component.scss']
})
export class MessageThemeComponent implements OnInit {

  constructor() { }
  public theme:CometChatTheme = new CometChatTheme({});

  ngOnInit(): void {
    this.theme = new CometChatTheme({
      palette: new Palette({
        mode: "light",
        primary: {
          light: "#D422C2",
          dark: "#D422C2",
        },
        accent: {
          light: "#07E676",
          dark: "#B6F0D3",
        },
        accent50: {
          light: "#39f",
          dark: "#141414",
        },
        accent900: {
          light: "white",
          dark: "black",
        },
      }),
  
    });
  }

}
