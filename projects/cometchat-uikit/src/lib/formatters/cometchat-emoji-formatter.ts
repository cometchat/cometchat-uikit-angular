import { CometChatTextFormatter } from './cometchat-text-formatter';

/**
 * Emoji shortcode to Unicode emoji mapping.
 * Contains common emoji shortcodes used in chat applications.
 */
const EMOJI_MAP: Record<string, string> = {
  // Smileys & Emotion
  smile: '😊',
  grin: '😀',
  grinning: '😀',
  joy: '😂',
  laughing: '😆',
  sweat_smile: '😅',
  rofl: '🤣',
  wink: '😉',
  blush: '😊',
  innocent: '😇',
  heart_eyes: '😍',
  kissing_heart: '😘',
  kissing: '😗',
  relaxed: '☺️',
  stuck_out_tongue: '😛',
  stuck_out_tongue_winking_eye: '😜',
  stuck_out_tongue_closed_eyes: '😝',
  yum: '😋',
  sunglasses: '😎',
  smirk: '😏',
  unamused: '😒',
  disappointed: '😞',
  pensive: '😔',
  worried: '😟',
  confused: '😕',
  slight_frown: '🙁',
  frowning: '☹️',
  persevere: '😣',
  confounded: '😖',
  tired_face: '😫',
  weary: '😩',
  cry: '😢',
  sob: '😭',
  triumph: '😤',
  angry: '😠',
  rage: '😡',
  no_mouth: '😶',
  neutral_face: '😐',
  expressionless: '😑',
  hushed: '😯',
  flushed: '😳',
  astonished: '😲',
  sleeping: '😴',
  dizzy_face: '😵',
  zipper_mouth: '🤐',
  mask: '😷',
  thinking: '🤔',
  rolling_eyes: '🙄',
  grimacing: '😬',
  lying_face: '🤥',
  shushing_face: '🤫',
  face_with_hand_over_mouth: '🤭',
  nerd: '🤓',
  monocle_face: '🧐',
  partying_face: '🥳',
  pleading_face: '🥺',
  yawning_face: '🥱',
  hot_face: '🥵',
  cold_face: '🥶',
  woozy_face: '🥴',
  zany_face: '🤪',
  star_struck: '🤩',
  exploding_head: '🤯',
  cowboy: '🤠',
  clown: '🤡',
  nauseated_face: '🤢',
  sneezing_face: '🤧',
  vomiting_face: '🤮',
  skull: '💀',
  ghost: '👻',
  alien: '👽',
  robot: '🤖',
  poop: '💩',
  smiley_cat: '😺',
  heart_eyes_cat: '😻',
  crying_cat_face: '😿',
  scream_cat: '🙀',
  pouting_cat: '😾',
  see_no_evil: '🙈',
  hear_no_evil: '🙉',
  speak_no_evil: '🙊',

  // Gestures & Body Parts
  wave: '👋',
  raised_hand: '✋',
  hand: '✋',
  ok_hand: '👌',
  pinching_hand: '🤏',
  v: '✌️',
  crossed_fingers: '🤞',
  love_you_gesture: '🤟',
  metal: '🤘',
  call_me_hand: '🤙',
  point_left: '👈',
  point_right: '👉',
  point_up: '👆',
  point_down: '👇',
  middle_finger: '🖕',
  thumbsup: '👍',
  '+1': '👍',
  thumbsdown: '👎',
  '-1': '👎',
  fist: '✊',
  punch: '👊',
  left_facing_fist: '🤛',
  right_facing_fist: '🤜',
  clap: '👏',
  raised_hands: '🙌',
  open_hands: '👐',
  palms_up_together: '🤲',
  handshake: '🤝',
  pray: '🙏',
  writing_hand: '✍️',
  nail_care: '💅',
  selfie: '🤳',
  muscle: '💪',
  leg: '🦵',
  foot: '🦶',
  ear: '👂',
  nose: '👃',
  brain: '🧠',
  tooth: '🦷',
  bone: '🦴',
  eyes: '👀',
  eye: '👁️',
  tongue: '👅',
  lips: '👄',

  // Hearts & Love
  heart: '❤️',
  red_heart: '❤️',
  orange_heart: '🧡',
  yellow_heart: '💛',
  green_heart: '💚',
  blue_heart: '💙',
  purple_heart: '💜',
  black_heart: '🖤',
  white_heart: '🤍',
  brown_heart: '🤎',
  broken_heart: '💔',
  two_hearts: '💕',
  revolving_hearts: '💞',
  heartbeat: '💓',
  heartpulse: '💗',
  sparkling_heart: '💖',
  cupid: '💘',
  gift_heart: '💝',
  heart_decoration: '💟',
  heavy_heart_exclamation: '❣️',
  love_letter: '💌',
  kiss: '💋',
  kissing_couple: '💏',
  couple_with_heart: '💑',

  // Celebration & Objects
  fire: '🔥',
  star: '⭐',
  star2: '🌟',
  sparkles: '✨',
  boom: '💥',
  collision: '💥',
  sweat_drops: '💦',
  dash: '💨',
  hole: '🕳️',
  bomb: '💣',
  speech_balloon: '💬',
  thought_balloon: '💭',
  zzz: '💤',
  tada: '🎉',
  confetti_ball: '🎊',
  balloon: '🎈',
  birthday: '🎂',
  gift: '🎁',
  trophy: '🏆',
  medal: '🏅',
  first_place_medal: '🥇',
  second_place_medal: '🥈',
  third_place_medal: '🥉',
  crown: '👑',
  gem: '💎',
  ring: '💍',
  moneybag: '💰',
  dollar: '💵',
  money_with_wings: '💸',
  credit_card: '💳',
  chart: '💹',
  email: '📧',
  envelope: '✉️',
  package: '📦',
  label: '🏷️',
  bookmark: '🔖',
  clipboard: '📋',
  calendar: '📅',
  pushpin: '📌',
  paperclip: '📎',
  scissors: '✂️',
  lock: '🔒',
  unlock: '🔓',
  key: '🔑',
  hammer: '🔨',
  wrench: '🔧',
  gear: '⚙️',
  link: '🔗',
  bulb: '💡',
  flashlight: '🔦',
  mag: '🔍',
  mag_right: '🔎',
  microscope: '🔬',
  telescope: '🔭',
  satellite: '📡',
  syringe: '💉',
  pill: '💊',
  dna: '🧬',
  microbe: '🦠',
  petri_dish: '🧫',
  test_tube: '🧪',
  thermometer: '🌡️',
  broom: '🧹',
  basket: '🧺',
  toilet: '🚽',
  shower: '🚿',
  bathtub: '🛁',
  soap: '🧼',
  sponge: '🧽',
  bed: '🛏️',
  couch: '🛋️',
  chair: '🪑',
  door: '🚪',
  window: '🪟',

  // Food & Drink
  apple: '🍎',
  green_apple: '🍏',
  pear: '🍐',
  tangerine: '🍊',
  lemon: '🍋',
  banana: '🍌',
  watermelon: '🍉',
  grapes: '🍇',
  strawberry: '🍓',
  melon: '🍈',
  cherries: '🍒',
  peach: '🍑',
  mango: '🥭',
  pineapple: '🍍',
  coconut: '🥥',
  kiwi: '🥝',
  tomato: '🍅',
  eggplant: '🍆',
  avocado: '🥑',
  broccoli: '🥦',
  carrot: '🥕',
  corn: '🌽',
  hot_pepper: '🌶️',
  cucumber: '🥒',
  leafy_green: '🥬',
  mushroom: '🍄',
  peanuts: '🥜',
  chestnut: '🌰',
  bread: '🍞',
  croissant: '🥐',
  baguette: '🥖',
  pretzel: '🥨',
  bagel: '🥯',
  pancakes: '🥞',
  waffle: '🧇',
  cheese: '🧀',
  egg: '🥚',
  cooking: '🍳',
  bacon: '🥓',
  steak: '🥩',
  poultry_leg: '🍗',
  meat_on_bone: '🍖',
  hotdog: '🌭',
  hamburger: '🍔',
  fries: '🍟',
  pizza: '🍕',
  sandwich: '🥪',
  taco: '🌮',
  burrito: '🌯',
  falafel: '🧆',
  stuffed_flatbread: '🥙',
  spaghetti: '🍝',
  ramen: '🍜',
  soup: '🍲',
  curry: '🍛',
  sushi: '🍣',
  bento: '🍱',
  dumpling: '🥟',
  fortune_cookie: '🥠',
  takeout_box: '🥡',
  rice: '🍚',
  rice_ball: '🍙',
  rice_cracker: '🍘',
  fish_cake: '🍥',
  oden: '🍢',
  dango: '🍡',
  shaved_ice: '🍧',
  ice_cream: '🍨',
  icecream: '🍦',
  pie: '🥧',
  cake: '🍰',
  cupcake: '🧁',
  moon_cake: '🥮',
  doughnut: '🍩',
  cookie: '🍪',
  chocolate_bar: '🍫',
  candy: '🍬',
  lollipop: '🍭',
  custard: '🍮',
  honey_pot: '🍯',
  baby_bottle: '🍼',
  milk: '🥛',
  coffee: '☕',
  tea: '🍵',
  sake: '🍶',
  champagne: '🍾',
  wine_glass: '🍷',
  cocktail: '🍸',
  tropical_drink: '🍹',
  beer: '🍺',
  beers: '🍻',
  clinking_glasses: '🥂',
  tumbler_glass: '🥃',
  cup_with_straw: '🥤',
  bubble_tea: '🧋',
  beverage_box: '🧃',
  mate: '🧉',
  ice_cube: '🧊',
  chopsticks: '🥢',
  fork_and_knife: '🍴',
  spoon: '🥄',
  knife: '🔪',
  plate_with_cutlery: '🍽️',

  // Animals & Nature
  dog: '🐶',
  cat: '🐱',
  mouse: '🐭',
  hamster: '🐹',
  rabbit: '🐰',
  fox: '🦊',
  bear: '🐻',
  panda_face: '🐼',
  koala: '🐨',
  tiger: '🐯',
  lion: '🦁',
  cow: '🐮',
  pig: '🐷',
  frog: '🐸',
  monkey_face: '🐵',
  chicken: '🐔',
  penguin: '🐧',
  bird: '🐦',
  baby_chick: '🐤',
  hatching_chick: '🐣',
  hatched_chick: '🐥',
  duck: '🦆',
  eagle: '🦅',
  owl: '🦉',
  bat: '🦇',
  wolf: '🐺',
  boar: '🐗',
  horse: '🐴',
  unicorn: '🦄',
  bee: '🐝',
  bug: '🐛',
  butterfly: '🦋',
  snail: '🐌',
  shell: '🐚',
  beetle: '🐞',
  ant: '🐜',
  cricket: '🦗',
  spider: '🕷️',
  spider_web: '🕸️',
  scorpion: '🦂',
  mosquito: '🦟',
  fly: '🪰',
  worm: '🪱',
  turtle: '🐢',
  snake: '🐍',
  lizard: '🦎',
  t_rex: '🦖',
  sauropod: '🦕',
  octopus: '🐙',
  squid: '🦑',
  shrimp: '🦐',
  lobster: '🦞',
  crab: '🦀',
  blowfish: '🐡',
  tropical_fish: '🐠',
  fish: '🐟',
  dolphin: '🐬',
  whale: '🐳',
  whale2: '🐋',
  shark: '🦈',
  seal: '🦭',
  crocodile: '🐊',
  leopard: '🐆',
  zebra: '🦓',
  gorilla: '🦍',
  orangutan: '🦧',
  elephant: '🐘',
  mammoth: '🦣',
  rhinoceros: '🦏',
  hippopotamus: '🦛',
  camel: '🐫',
  dromedary_camel: '🐪',
  giraffe: '🦒',
  kangaroo: '🦘',
  llama: '🦙',
  sheep: '🐑',
  goat: '🐐',
  deer: '🦌',
  dog2: '🐕',
  poodle: '🐩',
  cat2: '🐈',
  rooster: '🐓',
  turkey: '🦃',
  peacock: '🦚',
  parrot: '🦜',
  swan: '🦢',
  flamingo: '🦩',
  dove: '🕊️',
  rabbit2: '🐇',
  raccoon: '🦝',
  skunk: '🦨',
  badger: '🦡',
  beaver: '🦫',
  otter: '🦦',
  sloth: '🦥',
  mouse2: '🐁',
  rat: '🐀',
  chipmunk: '🐿️',
  hedgehog: '🦔',
  paw_prints: '🐾',
  dragon: '🐉',
  dragon_face: '🐲',

  // Nature & Weather
  sun: '☀️',
  sunny: '☀️',
  moon: '🌙',
  full_moon: '🌕',
  new_moon: '🌑',
  crescent_moon: '🌙',
  cloud: '☁️',
  partly_sunny: '⛅',
  rain: '🌧️',
  umbrella: '☂️',
  snowflake: '❄️',
  snowman: '⛄',
  zap: '⚡',
  lightning: '⚡',
  rainbow: '🌈',
  ocean: '🌊',
  earth_africa: '🌍',
  earth_americas: '🌎',
  earth_asia: '🌏',
  globe_with_meridians: '🌐',
  world_map: '🗺️',
  volcano: '🌋',
  mount_fuji: '🗻',
  camping: '🏕️',
  beach: '🏖️',
  desert: '🏜️',
  island: '🏝️',
  national_park: '🏞️',
  sunrise: '🌅',
  sunset: '🌇',
  city_sunrise: '🌇',
  city_sunset: '🌆',
  night_with_stars: '🌃',
  milky_way: '🌌',
  bouquet: '💐',
  cherry_blossom: '🌸',
  white_flower: '💮',
  rosette: '🏵️',
  rose: '🌹',
  wilted_flower: '🥀',
  hibiscus: '🌺',
  sunflower: '🌻',
  blossom: '🌼',
  tulip: '🌷',
  seedling: '🌱',
  evergreen_tree: '🌲',
  deciduous_tree: '🌳',
  palm_tree: '🌴',
  cactus: '🌵',
  ear_of_rice: '🌾',
  herb: '🌿',
  shamrock: '☘️',
  four_leaf_clover: '🍀',
  maple_leaf: '🍁',
  fallen_leaf: '🍂',
  leaves: '🍃',

  // Symbols & Misc
  check: '✅',
  white_check_mark: '✅',
  x: '❌',
  cross_mark: '❌',
  question: '❓',
  exclamation: '❗',
  warning: '⚠️',
  no_entry: '⛔',
  prohibited: '🚫',
  ok: '🆗',
  cool: '🆒',
  new: '🆕',
  free: '🆓',
  up: '🆙',
  sos: '🆘',
  information_source: 'ℹ️',
  abc: '🔤',
  abcd: '🔡',
  capital_abcd: '🔠',
  symbols: '🔣',
  1234: '🔢',
  hash: '#️⃣',
  keycap_star: '*️⃣',
  zero: '0️⃣',
  one: '1️⃣',
  two: '2️⃣',
  three: '3️⃣',
  four: '4️⃣',
  five: '5️⃣',
  six: '6️⃣',
  seven: '7️⃣',
  eight: '8️⃣',
  nine: '9️⃣',
  keycap_ten: '🔟',
  arrow_up: '⬆️',
  arrow_down: '⬇️',
  arrow_left: '⬅️',
  arrow_right: '➡️',
  arrow_upper_left: '↖️',
  arrow_upper_right: '↗️',
  arrow_lower_left: '↙️',
  arrow_lower_right: '↘️',
  left_right_arrow: '↔️',
  arrow_up_down: '↕️',
  arrows_counterclockwise: '🔄',
  arrow_forward: '▶️',
  arrow_backward: '◀️',
  fast_forward: '⏩',
  rewind: '⏪',
  play_pause: '⏯️',
  stop_button: '⏹️',
  record_button: '⏺️',
  eject: '⏏️',
  repeat: '🔁',
  repeat_one: '🔂',
  shuffle: '🔀',
  cinema: '🎦',
  low_brightness: '🔅',
  high_brightness: '🔆',
  signal_strength: '📶',
  vibration_mode: '📳',
  mobile_phone_off: '📴',
  recycle: '♻️',
  trident: '🔱',
  name_badge: '📛',
  beginner: '🔰',
  o: '⭕',
  white_circle: '⚪',
  black_circle: '⚫',
  red_circle: '🔴',
  blue_circle: '🔵',
  orange_circle: '🟠',
  yellow_circle: '🟡',
  green_circle: '🟢',
  purple_circle: '🟣',
  brown_circle: '🟤',
  black_square: '⬛',
  white_square: '⬜',
  red_square: '🟥',
  blue_square: '🟦',
  orange_square: '🟧',
  yellow_square: '🟨',
  green_square: '🟩',
  purple_square: '🟪',
  brown_square: '🟫',
  black_small_square: '▪️',
  white_small_square: '▫️',
  black_medium_square: '◼️',
  white_medium_square: '◻️',
  black_medium_small_square: '◾',
  white_medium_small_square: '◽',
  black_large_square: '⬛',
  white_large_square: '⬜',
  diamond_shape_with_a_dot_inside: '💠',
  radio_button: '🔘',
  small_orange_diamond: '🔸',
  small_blue_diamond: '🔹',
  large_orange_diamond: '🔶',
  large_blue_diamond: '🔷',
  copyright: '©️',
  registered: '®️',
  tm: '™️',
};

