import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { CometChatLocalize, CometChatUIKit, UIKitSettingsBuilder } from '@cometchat/chat-uikit-angular';
import { sampleAppTranslations } from './app/i18n';
import { environment } from './environments/environment';
import {CometChat} from '@cometchat/chat-sdk-javascript';
import { metaInfo } from './metaInfo';


function bootstrap(): void {
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err)
  );
}

function initCometChat(): void {
  try {


    const settings = new UIKitSettingsBuilder()
      .setAppId(environment.appId)
      .setRegion(environment.region)
      .setAuthKey(environment.authKey)
      .subscribePresenceForAllUsers()
      .setCallingEnabled(true)
      .build();

    const initPromise = CometChatUIKit.init(settings);
    

    if (initPromise) {
      try { CometChat.setDemoMetaInfo(metaInfo) } catch (err) { }
      initPromise
        .then(() => {
          CometChatLocalize.addTranslation(sampleAppTranslations);
          bootstrap();
        })
        .catch((error) => {
          console.error('CometChatUIKit init failed:', error);
          bootstrap();
        });
    } else {
      bootstrap();
    }
  } catch (error) {
    console.error('Error during CometChat initialization:', error);
    bootstrap();
  }
}

initCometChat();
