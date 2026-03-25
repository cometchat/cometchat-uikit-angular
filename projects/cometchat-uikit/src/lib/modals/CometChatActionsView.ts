import { TemplateRef } from '@angular/core';
import { CometChatActions } from './CometChatActions';

/**
 * CometChatActionsView is a pre-defined structure for creating actions
 * that the user can perform on a message with a customized UI view representation.
 * It is used in AI module, CometChatMessageBubble, CometChatMessageComposer, CometChatMessageList components.
 */
export class CometChatActionsView extends CometChatActions {
  /**
   * User-defined template to customize the action view for each option in the template.
   * In Angular, we use TemplateRef instead of JSX.Element.
   * @type {TemplateRef<unknown> | ((callbacks: Record<string, unknown>) => TemplateRef<unknown>) | undefined}
   */
  customView?: TemplateRef<unknown> | ((callbacks: Record<string, unknown>) => TemplateRef<unknown>);

  /**
   * Creates an instance of CometChatActionsView.
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
     * Asset URL for the icon to symbolize a message action. This is optional and can be omitted.
     * @type {string}
     */
    iconURL?: string;

    /**
     * User-defined template to customize the action view. This is optional and can be omitted.
     * @type {TemplateRef<unknown> | ((callbacks: Record<string, unknown>) => TemplateRef<unknown>)}
     */
    customView?: TemplateRef<unknown> | ((callbacks: Record<string, unknown>) => TemplateRef<unknown>);
  }) {
    super(options);
    this.customView = options.customView;
  }
}
