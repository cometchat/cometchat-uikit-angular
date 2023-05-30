import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { CometChat } from '@cometchat-pro/chat';
import { COMETCHAT_CONSTANTS } from './CONSTS';
import { CometChatLocalize, CometChatUIKit, StickersExtension } from '@cometchat-pro/angular-ui-kit';
import { AppModule } from './app/app.module';

import { environment } from './environments/environment';
import { UIKitSettingsBuilder } from 'uikit-utils-lerna';

if (environment.production) {
  enableProdMode();
}
const uiKitSettings = new UIKitSettingsBuilder()
  .setAppId(COMETCHAT_CONSTANTS.APP_ID)
  .setRegion(COMETCHAT_CONSTANTS.REGION)
  .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY)
  .subscribePresenceForFriends()
  .build();


  CometChatUIKit.init(uiKitSettings)!.then(()=>{
    platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

})