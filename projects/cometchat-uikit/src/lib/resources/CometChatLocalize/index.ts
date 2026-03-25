// Main localization class
export { CometChatLocalize, getLocalizedString } from './cometchat-localize';

// Interfaces (type-only exports for isolatedModules compatibility)
export type {
  LocalizationSettings,
  CalendarObject,
  RelativeTimeConfig,
} from './localization.interfaces';

// Angular pipes
export { TranslatePipe } from './translate.pipe';
export { CalendarDatePipe, ConversationDatePipe, MessageDatePipe } from './calendar-date.pipe';
