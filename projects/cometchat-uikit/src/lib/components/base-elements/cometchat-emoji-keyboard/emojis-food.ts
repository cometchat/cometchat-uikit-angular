import { emojisFoodPart1 } from './emojis-food-1';
import { emojisFoodPart2 } from './emojis-food-2';

const foodIcon = 'assets/food_drink.svg';

export const emojisFood = {
  food_and_drink: {
    id: 'food_and_drink',
    name: 'emoji_food_drinks',
    symbol: foodIcon,
    emojis: {
      ...emojisFoodPart1,
      ...emojisFoodPart2,
    }
  }
};
