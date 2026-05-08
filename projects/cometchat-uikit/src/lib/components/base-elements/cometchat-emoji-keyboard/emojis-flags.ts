import { emojisFlagsPart1 } from './emojis-flags-1';
import { emojisFlagsPart2 } from './emojis-flags-2';
import { emojisFlagsPart3 } from './emojis-flags-3';

const flagsIcon = 'assets/flags.svg';

export const emojisFlags = {
  flags: {
    id: 'flags',
    name: 'emoji_flags',
    symbol: flagsIcon,
    emojis: {
      ...emojisFlagsPart1,
      ...emojisFlagsPart2,
      ...emojisFlagsPart3,
    }
  }
};
