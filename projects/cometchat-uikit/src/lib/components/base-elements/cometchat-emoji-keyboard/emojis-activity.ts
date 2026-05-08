import { emojisActivityPart1 } from './emojis-activity-1';
import { emojisActivityPart2 } from './emojis-activity-2';

const activityIcon = 'assets/activity.svg';

export const emojisActivity = {
  activity: {
    id: 'activity',
    name: 'emoji_activity',
    symbol: activityIcon,
    emojis: {
      ...emojisActivityPart1,
      ...emojisActivityPart2,
    }
  }
};
