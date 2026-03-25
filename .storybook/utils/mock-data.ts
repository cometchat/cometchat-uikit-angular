import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Mock data factories for Storybook stories.
 * 
 * These factory functions create realistic mock data that matches CometChat SDK interfaces,
 * allowing components to be rendered in Storybook with test data.
 * 
 * All factory functions accept optional overrides to customize the generated data.
 */

/**
 * Real avatar photo assets served from .storybook/avatars/ via Storybook staticDirs.
 * Use these for specific named users to add visual variety.
 * All other users fall back to the CometChatAvatar initials display.
 */
export const MOCK_AVATARS = {
  andrewJoseph: '/avatars/andrew-joseph.png',
  georgeAlan: '/avatars/george-alan.png',
  nancyGrace: '/avatars/nancy-grace.png',
} as const;

/**
 * Creates a mock CometChat user.
 * 
 * @param overrides - Optional properties to override default values
 * @returns A mock CometChat.User instance
 * 
 * @example
 * const user = createMockUser({ name: 'John Doe', status: CometChat.USER_STATUS.ONLINE });
 */
export function createMockUser(overrides?: Partial<{
  uid: string;
  name: string;
  avatar: string;
  status: string;
  role: string;
  metadata: any;
  statusMessage: string;
  lastActiveAt: number;
}>): CometChat.User {
  const uid = overrides?.uid || `user-${Math.random().toString(36).substr(2, 9)}`;
  const user = new CometChat.User(uid);
  
  user.setName(overrides?.name || `User ${uid.slice(-4)}`);
  if (overrides?.avatar) {
    user.setAvatar(overrides.avatar);
  }
  user.setStatus(overrides?.status || CometChat.USER_STATUS.ONLINE);
  
  if (overrides?.role) {
    user.setRole(overrides.role);
  }
  
  if (overrides?.metadata) {
    user.setMetadata(overrides.metadata);
  }
  
  if (overrides?.statusMessage) {
    user.setStatusMessage(overrides.statusMessage);
  }
  
  if (overrides?.lastActiveAt) {
    user.setLastActiveAt(overrides.lastActiveAt);
  }
  
  return user;
}

/**
 * Creates a mock CometChat group.
 * 
 * @param overrides - Optional properties to override default values
 * @returns A mock CometChat.Group instance
 * 
 * @example
 * const group = createMockGroup({ 
 *   name: 'Design Team', 
 *   type: CometChat.GROUP_TYPE.PRIVATE,
 *   membersCount: 10 
 * });
 */
export function createMockGroup(overrides?: Partial<{
  guid: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  owner: string;
  metadata: any;
  membersCount: number;
  hasJoined: boolean;
}>): CometChat.Group {
  const guid = overrides?.guid || `group-${Math.random().toString(36).substr(2, 9)}`;
  const name = overrides?.name || `Group ${guid.slice(-4)}`;
  const type = overrides?.type || CometChat.GROUP_TYPE.PUBLIC;
  
  const group = new CometChat.Group(guid, name, type);
  
  group.setIcon(overrides?.icon || '');
  group.setMembersCount(overrides?.membersCount ?? 5);
  
  if (overrides?.description) {
    group.setDescription(overrides.description);
  }
  
  if (overrides?.owner) {
    group.setOwner(overrides.owner);
  }
  
  if (overrides?.metadata) {
    group.setMetadata(overrides.metadata);
  }
  
  if (overrides?.hasJoined !== undefined) {
    group.setHasJoined(overrides.hasJoined);
  }
  
  return group as unknown as CometChat.Group;
}

/**
 * Creates a mock CometChat group member.
 *
 * @param overrides - Optional properties to override default values
 * @returns A mock CometChat.GroupMember instance
 *
 * @example
 * const member = createMockGroupMember({ name: 'Alice', scope: CometChat.GROUP_MEMBER_SCOPE.ADMIN });
 */
