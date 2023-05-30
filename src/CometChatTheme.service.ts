import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CometChatTheme } from 'uikit-resources-lerna';
@Injectable({
  providedIn: 'root'
})

export class CometChatThemeService {
    public theme:CometChatTheme = new CometChatTheme({});
}