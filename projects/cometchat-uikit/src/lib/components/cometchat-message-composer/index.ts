/**
 * Public API for CometChatMessageComposer component
 *
 * This module exports the CometChatMessageComposer component and all related
 * types, interfaces, services, and enums needed to use the message composer.
 *
 * @module components/cometchat-message-composer
 * @see Requirements 33.2
 */

// Component
export { CometChatMessageComposerComponent } from './cometchat-message-composer.component';

// Constants
export { MENTIONS_LIMIT } from './cometchat-message-composer.component';

// Interfaces
export type { AttachmentFile } from './cometchat-message-composer.component';

// Service (re-export from services for convenience)
export { MessageComposerService } from '../../services/message-composer.service';
export type { ErrorCallback } from '../../services/message-composer.service';

// Rich Text Editor Service (re-export for rich text editing)
export { RichTextEditorService } from '../../services/rich-text-editor.service';
export type {
  RichTextFormatState,
  RichTextEditorConfig,
  RichTextMetadata,
} from '../../services/rich-text-editor.interfaces';

// Enums (re-export from Enums for convenience)
export { EnterKeyBehavior } from '../../Enums/Enums';

// Text Formatters (re-export from formatters for convenience)
export {
  CometChatTextFormatter,
  CometChatMentionsFormatter,
  CometChatUrlFormatter,
} from '../../formatters';
export type { MentionData } from '../../formatters';