export function createMockGroupMember(overrides?: Partial<{
  uid: string;
  name: string;
  avatar: string;
  status: string;
  scope: CometChat.GroupMemberScope | string;
  guid: string;
  joinedAt: number;
}>): CometChat.GroupMember {
  const uid = overrides?.uid || `member-${Math.random().toString(36).substr(2, 9)}`;
  const scope = (overrides?.scope || CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) as CometChat.GroupMemberScope;

  const member = new CometChat.GroupMember(uid, scope);

  member.setName(overrides?.name || `Member ${uid.slice(-4)}`);
  member.setUid(uid);
  if (overrides?.avatar) {
    member.setAvatar(overrides.avatar);
  }
  member.setStatus(overrides?.status || CometChat.USER_STATUS.ONLINE);

  if (overrides?.guid) {
    member.setGuid(overrides.guid);
  }

  if (overrides?.joinedAt) {
    member.setJoinedAt(overrides.joinedAt);
  }

  return member;
}


/**
 * Creates a mock CometChat conversation.
 * 
 * @param type - Type of conversation ('user' or 'group')
 * @param overrides - Optional properties to override default values
 * @returns A mock CometChat.Conversation instance
 * 
 * @example
 * const conversation = createMockConversation('user', {
 *   unreadMessageCount: 5,
 *   lastMessage: createMockMessage('text', { text: 'Hello!' })
 * });
 */
export function createMockConversation(
  type: 'user' | 'group' = 'user',
  overrides?: Partial<{
    conversationWith: CometChat.User | CometChat.Group;
    lastMessage: CometChat.BaseMessage;
    unreadMessageCount: number;
    tags: string[];
  }>
): CometChat.Conversation {
  const conversationWith = overrides?.conversationWith || 
    (type === 'user' ? createMockUser() : createMockGroup());
  
  // Helper to get ID from User or Group
  const getId = (entity: CometChat.User | CometChat.Group): string => {
    return (entity as any).getUid ? (entity as any).getUid() : (entity as any).getGuid();
  };
  
  const entityId = getId(conversationWith);
  
  const lastMessage = overrides?.lastMessage || createMockMessage('text', {
    receiverId: entityId,
    receiverType: type === 'user' ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP,
    text: 'Hello how are you?',
  });
  
  const conversation = new CometChat.Conversation(
    entityId,
    type === 'user' ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP,
    lastMessage,
    conversationWith as any,
    overrides?.unreadMessageCount ?? 0,
    overrides?.tags || [],
    0, // unreadMentionsCount
    '', // lastReadMessageId
    '' // latestMessageId
  );
  
  // Note: setTags may not be available in all SDK versions
  // if (overrides?.tags) {
  //   conversation.setTags(overrides.tags);
  // }
  
  return conversation as unknown as CometChat.Conversation;
}

/**
 * Creates a mock CometChat message.
 * 
 * @param type - Type of message ('text', 'image', 'file', 'audio', 'video', 'custom')
 * @param overrides - Optional properties to override default values
 * @returns A mock CometChat.BaseMessage instance
 * 
 * @example
 * const textMessage = createMockMessage('text', { text: 'Hello, World!' });
 * const imageMessage = createMockMessage('image', { url: 'https://example.com/image.jpg' });
 */
