import { Injectable } from '@angular/core';
import { CometChatTheme } from '@cometchat-pro/angular-ui-kit';
@Injectable({
  providedIn: 'root'
})
export class CometChatServices {
    public theme:CometChatTheme = new CometChatTheme({});
    public customTheme:CometChatTheme | undefined = undefined;

}