/**
 * Formatter for emoji shortcodes in text.
 *
 * Detects emoji shortcode patterns (e.g., :smile:, :heart:) in text and converts
 * them to their corresponding Unicode emoji characters.
 *
 * @example
 * ```typescript
 * const formatter = new CometChatEmojiFormatter();
 *
 * // Format text with emoji shortcodes
 * const formatted = formatter.format('Hello :smile: how are you :heart:');
 * // Result: 'Hello 😊 how are you ❤️'
 *
 * // Get detected shortcodes
 * const shortcodes = formatter.getShortcodes();
 * // ['smile', 'heart']
 * ```
 *
 * @see Requirements 5.3
 */
export class CometChatEmojiFormatter extends CometChatTextFormatter {
  /**
   * Unique identifier for this formatter.
   * @see Requirements 5.1
   */
  readonly id = 'emoji-formatter';

  /**
   * Formatter priority (lower = earlier in pipeline).
   * Emoji shortcodes are processed with priority 30 (after URLs and mentions).
   * @see Requirements 5.5
   */
  override priority = 30;

  /**
   * Array of detected shortcodes from the last format() call
   * @private
   */
  private shortcodes: string[] = [];

  /**
   * Custom emoji map for additional shortcodes
   * @private
   */
  private customEmojiMap: Record<string, string> = {};