export function createMockMessage(
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'custom' = 'text',
  overrides?: Partial<{
    id: number;
    muid: string;
    receiverId: string;
    receiverType: string;
    sender: CometChat.User;
    text: string;
    url: string;
    thumbnail: string;
    fileName: string;
    fileExtension: string;
    fileSize: number;
    fileMimeType: string;
    sentAt: number;
    deliveredAt: number;
    readAt: number;
    metadata: any;
    replyCount: number;
    parentMessageId: number;
    customData: any;
    customType: string;
  }>
): CometChat.BaseMessage {
  const receiverId = overrides?.receiverId || 'receiver-123';
  const receiverType = overrides?.receiverType || CometChat.RECEIVER_TYPE.USER;
  
  let message: CometChat.BaseMessage;
  
  switch (type) {
    case 'text':
      message = new CometChat.TextMessage(
        receiverId,
        overrides?.text || 'This is a mock text message',
        receiverType
      ) as unknown as CometChat.BaseMessage;
      break;
      
    case 'image':
      const imageUrl = overrides?.url || 'https://placehold.co/400x300/6852D6/FFFFFF/png?text=Image';
      const imageMessage = new CometChat.MediaMessage(
        receiverId,
        imageUrl,
        CometChat.MESSAGE_TYPE.IMAGE,
        receiverType
      );
      imageMessage.setAttachments([new CometChat.Attachment({
        extension: overrides?.fileExtension || 'jpg',
        mimeType: overrides?.fileMimeType || 'image/jpeg',
        name: overrides?.fileName || 'mock-image.jpg',
        size: overrides?.fileSize || 102400,
        url: imageUrl,
      })]);
      message = imageMessage as unknown as CometChat.BaseMessage;
      break;
      
    case 'file':
      const fileUrl = overrides?.url || 'https://example.com/mock-file.pdf';
      const fileMessage = new CometChat.MediaMessage(
        receiverId,
        fileUrl,
        CometChat.MESSAGE_TYPE.FILE,
        receiverType
      );
      fileMessage.setAttachments([new CometChat.Attachment({
        extension: overrides?.fileExtension || 'pdf',
        mimeType: overrides?.fileMimeType || 'application/pdf',
        name: overrides?.fileName || 'mock-document.pdf',
        size: overrides?.fileSize || 204800,
        url: fileUrl,
      })]);
      message = fileMessage as unknown as CometChat.BaseMessage;
      break;
      
    case 'audio':
      const audioUrl = overrides?.url || '/audio/sample-audio.mp3';
      const audioMessage = new CometChat.MediaMessage(
        receiverId,
        audioUrl,
        CometChat.MESSAGE_TYPE.AUDIO,
        receiverType
      );
      audioMessage.setAttachments([new CometChat.Attachment({
        extension: overrides?.fileExtension || 'mp3',
        mimeType: overrides?.fileMimeType || 'audio/mpeg',
        name: overrides?.fileName || 'sample-audio.mp3',
        size: overrides?.fileSize || 512000,
        url: audioUrl,
      })]);
      message = audioMessage as unknown as CometChat.BaseMessage;
      break;
      
    case 'video':
      const videoUrl = overrides?.url || '/assets/sample-video.mp4';
      const videoThumbnail = overrides?.thumbnail || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg';
      const videoMessage = new CometChat.MediaMessage(
        receiverId,
        videoUrl,
        CometChat.MESSAGE_TYPE.VIDEO,
        receiverType
      );
      const videoAttachment = new CometChat.Attachment({
        extension: overrides?.fileExtension || 'mp4',
        mimeType: overrides?.fileMimeType || 'video/mp4',
        name: overrides?.fileName || 'mock-video.mp4',
        size: overrides?.fileSize || 2048000,
        url: videoUrl,
      });
      // Assign thumbnail directly — CometChat.Attachment constructor ignores unknown keys
      (videoAttachment as any).thumbnail = videoThumbnail;
      videoMessage.setAttachments([videoAttachment]);
      // Also store in metadata so extractMediaAttachments can find it as a fallback
      videoMessage.setMetadata({ thumbnail: videoThumbnail });
      message = videoMessage as unknown as CometChat.BaseMessage;
      break;
      
    case 'custom':
      message = new CometChat.CustomMessage(
        receiverId,
        receiverType,
        overrides?.customType || 'custom_type',
        overrides?.customData || { key: 'value' }
      ) as unknown as CometChat.BaseMessage;
      break;
      
    default:
      message = new CometChat.TextMessage(receiverId, 'Mock message', receiverType) as unknown as CometChat.BaseMessage;
  }
  
  // Set common properties
  if (overrides?.id) {
    message.setId(overrides.id);
  }
  
  message.setMuid(overrides?.muid || `muid-${Math.random().toString(36).substr(2, 9)}`);
  message.setSentAt(overrides?.sentAt || Date.now() / 1000);
  
  if (overrides?.deliveredAt) {
    message.setDeliveredAt(overrides.deliveredAt);
  }
  
  if (overrides?.readAt) {
    message.setReadAt(overrides.readAt);
  }
  
  const sender = overrides?.sender || createMockUser({ name: 'George Alan' });
  message.setSender(sender);
  
  // Note: setMetadata may not be available on BaseMessage
  // if (overrides?.metadata) {
  //   message.setMetadata(overrides.metadata);
  // }
  
  if (overrides?.replyCount) {
    message.setReplyCount(overrides.replyCount);
  }
  
  if (overrides?.parentMessageId) {
    message.setParentMessageId(overrides.parentMessageId);
  }
  
  return message;
}

/**
 * Creates an array of mock users.
 * 
 * @param count - Number of users to create
 * @param overridesFn - Optional function to customize each user
 * @returns Array of mock CometChat.User instances
 * 
 * @example
 * const users = createMockUsers(10);
 * const customUsers = createMockUsers(5, (i) => ({ name: `User ${i}` }));
 */
