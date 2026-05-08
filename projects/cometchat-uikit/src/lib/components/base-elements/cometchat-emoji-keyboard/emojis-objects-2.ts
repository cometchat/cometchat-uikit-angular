export const emojisObjectsPart2: Record<string, { keywords: string[]; char: string; fitzpatrick_scale?: boolean }> = {
      bomb: {
        keywords: ['boom', 'explode', 'explosion', 'terrorism'],
        char: '💣',
      },
      firecracker: {
        keywords: ['dynamite', 'boom', 'explode', 'explosion', 'explosive'],
        char: '🧨',
      },
      hocho: {
        keywords: ['knife', 'blade', 'cutlery', 'kitchen', 'weapon'],
        char: '🔪',
      },
      dagger: {
        keywords: ['weapon'],
        char: '🗡',
      },
      crossed_swords: {
        keywords: ['weapon'],
        char: '⚔',
      },
      shield: {
        keywords: ['protection', 'security'],
        char: '🛡',
      },
      smoking: {
        keywords: ['kills', 'tobacco', 'cigarette', 'joint', 'smoke'],
        char: '🚬',
      },
      skull_and_crossbones: {
        keywords: ['poison', 'danger', 'deadly', 'scary', 'death', 'pirate', 'evil'],
        char: '☠',
      },
      coffin: {
        keywords: [
          'vampire',
          'dead',
          'die',
          'death',
          'rip',
          'graveyard',
          'cemetery',
          'casket',
          'funeral',
          'box',
        ],
        char: '⚰',
      },
      funeral_urn: {
        keywords: ['dead', 'die', 'death', 'rip', 'ashes'],
        char: '⚱',
      },
      amphora: {
        keywords: ['vase', 'jar'],
        char: '🏺',
      },
      crystal_ball: {
        keywords: ['disco', 'party', 'magic', 'circus', 'fortune_teller'],
        char: '🔮',
      },
      prayer_beads: {
        keywords: ['dhikr', 'religious'],
        char: '📿',
      },
      nazar_amulet: {
        keywords: ['bead', 'charm'],
        char: '🧿',
      },
      barber: {
        keywords: ['hair', 'salon', 'style'],
        char: '💈',
      },
      alembic: {
        keywords: ['distilling', 'science', 'experiment', 'chemistry'],
        char: '⚗',
      },
      telescope: {
        keywords: ['stars', 'space', 'zoom', 'science', 'astronomy'],
        char: '🔭',
      },
      microscope: {
        keywords: ['laboratory', 'experiment', 'zoomin', 'science', 'study'],
        char: '🔬',
      },
      hole: {
        keywords: ['embarrassing'],
        char: '🕳',
      },
      pill: {
        keywords: ['health', 'medicine', 'doctor', 'pharmacy', 'drug'],
        char: '💊',
      },
      syringe: {
        keywords: [
          'health',
          'hospital',
          'drugs',
          'blood',
          'medicine',
          'needle',
          'doctor',
          'nurse',
        ],
        char: '💉',
      },
      dna: {
        keywords: ['biologist', 'genetics', 'life'],
        char: '🧬',
      },
      microbe: {
        keywords: ['amoeba', 'bacteria', 'germs'],
        char: '🦠',
      },
      petri_dish: {
        keywords: ['bacteria', 'biology', 'culture', 'lab'],
        char: '🧫',
      },
      test_tube: {
        keywords: ['chemistry', 'experiment', 'lab', 'science'],
        char: '🧪',
      },
      thermometer: {
        keywords: ['weather', 'temperature', 'hot', 'cold'],
        char: '🌡',
      },
      broom: {
        keywords: ['cleaning', 'sweeping', 'witch'],
        char: '🧹',
      },
      basket: {
        keywords: ['laundry'],
        char: '🧺',
      },
      toilet_paper: {
        keywords: ['roll'],
        char: '🧻',
      },
      label: {
        keywords: ['sale', 'tag'],
        char: '🏷',
      },
      bookmark: {
        keywords: ['favorite', 'label', 'save'],
        char: '🔖',
      },
      toilet: {
        keywords: ['restroom', 'wc', 'washroom', 'bathroom', 'potty'],
        char: '🚽',
      },
      shower: {
        keywords: ['clean', 'water', 'bathroom'],
        char: '🚿',
      },
      bathtub: {
        keywords: ['clean', 'shower', 'bathroom'],
        char: '🛁',
      },
      soap: {
        keywords: ['bar', 'bathing', 'cleaning', 'lather'],
        char: '🧼',
      },
      sponge: {
        keywords: ['absorbing', 'cleaning', 'porous'],
        char: '🧽',
      },
      lotion_bottle: {
        keywords: ['moisturizer', 'sunscreen'],
        char: '🧴',
      },
      key: {
        keywords: ['lock', 'door', 'password'],
        char: '🔑',
      },
      old_key: {
        keywords: ['lock', 'door', 'password'],
        char: '🗝',
      },
      couch_and_lamp: {
        keywords: ['read', 'chill'],
        char: '🛋',
      },
      sleeping_bed: {
        keywords: ['bed', 'rest'],
        char: '🛌',
        fitzpatrick_scale: true,
      },
      bed: {
        keywords: ['sleep', 'rest'],
        char: '🛏',
      },
      door: {
        keywords: ['house', 'entry', 'exit'],
        char: '🚪',
      },
      bellhop_bell: {
        keywords: ['service'],
        char: '🛎',
      },
      teddy_bear: {
        keywords: ['plush', 'stuffed'],
        char: '🧸',
      },
      framed_picture: {
        keywords: ['photography'],
        char: '🖼',
      },
      world_map: {
        keywords: ['location', 'direction'],
        char: '🗺',
      },
      parasol_on_ground: {
        keywords: ['weather', 'summer'],
        char: '⛱',
      },
      moyai: {
        keywords: ['rock', 'easter island', 'moai'],
        char: '🗿',
      },
      shopping: {
        keywords: ['mall', 'buy', 'purchase'],
        char: '🛍',
      },
      shopping_cart: {
        keywords: ['trolley'],
        char: '🛒',
      },
      balloon: {
        keywords: ['party', 'celebration', 'birthday', 'circus'],
        char: '🎈',
      },
      flags: {
        keywords: ['fish', 'japanese', 'koinobori', 'carp', 'banner'],
        char: '🎏',
      },
      ribbon: {
        keywords: ['decoration', 'pink', 'girl', 'bowtie'],
        char: '🎀',
      },
      gift: {
        keywords: ['present', 'birthday', 'christmas', 'xmas'],
        char: '🎁',
      },
      confetti_ball: {
        keywords: ['festival', 'party', 'birthday', 'circus'],
        char: '🎊',
      },
      tada: {
        keywords: ['party', 'congratulations', 'birthday', 'magic', 'circus', 'celebration'],
        char: '🎉',
      },
      dolls: {
        keywords: ['japanese', 'toy', 'kimono'],
        char: '🎎',
      },
      wind_chime: {
        keywords: ['nature', 'ding', 'spring', 'bell'],
        char: '🎐',
      },
      crossed_flags: {
        keywords: ['japanese', 'nation', 'country', 'border'],
        char: '🎌',
      },
      izakaya_lantern: {
        keywords: ['light', 'paper', 'halloween', 'spooky'],
        char: '🏮',
      },
      red_envelope: {
        keywords: ['gift'],
        char: '🧧',
      },
      email: {
        keywords: ['letter', 'postal', 'inbox', 'communication'],
        char: '✉️',
      },
      envelope_with_arrow: {
        keywords: ['email', 'communication'],
        char: '📩',
      },
      incoming_envelope: {
        keywords: ['email', 'inbox'],
        char: '📨',
      },
      'e-mail': {
        keywords: ['communication', 'inbox'],
        char: '📧',
      },
      love_letter: {
        keywords: ['email', 'like', 'affection', 'envelope', 'valentines'],
        char: '💌',
      },
      postbox: {
        keywords: ['email', 'letter', 'envelope'],
        char: '📮',
      }
};
