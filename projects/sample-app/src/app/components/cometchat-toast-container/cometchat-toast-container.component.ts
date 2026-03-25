import { Component, inject } from '@angular/core';
import { CometChatToastComponent, ToastType } from '@cometchat/chat-uikit-angular';
import { ToastService, ToastItem } from '../../services/toast.service';

/**
 * CometChatToastContainerComponent
 *
 * Fixed-position container that reads from ToastService.toasts signal
 * and renders a CometChatToast (UIKit) for each active toast.
 * Auto-dismiss is handled by the ToastService; the UIKit component's
 * toastClosed event triggers removal from the queue.
 */
@Component({
  selector: 'cometchat-toast-container',
  standalone: true,
  imports: [CometChatToastComponent],
  templateUrl: './cometchat-toast-container.component.html',
  styleUrls: ['./cometchat-toast-container.component.css'],
})
export class CometChatToastContainerComponent {
  protected toastService = inject(ToastService);

  /** Active toasts from the service */
  protected toasts = this.toastService.toasts;

  /** Map sample app toast type to UIKit ToastType enum */
  getToastType(item: ToastItem): ToastType {
    switch (item.type) {
      case 'success':
        return ToastType.success;
      case 'error':
        return ToastType.error;
      case 'info':
      default:
        return ToastType.info;
    }
  }

  /** Handle toast closed event — remove from queue */
  onToastClosed(id: string): void {
    this.toastService.removeToast(id);
  }
}