export function createMockUsers(
  count: number,
  overridesFn?: (index: number) => Partial<Parameters<typeof createMockUser>[0]>
): CometChat.User[] {
  return Array.from({ length: count }, (_, i) => {
    const overrides = overridesFn ? overridesFn(i) : {};
    return createMockUser({
      uid: `user-${i}`,
      name: `User ${i + 1}`,
      status: i % 2 === 0 
        ? CometChat.USER_STATUS.ONLINE 
        : CometChat.USER_STATUS.OFFLINE,
      ...overrides,
    });
  });
}

/**
 * Creates an array of mock groups.
 * 
 * @param count - Number of groups to create
 * @param overridesFn - Optional function to customize each group
 * @returns Array of mock CometChat.Group instances
 * 
 * @example
 * const groups = createMockGroups(10);
 * const customGroups = createMockGroups(5, (i) => ({ name: `Team ${i}` }));
 */
export function createMockGroups(
  count: number,
  overridesFn?: (index: number) => Partial<Parameters<typeof createMockGroup>[0]>
): CometChat.Group[] {
  return Array.from({ length: count }, (_, i) => {
    const overrides = overridesFn ? overridesFn(i) : {};
    return createMockGroup({
      guid: `group-${i}`,
      name: `Group ${i + 1}`,
      type: i % 3 === 0 
        ? CometChat.GROUP_TYPE.PUBLIC 
        : i % 3 === 1 
          ? CometChat.GROUP_TYPE.PRIVATE 
          : CometChat.GROUP_TYPE.PASSWORD,
      membersCount: 5 + i,
      ...overrides,
    });
  });
}

/**
 * Creates an array of mock group members.
 *
 * @param count - Number of group members to create
 * @param overridesFn - Optional function to customize each member
 * @returns Array of mock CometChat.GroupMember instances
 *
 * @example
 * const members = createMockGroupMembers(10);
 * const customMembers = createMockGroupMembers(5, (i) => ({ name: `Member ${i}`, scope: CometChat.GROUP_MEMBER_SCOPE.ADMIN }));
 */
export function createMockGroupMembers(
  count: number,
  overridesFn?: (index: number) => Partial<Parameters<typeof createMockGroupMember>[0]>
): CometChat.GroupMember[] {
  const scopes = [
    CometChat.GROUP_MEMBER_SCOPE.ADMIN as unknown as CometChat.GroupMemberScope,
    CometChat.GROUP_MEMBER_SCOPE.MODERATOR as unknown as CometChat.GroupMemberScope,
    CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT as unknown as CometChat.GroupMemberScope,
  ];

  return Array.from({ length: count }, (_, i) => {
    const overrides = overridesFn ? overridesFn(i) : {};
    return createMockGroupMember({
      uid: `member-${i}`,
      name: `Member ${i + 1}`,
      status: i % 2 === 0
        ? CometChat.USER_STATUS.ONLINE
        : CometChat.USER_STATUS.OFFLINE,
      scope: scopes[i % scopes.length],
      ...overrides,
    });
  });
}


/**
 * Creates an array of mock conversations.
 * 
 * @param count - Number of conversations to create
 * @param overridesFn - Optional function to customize each conversation
 * @returns Array of mock CometChat.Conversation instances
 * 
 * @example
 * const conversations = createMockConversations(10);
 * const customConversations = createMockConversations(5, (i) => ({ 
 *   type: i % 2 === 0 ? 'user' : 'group' 
 * }));
 */
export function createMockConversations(
  count: number,
  overridesFn?: (index: number) => { type?: 'user' | 'group' } & Partial<Parameters<typeof createMockConversation>[1]>
): CometChat.Conversation[] {
  return Array.from({ length: count }, (_, i) => {
    const overrides = overridesFn ? overridesFn(i) : {};
    const type = overrides.type || (i % 2 === 0 ? 'user' : 'group');
    
    return createMockConversation(type, {
      unreadMessageCount: i % 5,
      ...overrides,
    });
  });
}

/**
 * Creates an array of mock messages.
 * 
 * @param count - Number of messages to create
 * @param overridesFn - Optional function to customize each message
 * @returns Array of mock CometChat.BaseMessage instances
 * 
 * @example
 * const messages = createMockMessages(10);
 * const customMessages = createMockMessages(5, (i) => ({ 
 *   type: 'text',
 *   text: `Message ${i}` 
 * }));
 */
