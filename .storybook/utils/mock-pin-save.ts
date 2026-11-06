import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPinSaveEvents } from '../../projects/cometchat-uikit/src/lib/events/CometChatPinSaveEvents';

/**
 * Creates a mock PinSaveService for Storybook stories.
 *
 * The real service writes to the server before anything else, so in Storybook
 * every action would fail and revert. This one applies the same optimistic
 * change locally and publishes it on the shared bus, which is what the message
 * list subscribes to — so a bubble redraws exactly as it does in an app.
 *
 * Provide it to every story whose component injects PinSaveService (the
 * message list, conversations, and anything embedding them). The real service
 * resolves its feature flags through SDK REST calls, and with the SDK never
 * initialised those leave an unhandled rejection ("reading 'getAdminHost'")
 * that fails the story's test.
 */
export function createMockPinSaveService() {
  const now = (): number => Math.floor(Date.now() / 1000);

  return {
    isSupported: () => true,
    isPinEnabled: async () => true,
    isSaveEnabled: async () => true,
    isPinConversationEnabled: async () => false,
    isPinned: (message: CometChat.BaseMessage) => !!message?.getPinnedAt?.(),
    isSaved: (message: CometChat.BaseMessage) => !!message?.getSavedAt?.(),
    pinnedBy: (message: CometChat.BaseMessage) => message?.getPinnedBy?.() ?? null,
    isSystemPin: (message: CometChat.BaseMessage) => message?.getPinnedBy?.() === 'app_system',
    getConfiguredLimit: async () => null,
    run: async (action: 'pin' | 'unpin' | 'save' | 'unsave', message: CometChat.BaseMessage) => {
      switch (action) {
        case 'pin':
          message.setPinnedAt(now());
          message.setPinnedBy('user-john-doe');
          CometChatPinSaveEvents.publishMessagePinned({ message });
          break;
        case 'unpin':
          // Cleared rather than zeroed — the presence of the timestamp IS the
          // boolean, so a leftover 0 would read as pinned at the epoch.
          message.setPinnedAt(undefined);
          message.setPinnedBy(undefined);
          CometChatPinSaveEvents.publishMessageUnpinned({ message });
          break;
        case 'save':
          message.setSavedAt(now());
          CometChatPinSaveEvents.publishMessageSaved({ message });
          break;
        case 'unsave':
          message.setSavedAt(undefined);
          CometChatPinSaveEvents.publishMessageUnsaved({ message });
          break;
      }
      return message;
    },
  };
}
