import { emojisSymbolsPart1 } from './emojis-symbols-1';
import { emojisSymbolsPart2 } from './emojis-symbols-2';
import { emojisSymbolsPart3 } from './emojis-symbols-3';

const symbolsIcon = 'assets/symbols.svg';

export const emojisSymbols = {
  symbols: {
    id: 'symbols',
    name: 'emoji_symbols',
    symbol: symbolsIcon,
    emojis: {
      ...emojisSymbolsPart1,
      ...emojisSymbolsPart2,
      ...emojisSymbolsPart3,
    }
  }
};