export function createMockMessages(
  count: number,
  overridesFn?: (index: number) => { type?: 'text' | 'image' | 'file' | 'audio' | 'video' | 'custom' } & Partial<Parameters<typeof createMockMessage>[1]>
): CometChat.BaseMessage[] {
  const types: Array<'text' | 'image' | 'file' | 'audio' | 'video'> = ['text', 'image', 'file', 'audio', 'video'];
  
  return Array.from({ length: count }, (_, i) => {
    const overrides = overridesFn ? overridesFn(i) : {};
    const type = overrides.type || types[i % types.length];
    
    return createMockMessage(type, {
      sentAt: (Date.now() / 1000) - (i * 60),
      ...overrides,
    });
  });
}

/**
 * Creates a mock CometChat Call object for call-related component stories.
 *
 * Since CometChat.Call objects created via `new CometChat.Call()` require SDK
 * initialization, this factory creates a plain object with the getter methods
 * that call-related components rely on (getSessionId, getType, getStatus, etc.).
 *
 * @param overrides - Optional properties to override default values
 * @returns A mock object conforming to the CometChat.Call interface
 *
 * @example
 * const audioCall = createMockCall({ type: CometChat.CALL_TYPE.AUDIO, status: 'initiated' });
 * const videoCall = createMockCall({ type: CometChat.CALL_TYPE.VIDEO, status: 'ended', duration: 120 });
 */
export function createMockCall(overrides?: Partial<{
  sessionId: string;
  type: string;
  status: string;
  duration: number;
  callInitiator: CometChat.User;
  callReceiver: CometChat.User | CometChat.Group;
  receiverType: string;
  sentAt: number;
}>): CometChat.Call {
  const sessionId = overrides?.sessionId || `session-${Math.random().toString(36).substr(2, 9)}`;
  const type = overrides?.type || CometChat.CALL_TYPE.AUDIO;
  const status = overrides?.status || 'initiated';
  const duration = overrides?.duration ?? 0;
  const initiator = overrides?.callInitiator || createMockUser({ name: 'Call Initiator' });
  const receiver = overrides?.callReceiver || createMockUser({ name: 'Call Receiver' });
  const receiverType = overrides?.receiverType || CometChat.RECEIVER_TYPE.USER;
  const sentAt = overrides?.sentAt || Date.now() / 1000;

  return {
    getSessionId: () => sessionId,
    getType: () => type,
    getStatus: () => status,
    getDuration: () => duration,
    getCallInitiator: () => initiator,
    getCallReceiver: () => receiver,
    getSender: () => initiator,
    getReceiver: () => receiver,
    getReceiverType: () => receiverType,
    getAction: () => status,
    getInitiatedAt: () => sentAt,
    getJoinedAt: () => sentAt + 5,
    getSentAt: () => sentAt,
    // BaseMessage stubs required by CometChatMessageBubble
    getId: () => Math.floor(Math.random() * 10000),
    getMuid: () => `muid-${Math.random().toString(36).substr(2, 9)}`,
    getCategory: () => 'call',
    getDeletedAt: () => 0,
    getEditedAt: () => 0,
    getReadAt: () => 0,
    getDeliveredAt: () => 0,
    getReplyCount: () => 0,
    getUnreadRepliesCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getParentMessageId: () => 0,
    setId: () => {},
    setMuid: () => {},
    setSender: () => {},
    setSentAt: () => {},
    setDeletedAt: () => {},
  } as unknown as CometChat.Call;
}

/**
 * Creates a mock CometChat ReactionCount object for reaction component stories.
 *
 * Uses the SDK's `CometChat.ReactionCount` constructor to create a real instance
 * with the specified emoji, count, and reactedByMe state.
 *
 * @param overrides - Optional properties to override default values
 * @returns A CometChat.ReactionCount instance
 *
 * @example
 * const thumbsUp = createMockReaction({ reaction: '👍', count: 5, reactedByMe: true });
 * const heart = createMockReaction({ reaction: '❤️', count: 3 });
 */
export function createMockReaction(overrides?: Partial<{
  reaction: string;
  count: number;
  reactedByMe: boolean;
}>): CometChat.ReactionCount {
  const reaction = overrides?.reaction || '👍';
  const count = overrides?.count ?? 1;
  const reactedByMe = overrides?.reactedByMe ?? false;

  return new CometChat.ReactionCount(reaction, count, reactedByMe);
}

