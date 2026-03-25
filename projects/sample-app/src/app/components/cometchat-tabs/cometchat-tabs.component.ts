import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatLocalize } from '@cometchat/chat-uikit-angular';
import { AppStateService } from '../../services/app-state.service';

/** SVG icon data URIs for each tab (mask-image technique, inherits currentColor). */
const TAB_ICONS = {
  chats: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 33 32'%3E%3Cmask id='m' style='mask-type:alpha' maskUnits='userSpaceOnUse' x='0' y='0' width='33' height='32'%3E%3Crect x='0.5' width='32' height='32' fill='%23D9D9D9'/%3E%3C/mask%3E%3Cg mask='url(%23m)'%3E%3Cpath d='M8.551 23.334L5.882 26.003c-.38.38-.816.465-1.31.256-.492-.21-.739-.583-.739-1.12V5.744c0-.673.233-1.244.7-1.71.466-.467 1.037-.7 1.71-.7h20.513c.674 0 1.244.233 1.71.7.467.467.7 1.037.7 1.71v15.18c0 .673-.233 1.243-.7 1.71-.466.467-1.037.7-1.71.7H8.551zM9.833 18.334h8c.283 0 .52-.096.712-.288.192-.191.288-.429.288-.712 0-.284-.096-.521-.288-.713-.191-.191-.429-.287-.712-.287h-8c-.284 0-.521.096-.713.288-.191.191-.287.429-.287.712 0 .284.096.521.288.713.191.191.429.287.712.287zm0-4h13.333c.284 0 .521-.096.713-.288.191-.191.287-.429.287-.712 0-.284-.096-.521-.288-.713-.191-.191-.429-.287-.712-.287H9.833c-.284 0-.521.096-.713.288-.191.191-.287.429-.287.712 0 .284.096.521.288.713.191.191.429.287.712.287zm0-4h13.333c.284 0 .521-.096.713-.288.191-.192.287-.429.287-.713 0-.283-.096-.52-.288-.712-.191-.192-.429-.288-.712-.288H9.833c-.284 0-.521.096-.713.288-.191.192-.287.429-.287.713 0 .283.096.52.288.712.191.192.429.288.712.288z' fill='%23000'/%3E%3C/g%3E%3C/svg%3E")`,
  calls: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 33 32'%3E%3Cpath d='M26.835 27.778c-2.57 0-5.176-.608-7.817-1.825-2.64-1.217-5.07-2.943-7.289-5.18-2.237-2.219-3.964-4.646-5.18-7.283-1.217-2.637-1.825-5.247-1.825-7.829 0-.407.137-.748.413-1.024.275-.276.619-.414 1.031-.414h4.756c.311 0 .577.105.797.314.22.21.37.475.447.797l.888 4.259c.038.298.026.572-.035.822-.061.25-.176.462-.346.635l-3.234 3.284c.537.926 1.117 1.794 1.74 2.603.623.81 1.31 1.581 2.06 2.313.763.785 1.571 1.508 2.425 2.169.854.66 1.755 1.254 2.703 1.781l3.179-3.222c.203-.219.435-.369.697-.45.261-.082.525-.102.79-.061l4.108.865c.328.079.6.248.815.508.214.26.322.55.322.871v4.622c0 .413-.138.757-.413 1.032-.275.275-.619.413-1.032.413zM8.396 12.378l2.533-2.555-.716-3.49H6.862c.052.912.199 1.863.44 2.856.24.992.605 2.055 1.094 3.189zm11.955 11.822c.878.408 1.824.737 2.837.989 1.014.252 2.007.404 2.98.455v-3.355l-3.289-.695-2.528 2.606z' fill='%23000'/%3E%3C/svg%3E")`,
  users: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 33 32'%3E%3Cpath d='M16.498 16c-1.448 0-2.644-.471-3.586-1.413-.943-.943-1.414-2.138-1.414-3.587 0-1.448.471-2.644 1.413-3.586.943-.943 2.138-1.414 3.587-1.414 1.448 0 2.644.471 3.586 1.413.943.943 1.414 2.138 1.414 3.587 0 1.448-.471 2.644-1.413 3.586-.943.943-2.138 1.414-3.587 1.414zM6.031 24.267v-1.09c0-.8.201-1.497.603-2.091.402-.594.928-1.047 1.579-1.357 1.434-.657 2.83-1.153 4.188-1.488 1.357-.335 2.723-.503 4.097-.503 1.374 0 2.736.17 4.086.508 1.35.339 2.743.836 4.179 1.49.668.31 1.202.76 1.602 1.35.4.59.6 1.287.6 2.09v1.095c0 .577-.207 1.072-.62 1.486-.414.413-.911.62-1.491.62H8.142c-.58 0-1.077-.207-1.491-.62-.413-.414-.62-.91-.62-1.49zm2.111 0h16.711v-1.086c0-.325-.093-.63-.278-.915-.185-.285-.413-.498-.684-.639-1.344-.648-2.603-1.106-3.775-1.375-1.173-.268-2.378-.402-3.617-.402-1.246 0-2.46.134-3.642.403-1.181.268-2.437.727-3.767 1.375-.278.141-.506.355-.684.641-.178.286-.267.591-.267.915v1.084zm8.356-10.378c.822 0 1.509-.276 2.061-.828.552-.552.828-1.239.828-2.061s-.276-1.509-.828-2.061c-.552-.552-1.239-.828-2.061-.828s-1.509.276-2.061.828c-.552.552-.828 1.239-.828 2.061s.276 1.509.828 2.061c.552.552 1.239.828 2.061.828z' fill='%23000'/%3E%3C/svg%3E")`,
  groups: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 33 32'%3E%3Cpath d='M2.114 23.176c0-.756.191-1.441.574-2.054.383-.613.916-1.075 1.6-1.387 1.529-.69 2.95-1.194 4.266-1.515 1.315-.32 2.659-.48 4.033-.48 1.374 0 2.713.16 4.018.48 1.304.32 2.72.825 4.248 1.514.685.311 1.223.774 1.614 1.387.391.613.587 1.298.587 2.055v1.091c0 .58-.207 1.077-.62 1.491-.414.413-.911.62-1.491.62H4.225c-.587 0-1.086-.207-1.496-.62-.41-.413-.615-.91-.615-1.49v-1.091zm26.667 3.202h-4.134c.141-.34.262-.683.364-1.026.102-.343.153-.705.153-1.085v-1.089c0-1.254-.29-2.314-.872-3.179-.581-.866-1.461-1.589-2.639-2.171 1.367.17 2.651.409 3.853.714 1.202.306 2.22.675 3.053 1.109.73.411 1.301.909 1.714 1.494.413.586.619 1.24.619 1.964v1.154c0 .586-.207 1.085-.62 1.497-.414.412-.911.618-1.491.618zM12.587 16c-1.441 0-2.63-.47-3.57-1.408-.938-.94-1.408-2.129-1.408-3.57 0-1.44.47-2.63 1.408-3.569.94-.939 2.13-1.409 3.57-1.409 1.44 0 2.63.47 3.569 1.409.94.939 1.409 2.129 1.409 3.57 0 1.44-.47 2.63-1.409 3.569-.939.939-2.129 1.408-3.569 1.408zm12.044-4.99c0 1.431-.47 2.618-1.408 3.56-.94.943-2.129 1.414-3.57 1.414-.226 0-.491-.019-.795-.056-.304-.037-.572-.095-.805-.173.552-.587 1.132-1.283 1.419-2.087.287-.804.43-1.687.43-2.649 0-.961-.143-1.833-.43-2.616-.287-.782-.707-1.495-1.259-2.137.24-.075.505-.131.794-.168.289-.037.557-.055.806-.055 1.44 0 2.63.471 3.569 1.413.94.942 1.409 2.126 1.409 3.553zM4.225 24.267h16.717v-1.086c0-.325-.093-.63-.278-.92-.185-.289-.413-.5-.684-.633-1.47-.67-2.759-1.134-3.867-1.392-1.107-.257-2.282-.386-3.523-.386-1.244 0-2.427.13-3.55.386-1.121.258-2.414.716-3.878 1.392-.278.133-.504.347-.682.637-.178.29-.267.595-.267.915v1.087zm8.36-10.378c.82 0 1.503-.272 2.049-.817.546-.545.82-1.228.82-2.048 0-.82-.273-1.503-.818-2.05-.545-.546-1.228-.819-2.048-.819-.82 0-1.503.273-2.05.818-.545.546-.818 1.228-.818 2.048 0 .82.272 1.503.817 2.05.546.546 1.228.819 2.049.819z' fill='%23000'/%3E%3C/svg%3E")`,
};

