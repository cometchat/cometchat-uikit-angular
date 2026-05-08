import { emojisAnimalsPart1 } from './emojis-animals-1';
import { emojisAnimalsPart2 } from './emojis-animals-2';

const animalsIcon = 'assets/animals_nature.svg';

export const emojisAnimals = {
  animals_and_nature: {
    id: 'animals_and_nature',
    name: 'emoji_animals_nature',
    symbol: animalsIcon,
    emojis: {
      ...emojisAnimalsPart1,
      ...emojisAnimalsPart2,
    }
  }
};
