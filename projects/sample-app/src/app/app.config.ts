import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { COMETCHAT_GLOBAL_CONFIG } from '@cometchat/chat-uikit-angular';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    {
      provide: COMETCHAT_GLOBAL_CONFIG,
      useValue: {
        // Thread follow/unfollow ships off by default: the backend exposes no
        // capability flag, so only the integrator knows whether the threads
        // endpoints are live for their app. The sample app opts in so both
        // surfaces are demoable — the message action sheet's Follow thread
        // option and the control in the thread header.
        enableThreadSubscription: true,
        // Pin & Save are gated by app-level flags the backend provisions. Until
        // those are switched on for this app, the SDK reports them disabled and
        // the options cannot render — so the sample app forces them on to stay
        // demoable. Remove these two lines once the flags are live.
        enablePinMessage: true,
        enableSaveMessage: true,
      },
    },
  ],
};
