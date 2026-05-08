import { emojisPeoplePart1 } from './emojis-people-1';
import { emojisPeoplePart2 } from './emojis-people-2';
import { emojisPeoplePart3 } from './emojis-people-3';
import { emojisPeoplePart4 } from './emojis-people-4';
import { emojisPeoplePart5 } from './emojis-people-5';

const smileyIcon = 'assets/smileys_people.svg';

export const emojisPeople = {
  people: {
    id: 'people',
    name: 'emoji_smiley_people',
    symbol: smileyIcon,
    emojis: {
      ...emojisPeoplePart1,
      ...emojisPeoplePart2,
      ...emojisPeoplePart3,
      ...emojisPeoplePart4,
      ...emojisPeoplePart5,
    }
  }
};
