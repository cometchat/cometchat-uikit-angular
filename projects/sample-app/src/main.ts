import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { CometChatLocalize, CometChatUIKit, UIKitSettingsBuilder } from '@cometchat/chat-uikit-angular';
import { sampleAppTranslations } from './app/i18n';
import { environment } from './environments/environment';
import {CometChat} from '@cometchat/chat-sdk-javascript';
import { metaInfo } from './metaInfo';
import { installEventRecorder } from './e2e-event-recorder';
import { resolveCredentials } from './resolve-credentials';

/** Set by the `e2e` build configuration (angular.json `define`); undefined otherwise. */
declare const CC_SAMPLE_OFFLINE_DEFAULT: boolean | undefined;


function bootstrap(): void {
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err)
  );
}

function initCometChat(): void {
  try {


    // The keys saved on /credentials win, field by field, over environment.ts.
    const creds = resolveCredentials(environment);
    const builder = new UIKitSettingsBuilder()
      .setAppId(creds.appId)
      .setRegion(creds.region)
      .setAuthKey(creds.authKey)
      .subscribePresenceForAllUsers()
      .setCallingEnabled((environment as { calling?: boolean }).calling ?? true);
    // Optional host overrides (the offline E2E build points them at a local fake server).
    const env = environment as typeof environment & { clientHost?: string; adminHost?: string; offline?: boolean; frameProbe?: boolean };
    // Offline E2E only: record every committed row list for "not even for a
    // moment" assertions (offline TEST-PLAN §3.3). Never installed otherwise.
    if (env.frameProbe) {
      const frames: { at: number; surface: string; rows: unknown[] }[] = [];
      (globalThis as any).__ccFrames = frames;
      (globalThis as any).__ccFrameProbe = (surface: string, rows: unknown[]) => frames.push({ at: performance.now(), surface, rows });
      // Same build: the public-event log for the offline-OFF baseline (UIT-OFF-01).
      installEventRecorder();
    }
    if (env.clientHost) builder.setClientHost(env.clientHost);
    if (env.adminHost) builder.setAdminHost(env.adminHost);
    // The sample app turns offline support ON by default (the kit itself keeps it
    // OFF unless the app calls setOfflineConfig). `?offline=0` turns it off for
    // that tab; `?offline=1` forces it on. It needs a Chat SDK with offline
    // support (4.3.1 or later); older SDKs ignore it.
    const query = new URLSearchParams(window.location.search);
    let offlineParam = query.get('offline');
    let offlineConfigParam = query.get('offlineConfig');
    // Offline E2E build only: the test's choice survives the login redirect and
    // a reload (a "relaunch") in the same tab.
    if (env.offline !== undefined) {
      const E2E_KEY = 'cc-e2e-offline';
      try {
        if (offlineParam !== null || offlineConfigParam !== null) {
          sessionStorage.setItem(E2E_KEY, JSON.stringify({ offline: offlineParam, config: offlineConfigParam }));
        } else {
          const saved = JSON.parse(sessionStorage.getItem(E2E_KEY) || 'null');
          if (saved) { offlineParam = saved.offline; offlineConfigParam = saved.config; }
        }
      } catch { /* storage unavailable: the query alone decides */ }
    }
    // `-c e2e` builds define CC_SAMPLE_OFFLINE_DEFAULT=false: the online E2E suite covers the kit's default (OFF).
    const offlineDefault =
      env.offline ??
      (typeof CC_SAMPLE_OFFLINE_DEFAULT === 'boolean' ? CC_SAMPLE_OFFLINE_DEFAULT : true);
    if (offlineParam === '1' || (offlineParam !== '0' && offlineDefault)) {
      let extra: Record<string, unknown> = {};
      // e.g. ?offlineConfig={"maxPendingMessages":2} (offline E2E: queue limits, encryption).
      try { extra = offlineConfigParam ? JSON.parse(offlineConfigParam) : {}; } catch { extra = {}; }
      // `any`: the OFF baseline builds this file against a kit release without the setting.
      (builder as any).setOfflineConfig?.({ ...extra, enabled: true });
    }
    const settings = builder.build();

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
