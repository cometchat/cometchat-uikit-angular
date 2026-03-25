import { Component } from '@angular/core';
import { TranslatePipe } from '@cometchat/chat-uikit-angular';

/**
 * CometChatEmptyStateComponent
 *
 * Simple placeholder displayed in the center panel when no
 * conversation, user, or group is currently selected.
 * Shows a chat icon and localized instructional text.
 */
@Component({
  selector: 'cometchat-empty-state',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './cometchat-empty-state.component.html',
  styleUrls: ['./cometchat-empty-state.component.css'],
})
export class CometChatEmptyStateComponent {}
