/**
 * CometChatGroupMemberItem Component
 *
 * A standalone component for rendering a single group member item.
 * Follows the same pattern as CometChatUserItem and CometChatGroupItem.
 *
 * Features:
 * - State management (active, selected, focused)
 * - Member avatar with online/offline status indicator
 * - Role badge (owner, admin, moderator)
 * - Custom template support for all sections
 * - Context menu integration (kick, ban, change scope)
 * - Full keyboard accessibility with ARIA support
 *
 * @module components/cometchat-group-member-item
 * @see Requirements 10.1-10.6
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  inject,
  computed,
  booleanAttribute,
  signal, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatContextMenuComponent } from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatOption } from '../../modals/CometChatOption';
import { Placement } from '../../Enums/Enums';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';

/**
 * CometChatGroupMemberItem is a standalone Angular component that renders
 * a single group member item with support for:
 * - State management (active, selected, focused)
 * - Member avatar with online/offline status indicator
 * - Role badge (owner, admin, moderator)
 * - Custom templates for leading, title, subtitle, and trailing sections
 * - Context menu integration (kick, ban, change scope)
 * - Full keyboard accessibility with ARIA support
 *
 * @example
 * ```html
 * <cometchat-group-member-item
 *   [member]="member"
 *   [isActive]="isActive"
 *   [isSelected]="isSelected"
 *   (itemClick)="onItemClick($event)">
 * </cometchat-group-member-item>
 * ```
 * @see Requirements 10.1-10.6
 */
@Component({
  selector: 'cometchat-group-member-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CometChatAvatarComponent, CometChatContextMenuComponent],
  templateUrl: './cometchat-group-member-item.component.html',
  styleUrls: ['./cometchat-group-member-item.component.css'],
})
export class CometChatGroupMemberItemComponent {
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });

  @Input({ required: true }) member!: CometChat.GroupMember;
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
  @ViewChild(CometChatContextMenuComponent) contextMenuRef?: CometChatContextMenuComponent;
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;

  @Output() itemClick = new EventEmitter<CometChat.GroupMember>();
  @Output() itemFocus = new EventEmitter<void>();
  @Output() contextMenuOptionClick = new EventEmitter<{ option: CometChatOption; member: CometChat.GroupMember; }>();

  readonly Placement = Placement;

  get avatarImage(): string { return this.member?.getAvatar() || ''; }
  get avatarName(): string { return this.member?.getName() || ''; }
  get memberStatus(): string { return this.member?.getStatus() || 'offline'; }
  get memberScope(): string { return this.member?.getScope() || 'participant'; }
  get scopeLabel(): string { return CometChatLocalize.getLocalizedString(`member_scope_${this.memberScope}`); }

  get accessibleLabel(): string {
    const parts: string[] = [this.avatarName];
    const scope = this.memberScope;
    if (scope === 'admin') parts.push(CometChatLocalize.getLocalizedString('accessibility_member_scope_admin'));
    else if (scope === 'moderator') parts.push(CometChatLocalize.getLocalizedString('accessibility_member_scope_moderator'));
    else if (scope === 'owner') parts.push(this.scopeLabel);
    if (!this.effectiveHideUserStatus()) {
      parts.push(CometChatLocalize.getLocalizedString(this.memberStatus === 'online' ? 'accessibility_status_online' : 'accessibility_status_offline'));
    }
    return parts.join(', ');
  }

  handleMouseDown(event: MouseEvent): void {
    // Prevent focus-steal from the list item on click, but only when the click
    // is NOT on the context menu — blocking mousedown on the context menu
    // prevents the subsequent click event from firing on menu options (ENG-35744).
    const target = event.target as HTMLElement | null;
    if (!target?.closest('cometchat-context-menu')) {
      event.preventDefault();
    }
  }
  handleClick(event?: MouseEvent): void {
    // Don't emit itemClick when the user clicked on the context menu dropdown
    // — that would trigger navigation/selection and cause the menu to close.
    if (event) {
      const target = event.target as HTMLElement | null;
      if (target?.closest('cometchat-context-menu') || target?.closest('.cometchat-group-member-item__context-menu')) {
        return;
      }
    }
    this.itemClick.emit(this.member);
  }
  onItemFocus(): void { this.itemFocus.emit(); }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.handleClick(); }
    if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') { event.preventDefault(); this.handleContextMenuOpen(); }
  }

  handleContextMenuOpen(): void {
    if (this.contextMenuRef && !this.contextMenuRef.showSubMenu) {
      this.contextMenuRef.handleMenuClick();
    }
  }

  handleContextMenu(event: MouseEvent): void {
    if (!this.effectiveDisableDefaultContextMenu()) return;
    event.preventDefault();
    if (this.contextMenuRef?.data?.length) {
      this.handleContextMenuOpen();
    }
  }

  handleContextMenuOptionClick(option: CometChatOption): void { this.contextMenuOptionClick.emit({ option, member: this.member }); }
}
