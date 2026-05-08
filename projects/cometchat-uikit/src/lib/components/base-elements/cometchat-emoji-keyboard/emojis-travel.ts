import { emojisTravelPart1 } from './emojis-travel-1';
import { emojisTravelPart2 } from './emojis-travel-2';

const travelIcon = 'assets/travel_places.svg';

export const emojisTravel = {
  travel_and_places: {
    id: 'travel_and_places',
    name: 'emoji_travel_places',
    symbol: travelIcon,
    emojis: {
      ...emojisTravelPart1,
      ...emojisTravelPart2,
    }
  }
};