/**
 * Creates an array of mock CometChat ReactionCount objects.
 *
 * @param count - Number of reactions to create
 * @param overridesFn - Optional function to customize each reaction
 * @returns Array of CometChat.ReactionCount instances
 *
 * @example
 * const reactions = createMockReactions(3);
 * const custom = createMockReactions(2, (i) => ({ reaction: ['👍', '❤️'][i], count: i + 1 }));
 */
export function createMockReactions(
  count: number,
  overridesFn?: (index: number) => Partial<Parameters<typeof createMockReaction>[0]>
): CometChat.ReactionCount[] {
  const defaultEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

  return Array.from({ length: count }, (_, i) => {
    const overrides = overridesFn ? overridesFn(i) : {};
    return createMockReaction({
      reaction: defaultEmojis[i % defaultEmojis.length],
      count: (i + 1) * 2,
      reactedByMe: i === 0,
      ...overrides,
    });
  });
}

/**
 * Creates a mock CometChat CustomMessage representing a sticker message.
 *
 * The sticker-bubble component extracts the sticker URL using a priority chain:
 * 1. `metadata.data.sticker_url`
 * 2. `metadata.sticker_url`
 * 3. `customData.sticker_url`
 *
 * This factory places the URL in `customData.sticker_url` (path 3) by default,
 * and optionally in metadata if provided.
 *
 * @param overrides - Optional properties to override default values
 * @returns A mock CometChat.CustomMessage with sticker data
 *
 * @example
 * const sticker = createMockStickerMessage({ stickerUrl: 'https://example.com/sticker.png' });
 * const namedSticker = createMockStickerMessage({ stickerName: 'Thumbs Up', stickerUrl: '...' });
 */
export function createMockStickerMessage(overrides?: Partial<{
  receiverId: string;
  receiverType: string;
  sender: CometChat.User;
  stickerUrl: string;
  stickerName: string;
  sentAt: number;
  id: number;
}>): CometChat.CustomMessage {
  const receiverId = overrides?.receiverId || 'receiver-123';
  const receiverType = overrides?.receiverType || CometChat.RECEIVER_TYPE.USER;
  const stickerUrl = overrides?.stickerUrl || 'https://data-in.cc-cluster-2.io/stickers/bear/bear_6.png';
  const stickerName = overrides?.stickerName || 'Mock Sticker';

  const customData = {
    sticker_url: stickerUrl,
    sticker_name: stickerName,
  };

  const message = new CometChat.CustomMessage(
    receiverId,
    receiverType,
    'extension_sticker',
    customData
  );

  message.setMuid(`muid-${Math.random().toString(36).substr(2, 9)}`);
  message.setSentAt(overrides?.sentAt || Date.now() / 1000);

  const sender = overrides?.sender || createMockUser({ name: 'Sticker Sender' });
  message.setSender(sender);

  if (overrides?.id) {
    message.setId(overrides.id);
  }

  return message;
}




/**
 * Creates a mock CometChat TypingIndicator object.
 *
 * Returns a plain object with the getter methods that typing-indicator
 * components rely on, without requiring SDK initialization.
 *
 * @param overrides - Optional properties to override default values
 * @returns A mock object conforming to the CometChat.TypingIndicator interface
 *
 * @example
 * const indicator = createMockTypingIndicator({ receiverId: 'group-1', receiverType: 'group' });
 */
export function createMockTypingIndicator(overrides?: Partial<{
  sender: CometChat.User;
  receiverId: string;
  receiverType: string;
}>): CometChat.TypingIndicator {
  const sender = overrides?.sender || createMockUser({ name: 'Typing User' });
  const receiverId = overrides?.receiverId || 'receiver-123';
  const receiverType = overrides?.receiverType || CometChat.RECEIVER_TYPE.USER;

  return {
    getSender: () => sender,
    getReceiverId: () => receiverId,
    getReceiverType: () => receiverType,
  } as unknown as CometChat.TypingIndicator;
}

/**
 * Creates a mock CometChat Action message object.
 *
 * Returns a plain object with the getter methods that action-bubble
 * components rely on, without requiring SDK initialization.
 *
 * @param overrides - Optional properties to override default values
 * @returns A mock object conforming to the CometChat.Action interface
 *
 * @example
 * const action = createMockActionMessage({ message: 'Alice added Bob' });
 */
