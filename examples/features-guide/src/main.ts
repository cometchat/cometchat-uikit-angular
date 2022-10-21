import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatLocalize } from '@cometchat-pro/angular-ui-kit';

import { AppModule } from './app/app.module';
import { COMETCHAT_CONSTANTS } from './CONSTS';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

const appSetting = new CometChat.AppSettingsBuilder().setRegion(COMETCHAT_CONSTANTS.REGION).subscribePresenceForAllUsers().build();
CometChat.init(COMETCHAT_CONSTANTS.APP_ID, appSetting).then(() => {
  let user:string = "superhero1"
  if(user && user != ' '){
    var UID = user
    var authKey = COMETCHAT_CONSTANTS.AUTH_KEY;
    CometChat.getLoggedinUser().then(
      (user) => {
        if (!user) {
          CometChat.login(UID, authKey).then(
            user => {
              window.location.reload();
              console.log("Login Successful:", { user });
           
            }
          );
        }
    
      }
    );
    
    }
  
  // CometChatLocalize.setLocale("hi");

  console.log('app is ready to work');

  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
}, (error:any) => {
  console.log('Error In Init', error);
});