  /**
   * Get the regex pattern for detecting emoji shortcodes.
   *
   * Matches patterns like :shortcode: where shortcode consists of
   * word characters, numbers, underscores, plus signs, or minus signs.
   *
   * The pattern uses the global flag to find all matches in the text.
   *
   * @returns RegExp pattern for emoji shortcode detection
   */
  getRegex(): RegExp {
    return /:([a-zA-Z0-9_+-]+):/g;
  }

  /**
   * Format the input text by detecting emoji shortcodes and converting them to emoji.
   *
   * This method:
   * 1. Stores the original text
   * 2. Detects all emoji shortcode patterns
   * 3. Converts recognized shortcodes to Unicode emoji
   * 4. Stores detected shortcodes in metadata
   * 5. Returns formatted text with emoji characters
   *
   * Unrecognized shortcodes are left unchanged in the text.
   *
   * @param text - The text to format
   * @returns The formatted text with emoji characters
   */
  format(text: string): string {
    if (text == null) {
      this.originalText = '';
      this.formattedText = '';
      this.metadata = { shortcodes: [] };
      return '';
    }

    this.originalText = text;
    this.shortcodes = [];

    this.formattedText = text.replace(this.getRegex(), (match, shortcode) => {
      const lowerShortcode = shortcode.toLowerCase();

      // Check custom emoji map first, then built-in map
      const emoji = this.customEmojiMap[lowerShortcode] || EMOJI_MAP[lowerShortcode];

      if (emoji) {
        this.shortcodes.push(shortcode);
        return emoji;
      }

      // Return original match if shortcode not found
      return match;
    });

    this.metadata = { shortcodes: this.shortcodes };
    return this.formattedText;
  }