export function createMockActionMessage(overrides?: Partial<{
  id: number;
  action: string;
  message: string;
  sender: CometChat.User;
  receiverId: string;
  receiverType: string;
  sentAt: number;
  actionBy: CometChat.User;
  actionOn: CometChat.User;
}>): CometChat.Action {
  const sender = overrides?.sender || createMockUser({ name: 'Action User' });
  const actionBy = overrides?.actionBy || sender;
  const actionOn = overrides?.actionOn || createMockUser({ name: 'Target User' });
  const receiverId = overrides?.receiverId || 'receiver-123';
  const receiverType = overrides?.receiverType || CometChat.RECEIVER_TYPE.USER;
  const sentAt = overrides?.sentAt || Date.now() / 1000;
  const action = overrides?.action || CometChat.ACTION_TYPE.MEMBER_JOINED;
  const message = overrides?.message || `${actionBy.getName()} ${action}`;

  // Ensure actionBy/actionOn have 'name' as own property for hasOwnProperty checks
  const actionByObj = Object.assign({}, actionBy, { name: actionBy.getName() });
  const actionOnObj = Object.assign({}, actionOn, { name: actionOn.getName() });

  return {
    // Direct properties needed by MessageUtilsService.getActionMessage()
    actionBy: actionByObj,
    actionOn: actionOnObj,
    action: action,
    getId: () => overrides?.id || Math.floor(Math.random() * 10000),
    getAction: () => action,
    getMessage: () => message,
    getSender: () => sender,
    getReceiverId: () => receiverId,
    getReceiverType: () => receiverType,
    getSentAt: () => sentAt,
    getActionBy: () => actionBy,
    getActionOn: () => actionOn,
    getType: () => 'action',
    getMuid: () => `muid-${Math.random().toString(36).substr(2, 9)}`,
    // BaseMessage stubs required by CometChatMessageBubble
    getCategory: () => 'action',
    getDeletedAt: () => 0,
    getEditedAt: () => 0,
    getReadAt: () => 0,
    getDeliveredAt: () => 0,
    getReplyCount: () => 0,
    getUnreadRepliesCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getParentMessageId: () => 0,
    setId: () => {},
    setMuid: () => {},
    setSender: () => {},
    setSentAt: () => {},
    setDeletedAt: () => {},
  } as unknown as CometChat.Action;
}

/**
 * Creates a mock CometChat CustomMessage representing a poll message.
 *
 * The poll-bubble component extracts poll data from:
 * `metadata["@injected"]["extensions"]["polls"]`
 *
 * @param overrides - Optional properties to override default values
 * @returns A mock CometChat.CustomMessage with poll metadata
 *
 * @example
 * const poll = createMockPollMessage({ question: 'Favorite color?' });
 */
export function createMockPollMessage(overrides?: Partial<{
  receiverId: string;
  receiverType: string;
  sender: CometChat.User;
  sentAt: number;
  id: number;
  question: string;
  options: Record<string, string>;
  results: Record<string, any>;
}>): CometChat.CustomMessage {
  const receiverId = overrides?.receiverId || 'receiver-123';
  const receiverType = overrides?.receiverType || CometChat.RECEIVER_TYPE.USER;
  const question = overrides?.question || 'What is your favorite programming language?';
  const options = overrides?.options || {
    '1': 'TypeScript',
    '2': 'JavaScript',
    '3': 'Python',
    '4': 'Rust',
  };
  const results = overrides?.results || {
    total: 7,
    options: {
      '1': { count: 3, voters: { 'user-1': { name: 'Alice' }, 'user-2': { name: 'Bob' }, 'user-3': { name: 'Charlie' } } },
      '2': { count: 2, voters: { 'user-4': { name: 'Diana' }, 'user-5': { name: 'Eve' } } },
      '3': { count: 1, voters: { 'user-6': { name: 'Frank' } } },
      '4': { count: 1, voters: { 'user-7': { name: 'Grace' } } },
    },
  };

  const message = new CometChat.CustomMessage(
    receiverId,
    receiverType,
    'extension_poll',
    { question, options }
  );

  message.setMuid(`muid-${Math.random().toString(36).substr(2, 9)}`);
  message.setSentAt(overrides?.sentAt || Date.now() / 1000);

  const sender = overrides?.sender || createMockUser({ name: 'Poll Creator' });
  message.setSender(sender);

  if (overrides?.id) {
    message.setId(overrides.id);
  }

  // Set metadata with the @injected.extensions.polls structure
  message.setMetadata({
    '@injected': {
      extensions: {
        polls: {
          id: `poll-${Math.random().toString(36).substr(2, 9)}`,
          question,
          options,
          results,
        },
      },
    },
  });

  return message;
}

