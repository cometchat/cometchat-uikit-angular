/**
 * CometChatUserItem renders a single user item with state management,
 * avatar, custom templates, context menu, and keyboard accessibility.
 * @see Requirements 1.1-1.6
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  inject,
  computed,
  signal,
  booleanAttribute, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatContextMenuComponent } from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatOption } from '../../modals/CometChatOption';
import { Placement } from '../../Enums/Enums';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';

/**
 * CometChatUserItem is a standalone Angular component that renders
 * a single user item with support for:
 * - State management (active, selected, focused)
 * - User avatar with online/offline status indicator
 * - Custom templates for leading, title, subtitle, and trailing sections
 * - Context menu integration
 * - Full keyboard accessibility with ARIA support
 *
 * @example
 * ```html
 * <cometchat-user-item
 *   [user]="user"
 *   [isActive]="isActive"
 *   [isSelected]="isSelected"
 *   (itemClick)="onItemClick($event)">
 * </cometchat-user-item>
 * ```
 * @see Requirements 1.1-1.6
 */
@Component({
  selector: 'cometchat-user-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CometChatAvatarComponent, CometChatContextMenuComponent],
  templateUrl: './cometchat-user-item.component.html',
  styleUrls: ['./cometchat-user-item.component.css'],
})
export class CometChatUserItemComponent {
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });

  @Input({ required: true }) user!: CometChat.User;
  @Input() isActive = false;
  @Input() isSelected = false;
  @Input() isFocused = false;
  @Input() tabIndex = -1;

  private hideUserStatusExplicitlySet = signal(false);
  private disableDefaultContextMenuExplicitlySet = signal(false);
  private _hideUserStatus = signal(false);
  private _disableDefaultContextMenu = signal(true);

  @Input({ transform: booleanAttribute })
  set hideUserStatus(value: boolean) { this._hideUserStatus.set(value); this.hideUserStatusExplicitlySet.set(true); }
  get hideUserStatus(): boolean { return this._hideUserStatus(); }

  @Input({ transform: booleanAttribute })
  set disableDefaultContextMenu(value: boolean) { this._disableDefaultContextMenu.set(value); this.disableDefaultContextMenuExplicitlySet.set(true); }
  get disableDefaultContextMenu(): boolean { return this._disableDefaultContextMenu(); }

  effectiveHideUserStatus = computed(() => {
    if (this.hideUserStatusExplicitlySet()) return this._hideUserStatus();
    if (this.globalConfig?.hideUserStatus !== undefined) return this.globalConfig.hideUserStatus;
    return false;
  });

  effectiveDisableDefaultContextMenu = computed(() => {
    if (this.disableDefaultContextMenuExplicitlySet()) return this._disableDefaultContextMenu();
    if (this.globalConfig?.disableDefaultContextMenu !== undefined) return this.globalConfig.disableDefaultContextMenu;
    return true;
  });

  @Input() contextMenuOptions?: CometChatOption[];
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.User }>;
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.User }>;
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.User }>;
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.User }>;

  @Output() itemClick = new EventEmitter<CometChat.User>();
  @Output() itemSelect = new EventEmitter<{ user: CometChat.User; selected: boolean; }>();
  @Output() contextMenuOpen = new EventEmitter<CometChat.User>();
  @Output() contextMenuOptionClick = new EventEmitter<{ option: CometChatOption; user: CometChat.User; }>();

  readonly Placement = Placement;

  get avatarImage(): string { return this.user?.getAvatar() || ''; }
  get avatarName(): string { return this.user?.getName() || ''; }
  get userStatus(): string { return this.user?.getStatus() || 'offline'; }

  get accessibleLabel(): string {
    const parts: string[] = [this.avatarName];
    if (!this.effectiveHideUserStatus()) {
      parts.push(CometChatLocalize.getLocalizedString(this.userStatus === 'online' ? 'accessibility_status_online' : 'accessibility_status_offline'));
    }
    return parts.join(', ');
  }

  handleMouseDown(event: MouseEvent): void { event.preventDefault(); }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.handleClick(); }
    if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') { event.preventDefault(); this.handleContextMenuOpen(); }
  }

  handleClick(): void { this.itemClick.emit(this.user); }
  handleContextMenuOpen(): void { this.contextMenuOpen.emit(this.user); }
  handleContextMenu(event: MouseEvent): void { if (this.effectiveDisableDefaultContextMenu()) event.preventDefault(); }
  handleContextMenuOptionClick(option: CometChatOption): void { this.contextMenuOptionClick.emit({ option, user: this.user }); }
}
