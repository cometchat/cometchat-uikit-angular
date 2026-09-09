import { CometChatActions } from './CometChatActions';

/**
 * CometChatActionsIcon is a pre-defined structure for creating actions
 * that the user can perform on a message with an icon representation.
 * It is used in CometChatContextMenu, CometChatMessageBubble, CometChatMessageList components.
 */
export class CometChatActionsIcon extends CometChatActions {
  /**
   * Function invoked when the user clicks on the message action.
   * @type {(id: number) => void}
   */
  onClick: (id: number) => void;

  /**
   * Nested actions, rendered as a flyout when the user opens this item.
   *
   * An item with children is a GROUP: it opens its own list rather than
   * performing an action, so its `onClick` is never called. Used to gather
   * related actions — "Organise ▸" holding Pin and Save — without lengthening
   * the top-level menu.
   *
   * One level only. A child carrying its own children is not rendered as a
   * further flyout, because a menu that nests arbitrarily is unusable with a
   * keyboard and impossible to place on a small screen.
   *
   * @type {CometChatActionsIcon[] | undefined}
   */
  children?: CometChatActionsIcon[];

  /**
   * Creates an instance of CometChatActionsIcon.
   */
  constructor(options: {
    /**
     * Unique identifier for the message action.
     * @type {string}
     */
    id: string;

    /**
     * Heading text for the message action.
     * @type {string}
     */
    title: string;

    /**
     * Asset URL for the icon to symbolize a message action.
     * @type {string}
     */
    iconURL: string;

    /**
     * Function invoked when the user clicks on the message action.
     * This function should handle the action related to the provided message id.
     * @type {(id: number) => void}
     */
    onClick: (id: number) => void;

    /**
     * Nested actions. Supplying these makes the item a group that opens a
     * flyout instead of performing an action.
     * @type {CometChatActionsIcon[]}
     */
    children?: CometChatActionsIcon[];
  }) {
    super(options);
    this.onClick = options.onClick;
    this.children = options.children;
  }
}