/** Tab definition used internally by the tabs component. */
interface Tab {
  id: 'chats' | 'calls' | 'users' | 'groups';
  labelKey: string;
  iconDataUri: string;
}

/**
 * CometChatTabsComponent
 *
 * Displays four navigation tabs (Chats, Calls, Users, Groups) with icons.
 * Reads active tab from AppStateService and delegates tab changes
 * back to the service. Fully keyboard-accessible with ARIA tablist
 * roles and arrow-key navigation.
 */
@Component({
  selector: 'cometchat-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cometchat-tabs.component.html',
  styleUrls: ['./cometchat-tabs.component.css'],
})
export class CometChatTabsComponent {
  private appStateService = inject(AppStateService);

  protected readonly tabs: Tab[] = [
    { id: 'chats', labelKey: 'selector_tab_conversations', iconDataUri: TAB_ICONS.chats },
    { id: 'calls', labelKey: 'call_logs_title', iconDataUri: TAB_ICONS.calls },
    { id: 'users', labelKey: 'user_title', iconDataUri: TAB_ICONS.users },
    { id: 'groups', labelKey: 'selector_tab_groups', iconDataUri: TAB_ICONS.groups },
  ];

  protected activeTab = this.appStateService.activeTab;

  /** Index of the currently active tab for keyboard navigation. */
  protected activeIndex = computed(() =>
    this.tabs.findIndex((t) => t.id === this.activeTab())
  );

  /** Resolves a tab's localized label. */
  getLabel(tab: Tab): string {
    return CometChatLocalize.getLocalizedString(tab.labelKey);
  }

  /** Selects a tab and updates the app state. */
  selectTab(tab: Tab): void {
    this.appStateService.setActiveTab(tab.id);
  }

  /** Handles keyboard navigation within the tablist. */
  onKeydown(event: KeyboardEvent, index: number): void {
    let newIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        newIndex = (index + 1) % this.tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = (index - 1 + this.tabs.length) % this.tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = this.tabs.length - 1;
        break;
      default:
        return; // Don't prevent default for unhandled keys
    }

    event.preventDefault();
    this.appStateService.setActiveTab(this.tabs[newIndex].id);

    // Move focus to the newly active tab element
    const tablist = (event.target as HTMLElement).closest('[role="tablist"]');
    if (tablist) {
      const tabElements = tablist.querySelectorAll<HTMLElement>('[role="tab"]');
      tabElements[newIndex]?.focus();
    }
  }
}
