import { emojisObjectsPart1 } from './emojis-objects-1';
import { emojisObjectsPart2 } from './emojis-objects-2';
import { emojisObjectsPart3 } from './emojis-objects-3';

const objectsIcon = 'assets/objects.svg';

export const emojisObjects = {
  objects: {
    id: 'objects',
    name: 'emoji_objects',
    symbol: objectsIcon,
    emojis: {
      ...emojisObjectsPart1,
      ...emojisObjectsPart2,
      ...emojisObjectsPart3,
    }
  }
};