  /**
   * Get the array of detected shortcodes from the last format() call.
   *
   * @returns Array of shortcode strings detected and converted in the text
   */
  getShortcodes(): string[] {
    return [...this.shortcodes];
  }

  /**
   * Check if the text contains any emoji shortcodes that were converted.
   *
   * @returns true if shortcodes were detected and converted, false otherwise
   */
  hasShortcodes(): boolean {
    return this.shortcodes.length > 0;
  }

  /**
   * Add custom emoji shortcodes to the formatter.
   *
   * Custom shortcodes take precedence over built-in shortcodes.
   *
   * @param emojiMap - A record mapping shortcode names to emoji characters
   *
   * @example
   * ```typescript
   * formatter.addCustomEmoji({
   *   'custom_emoji': '🎮',
   *   'company_logo': '🏢'
   * });
   * ```
   */
  addCustomEmoji(emojiMap: Record<string, string>): void {
    this.customEmojiMap = { ...this.customEmojiMap, ...emojiMap };
  }

  /**
   * Clear all custom emoji shortcodes.
   */
  clearCustomEmoji(): void {
    this.customEmojiMap = {};
  }

  /**
   * Get the emoji for a specific shortcode.
   *
   * @param shortcode - The shortcode to look up (without colons)
   * @returns The emoji character or undefined if not found
   */
  getEmoji(shortcode: string): string | undefined {
    const lowerShortcode = shortcode.toLowerCase();
    return this.customEmojiMap[lowerShortcode] || EMOJI_MAP[lowerShortcode];
  }

  /**
   * Check if a shortcode is recognized.
   *
   * @param shortcode - The shortcode to check (without colons)
   * @returns true if the shortcode is recognized, false otherwise
   */
  isValidShortcode(shortcode: string): boolean {
    const lowerShortcode = shortcode.toLowerCase();
    return lowerShortcode in this.customEmojiMap || lowerShortcode in EMOJI_MAP;
  }

  /**
   * Reset the formatter state to initial values.
   *
   * Clears original text, formatted text, metadata, and detected shortcodes.
   * Does not clear custom emoji map - call clearCustomEmoji() for that.
   */
  override reset(): void {
    super.reset();
    this.shortcodes = [];
  }
}
