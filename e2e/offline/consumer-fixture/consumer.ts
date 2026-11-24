/**
 * UIT-OFF-07 consumer fixture: an integrator project on the previous Chat SDK
 * (4.2 typings, no offline API) using the new kit's public API, compiled with
 * `skipLibCheck: false` by scripts/offline/compat-check.sh. It must compile
 * unchanged; the offline additions are optional and structurally typed.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatMessageEvents,
  CometChatUIKit,
  UIKitSettingsBuilder,
  type CometChatOfflineConfig,
} from '@cometchat/chat-uikit-angular';

const offline: CometChatOfflineConfig = { enabled: true };

const settings = new UIKitSettingsBuilder()
  .setAppId('app')
  .setRegion('us')
  .setAuthKey('key')
  .setOfflineConfig(offline)
  .build();

export async function start(): Promise<void> {
  await CometChatUIKit.init(settings);
  const message = new CometChat.TextMessage('peer', 'hi', CometChat.RECEIVER_TYPE.USER);
  const sent: CometChat.BaseMessage = await CometChatUIKit.sendTextMessage(message);
  CometChatMessageEvents.ccMessageSendStateChanged.subscribe(event => void event);
  CometChatMessageEvents.ccOfflineCacheReset.subscribe(event => void event);
  void sent;
}