/**
 * Creates a mock CometChat CustomMessage representing a collaborative document message.
 *
 * The document-bubble component extracts the URL from:
 * `metadata["@injected"]["extensions"]["document"]["document_url"]`
 *
 * @param overrides - Optional properties to override default values
 * @returns A mock CometChat.CustomMessage with document metadata
 */
export function createMockDocumentMessage(overrides?: Partial<{
  receiverId: string;
  receiverType: string;
  sender: CometChat.User;
  sentAt: number;
  id: number;
  documentUrl: string;
}>): CometChat.CustomMessage {
  const receiverId = overrides?.receiverId || 'receiver-123';
  const receiverType = overrides?.receiverType || CometChat.RECEIVER_TYPE.USER;
  const documentUrl = overrides?.documentUrl || 'https://example.com/collaborative-document';

  const message = new CometChat.CustomMessage(
    receiverId,
    receiverType,
    'extension_document',
    { document_url: documentUrl }
  );

  message.setMuid(`muid-${Math.random().toString(36).substr(2, 9)}`);
  message.setSentAt(overrides?.sentAt || Date.now() / 1000);

  const sender = overrides?.sender || createMockUser({ name: 'Document Sender' });
  message.setSender(sender);

  if (overrides?.id) {
    message.setId(overrides.id);
  }

  message.setMetadata({
    '@injected': {
      extensions: {
        document: {
          document_url: documentUrl,
        },
      },
    },
  });

  return message;
}

/**
 * Creates a mock CometChat CustomMessage representing a collaborative whiteboard message.
 *
 * The whiteboard-bubble component extracts the URL from:
 * `metadata["@injected"]["extensions"]["whiteboard"]["board_url"]`
 *
 * @param overrides - Optional properties to override default values
 * @returns A mock CometChat.CustomMessage with whiteboard metadata
 */
export function createMockWhiteboardMessage(overrides?: Partial<{
  receiverId: string;
  receiverType: string;
  sender: CometChat.User;
  sentAt: number;
  id: number;
  boardUrl: string;
}>): CometChat.CustomMessage {
  const receiverId = overrides?.receiverId || 'receiver-123';
  const receiverType = overrides?.receiverType || CometChat.RECEIVER_TYPE.USER;
  const boardUrl = overrides?.boardUrl || 'https://example.com/collaborative-whiteboard';

  const message = new CometChat.CustomMessage(
    receiverId,
    receiverType,
    'extension_whiteboard',
    { board_url: boardUrl }
  );

  message.setMuid(`muid-${Math.random().toString(36).substr(2, 9)}`);
  message.setSentAt(overrides?.sentAt || Date.now() / 1000);

  const sender = overrides?.sender || createMockUser({ name: 'Whiteboard Sender' });
  message.setSender(sender);

  if (overrides?.id) {
    message.setId(overrides.id);
  }

  message.setMetadata({
    '@injected': {
      extensions: {
        whiteboard: {
          board_url: boardUrl,
        },
      },
    },
  });

  return message;
}

/**
 * Creates a mock deleted message by setting deletedAt on a text message.
 *
 * @param overrides - Optional properties to override default values
 * @returns A mock CometChat.BaseMessage with deletedAt set
 */
export function createMockDeletedMessage(overrides?: Partial<{
  receiverId: string;
  receiverType: string;
  sender: CometChat.User;
  sentAt: number;
  id: number;
  text: string;
}>): CometChat.BaseMessage {
  const message = createMockMessage('text', {
    id: overrides?.id,
    text: overrides?.text || 'This message was deleted',
    sentAt: overrides?.sentAt || Date.now() / 1000,
    sender: overrides?.sender,
    receiverId: overrides?.receiverId,
    receiverType: overrides?.receiverType,
  });

  // Set deletedAt to mark as deleted
  message.setDeletedAt(Date.now() / 1000);

  return message;
}
