/**
 * CometChatGroupItem renders a single group item with state management,
 * avatar, custom templates, context menu, and keyboard accessibility.
 * @see Requirements 2.1-2.6
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

@Component({
  selector: 'cometchat-group-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CometChatAvatarComponent, CometChatContextMenuComponent],
  templateUrl: './cometchat-group-item.component.html',
  styleUrls: ['./cometchat-group-item.component.css'],
})
export class CometChatGroupItemComponent {
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });

  @Input({ required: true }) group!: CometChat.Group;
  @Input() isActive = false;
  @Input() isSelected = false;
  @Input() isFocused = false;
  @Input() tabIndex = -1;

  private hideGroupTypeExplicitlySet = signal(false);
  private disableDefaultContextMenuExplicitlySet = signal(false);
  private _hideGroupType = signal(false);
  private _disableDefaultContextMenu = signal(true);

  @Input({ transform: booleanAttribute })
  set hideGroupType(value: boolean) { this._hideGroupType.set(value); this.hideGroupTypeExplicitlySet.set(true); }
  get hideGroupType(): boolean { return this._hideGroupType(); }

  @Input({ transform: booleanAttribute })
  set disableDefaultContextMenu(value: boolean) { this._disableDefaultContextMenu.set(value); this.disableDefaultContextMenuExplicitlySet.set(true); }
  get disableDefaultContextMenu(): boolean { return this._disableDefaultContextMenu(); }

  effectiveHideGroupType = computed(() => {
    if (this.hideGroupTypeExplicitlySet()) return this._hideGroupType();
    if (this.globalConfig?.hideGroupType !== undefined) return this.globalConfig.hideGroupType;
    return false;
  });

  effectiveDisableDefaultContextMenu = computed(() => {
    if (this.disableDefaultContextMenuExplicitlySet()) return this._disableDefaultContextMenu();
    if (this.globalConfig?.disableDefaultContextMenu !== undefined) return this.globalConfig.disableDefaultContextMenu;
    return true;
  });

  @Input() contextMenuOptions?: CometChatOption[];
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.Group }>;
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.Group }>;
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.Group }>;
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.Group }>;

  // ============================================
  // Output Events
  // ============================================

  @Output() itemClick = new EventEmitter<CometChat.Group>();
  @Output() itemSelect = new EventEmitter<{ group: CometChat.Group; selected: boolean; }>();
  @Output() contextMenuOpen = new EventEmitter<CometChat.Group>();
  @Output() contextMenuOptionClick = new EventEmitter<{ option: CometChatOption; group: CometChat.Group; }>();
  @Output() itemFocus = new EventEmitter<void>();

  readonly Placement = Placement;

  get groupIcon(): string { return this.group?.getIcon() || ''; }
  get groupName(): string { return this.group?.getName() || ''; }
  get groupType(): string { return this.group?.getType() || ''; }
  get memberCount(): number { return this.group?.getMembersCount() || 0; }

  get memberCountText(): string {
    const count = this.memberCount;
    return count === 1
      ? `${count} ${CometChatLocalize.getLocalizedString('group_member')}`
      : `${count} ${CometChatLocalize.getLocalizedString('group_members')}`;
  }

  get accessibleLabel(): string {
    const parts: string[] = [this.groupName];
    if (!this.effectiveHideGroupType() && this.groupType) {
      const typeKeyMap: Record<string, string> = { public: 'accessibility_group_type_public', private: 'accessibility_group_type_private', password: 'accessibility_group_type_password' };
      const typeKey = typeKeyMap[this.groupType];
      if (typeKey) parts.push(CometChatLocalize.getLocalizedString(typeKey));
    }
    parts.push(this.memberCountText);
    return parts.join(', ');
  }

  handleMouseDown(event: MouseEvent): void { event.preventDefault(); }
  handleClick(): void { this.itemClick.emit(this.group); }
  onItemFocus(): void { this.itemFocus.emit(); }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.handleClick(); }
    if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') { event.preventDefault(); this.handleContextMenuOpen(); }
  }

  handleContextMenuOpen(): void { this.contextMenuOpen.emit(this.group); }
  handleContextMenu(event: MouseEvent): void { if (this.effectiveDisableDefaultContextMenu()) event.preventDefault(); }
  handleContextMenuOptionClick(option: CometChatOption): void { this.contextMenuOptionClick.emit({ option, group: this.group }); }
}
