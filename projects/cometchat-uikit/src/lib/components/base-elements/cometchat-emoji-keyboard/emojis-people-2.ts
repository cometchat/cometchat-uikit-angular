export const emojisPeoplePart2: Record<string, { keywords: string[]; char: string; fitzpatrick_scale?: boolean }> = {
      anguished: {
        keywords: ['face', 'stunned', 'nervous'],
        char: '😧',
      },
      cry: {
        keywords: ['face', 'tears', 'sad', 'depressed', 'upset', ":'("],
        char: '😢',
      },
      disappointed_relieved: {
        keywords: ['face', 'phew', 'sweat', 'nervous'],
        char: '😥',
      },
      drooling_face: {
        keywords: ['face'],
        char: '🤤',
      },
      sleepy: {
        keywords: ['face', 'tired', 'rest', 'nap'],
        char: '😪',
      },
      sweat: {
        keywords: ['face', 'hot', 'sad', 'tired', 'exercise'],
        char: '😓',
      },
      hot: {
        keywords: ['face', 'feverish', 'heat', 'red', 'sweating'],
        char: '🥵',
      },
      cold: {
        keywords: ['face', 'blue', 'freezing', 'frozen', 'frostbite', 'icicles'],
        char: '🥶',
      },
      sob: {
        keywords: ['face', 'cry', 'tears', 'sad', 'upset', 'depressed'],
        char: '😭',
      },
      dizzy_face: {
        keywords: ['spent', 'unconscious', 'xox', 'dizzy'],
        char: '😵',
      },
      astonished: {
        keywords: ['face', 'xox', 'surprised', 'poisoned'],
        char: '😲',
      },
      zipper_mouth_face: {
        keywords: ['face', 'sealed', 'zipper', 'secret'],
        char: '🤐',
      },
      nauseated_face: {
        keywords: ['face', 'vomit', 'gross', 'green', 'sick', 'throw up', 'ill'],
        char: '🤢',
      },
      sneezing_face: {
        keywords: ['face', 'gesundheit', 'sneeze', 'sick', 'allergy'],
        char: '🤧',
      },
      vomiting: {
        keywords: ['face', 'sick'],
        char: '🤮',
      },
      mask: {
        keywords: ['face', 'sick', 'ill', 'disease'],
        char: '😷',
      },
      face_with_thermometer: {
        keywords: ['sick', 'temperature', 'thermometer', 'cold', 'fever'],
        char: '🤒',
      },
      face_with_head_bandage: {
        keywords: ['injured', 'clumsy', 'bandage', 'hurt'],
        char: '🤕',
      },
      woozy: {
        keywords: ['face', 'dizzy', 'intoxicated', 'tipsy', 'wavy'],
        char: '🥴',
      },
      sleeping: {
        keywords: ['face', 'tired', 'sleepy', 'night', 'zzz'],
        char: '😴',
      },
      zzz: {
        keywords: ['sleepy', 'tired', 'dream'],
        char: '💤',
      },
      poop: {
        keywords: ['hankey', 'shitface', 'fail', 'turd', 'shit'],
        char: '💩',
      },
      smiling_imp: {
        keywords: ['devil', 'horns'],
        char: '😈',
      },
      imp: {
        keywords: ['devil', 'angry', 'horns'],
        char: '👿',
      },
      japanese_ogre: {
        keywords: [
          'monster',
          'red',
          'mask',
          'halloween',
          'scary',
          'creepy',
          'devil',
          'demon',
          'japanese',
          'ogre',
        ],
        char: '👹',
      },
      japanese_goblin: {
        keywords: ['red', 'evil', 'mask', 'monster', 'scary', 'creepy', 'japanese', 'goblin'],
        char: '👺',
      },
      skull: {
        keywords: ['dead', 'skeleton', 'creepy', 'death'],
        char: '💀',
      },
      ghost: {
        keywords: ['halloween', 'spooky', 'scary'],
        char: '👻',
      },
      alien: {
        keywords: ['UFO', 'paul', 'weird', 'outer_space'],
        char: '👽',
      },
      robot: {
        keywords: ['computer', 'machine', 'bot'],
        char: '🤖',
      },
      smiley_cat: {
        keywords: ['animal', 'cats', 'happy', 'smile'],
        char: '😺',
      },
      smile_cat: {
        keywords: ['animal', 'cats', 'smile'],
        char: '😸',
      },
      joy_cat: {
        keywords: ['animal', 'cats', 'haha', 'happy', 'tears'],
        char: '😹',
      },
      heart_eyes_cat: {
        keywords: ['animal', 'love', 'like', 'affection', 'cats', 'valentines', 'heart'],
        char: '😻',
      },
      smirk_cat: {
        keywords: ['animal', 'cats', 'smirk'],
        char: '😼',
      },
      kissing_cat: {
        keywords: ['animal', 'cats', 'kiss'],
        char: '😽',
      },
      scream_cat: {
        keywords: ['animal', 'cats', 'munch', 'scared', 'scream'],
        char: '🙀',
      },
      crying_cat_face: {
        keywords: ['animal', 'tears', 'weep', 'sad', 'cats', 'upset', 'cry'],
        char: '😿',
      },
      pouting_cat: {
        keywords: ['animal', 'cats'],
        char: '😾',
      },
      palms_up: {
        keywords: ['hands', 'gesture', 'cupped', 'prayer'],
        char: '🤲',
        fitzpatrick_scale: true,
      },
      raised_hands: {
        keywords: ['gesture', 'hooray', 'yea', 'celebration', 'hands'],
        char: '🙌',
        fitzpatrick_scale: true,
      },
      clap: {
        keywords: ['hands', 'praise', 'applause', 'congrats', 'yay'],
        char: '👏',
        fitzpatrick_scale: true,
      },
      wave: {
        keywords: ['hands', 'gesture', 'goodbye', 'solong', 'farewell', 'hello', 'hi', 'palm'],
        char: '👋',
        fitzpatrick_scale: true,
      },
      call_me_hand: {
        keywords: ['hands', 'gesture'],
        char: '🤙',
        fitzpatrick_scale: true,
      },
      '+1': {
        keywords: [
          'thumbsup',
          'yes',
          'awesome',
          'good',
          'agree',
          'accept',
          'cool',
          'hand',
          'like',
        ],
        char: '👍',
        fitzpatrick_scale: true,
      },
      '-1': {
        keywords: ['thumbsdown', 'no', 'dislike', 'hand'],
        char: '👎',
        fitzpatrick_scale: true,
      },
      facepunch: {
        keywords: ['angry', 'violence', 'fist', 'hit', 'attack', 'hand'],
        char: '👊',
        fitzpatrick_scale: true,
      },
      fist: {
        keywords: ['fingers', 'hand', 'grasp'],
        char: '✊',
        fitzpatrick_scale: true,
      },
      fist_left: {
        keywords: ['hand', 'fistbump'],
        char: '🤛',
        fitzpatrick_scale: true,
      },
      fist_right: {
        keywords: ['hand', 'fistbump'],
        char: '🤜',
        fitzpatrick_scale: true,
      },
      v: {
        keywords: ['fingers', 'ohyeah', 'hand', 'peace', 'victory', 'two'],
        char: '✌',
        fitzpatrick_scale: true,
      },
      ok_hand: {
        keywords: ['fingers', 'limbs', 'perfect', 'ok', 'okay'],
        char: '👌',
        fitzpatrick_scale: true,
      },
      raised_hand: {
        keywords: ['fingers', 'stop', 'highfive', 'palm', 'ban'],
        char: '✋',
        fitzpatrick_scale: true,
      },
      raised_back_of_hand: {
        keywords: ['fingers', 'raised', 'backhand'],
        char: '🤚',
        fitzpatrick_scale: true,
      },
      open_hands: {
        keywords: ['fingers', 'butterfly', 'hands', 'open'],
        char: '👐',
        fitzpatrick_scale: true,
      },
      muscle: {
        keywords: ['arm', 'flex', 'hand', 'summer', 'strong', 'biceps'],
        char: '💪',
        fitzpatrick_scale: true,
      },
      pray: {
        keywords: ['please', 'hope', 'wish', 'namaste', 'highfive'],
        char: '🙏',
        fitzpatrick_scale: true,
      },
      foot: {
        keywords: ['kick', 'stomp'],
        char: '🦶',
        fitzpatrick_scale: true,
      },
      leg: {
        keywords: ['kick', 'limb'],
        char: '🦵',
        fitzpatrick_scale: true,
      },
      handshake: {
        keywords: ['agreement', 'shake'],
        char: '🤝',
      },
      point_up: {
        keywords: ['hand', 'fingers', 'direction', 'up'],
        char: '☝',
        fitzpatrick_scale: true,
      },
      point_up_2: {
        keywords: ['fingers', 'hand', 'direction', 'up'],
        char: '👆',
        fitzpatrick_scale: true,
      },
      point_down: {
        keywords: ['fingers', 'hand', 'direction', 'down'],
        char: '👇',
        fitzpatrick_scale: true,
      },
      point_left: {
        keywords: ['direction', 'fingers', 'hand', 'left'],
        char: '👈',
        fitzpatrick_scale: true,
      },
      point_right: {
        keywords: ['fingers', 'hand', 'direction', 'right'],
        char: '👉',
        fitzpatrick_scale: true,
      },
      fu: {
        keywords: ['hand', 'fingers', 'rude', 'middle', 'flipping'],
        char: '🖕',
        fitzpatrick_scale: true,
      },
      raised_hand_with_fingers_splayed: {
        keywords: ['hand', 'fingers', 'palm'],
        char: '🖐',
        fitzpatrick_scale: true,
      },
      love_you: {
        keywords: ['hand', 'fingers', 'gesture'],
        char: '🤟',
        fitzpatrick_scale: true,
      },
      metal: {
        keywords: ['hand', 'fingers', 'evil_eye', 'sign_of_horns', 'rock_on'],
        char: '🤘',
        fitzpatrick_scale: true,
      },
      crossed_fingers: {
        keywords: ['good', 'lucky'],
        char: '🤞',
        fitzpatrick_scale: true,
      }
};
