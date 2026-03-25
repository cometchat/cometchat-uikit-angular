import {
  Injectable,
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  OnDestroy,
  EmbeddedViewRef,
} from '@angular/core';
import { CometChatToastComponent, ToastType } from './cometchat-toast.component';

/**
 * Configuration options for creating a toast
 */
export interface ToastConfig {
  /** Toast message text */
  text: string;
  /** Toast type for styling and icon */
  type?: ToastType;
  /** Duration in milliseconds before auto-dismiss (default: 3000ms, 0 = no auto-dismiss) */
  duration?: number;
  /** Show close button */
  showCloseButton?: boolean;
}

/**
 * Internal toast reference for tracking active toasts
 */
interface ToastRef {
  componentRef: ComponentRef<CometChatToastComponent>;
  id: number;
}

/**
 * CometChatToast Service
 *
 * A service for programmatically creating and managing toast notifications.
 * Supports toast stacking and provides convenience methods for different toast types.
 *
 * @example
 * ```typescript
 * constructor(private toastService: CometChatToastService) {}
 *
 * showSuccess() {
 *   this.toastService.success('Operation completed successfully!');
 * }
 *
 * showError() {
 *   this.toastService.error('An error occurred', { duration: 5000 });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class CometChatToastService implements OnDestroy {
  private toasts: ToastRef[] = [];
  private nextId = 0;
  private containerElement?: HTMLElement;
  private readonly TOAST_SPACING = 10; // Spacing between stacked toasts in pixels

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {
    this.initializeContainer();
  }

  /**
   * Initialize the toast container element
   */
  private initializeContainer(): void {
    if (typeof document === 'undefined') return;

    this.containerElement = document.createElement('div');
    this.containerElement.className = 'cometchat-toast-container';
    this.containerElement.style.position = 'fixed';
    this.containerElement.style.bottom = '80px';
    this.containerElement.style.left = '50%';
    this.containerElement.style.transform = 'translateX(-50%)';
    this.containerElement.style.zIndex = '9999';
    this.containerElement.style.display = 'flex';
    this.containerElement.style.flexDirection = 'column';
    this.containerElement.style.alignItems = 'center';
    this.containerElement.style.gap = `${this.TOAST_SPACING}px`;
    this.containerElement.style.pointerEvents = 'none';

    document.body.appendChild(this.containerElement);
  }

  /**
   * Show a toast notification with custom configuration
   *
   * @param config - Toast configuration options
   * @returns The ID of the created toast
   */
  show(config: ToastConfig): number {
    if (!this.containerElement) {
      this.initializeContainer();
    }

    const toastId = this.nextId++;

    // Create the component
    const componentRef = createComponent(CometChatToastComponent, {
      environmentInjector: this.injector,
    });

    // Set inputs
    componentRef.instance.text = config.text;
    componentRef.instance.type = config.type || ToastType.info;
    componentRef.instance.duration = config.duration !== undefined ? config.duration : 3000;
    componentRef.instance.showCloseButton =
      config.showCloseButton !== undefined ? config.showCloseButton : true;
    componentRef.instance.inline = true;

    // Subscribe to close event — store subscription for cleanup
    const closeSub = componentRef.instance.toastClosed.subscribe(() => {
      this.remove(toastId);
      closeSub.unsubscribe();
    });

    // Attach to application
    this.appRef.attachView(componentRef.hostView);

    // Get the DOM element
    const domElement = (componentRef.hostView as EmbeddedViewRef<unknown>).rootNodes[0] as HTMLElement;
    domElement.style.pointerEvents = 'auto';

    // Add to container
    this.containerElement?.appendChild(domElement);

    // Track the toast
    this.toasts.push({ componentRef, id: toastId });

    // Trigger change detection
    componentRef.changeDetectorRef.detectChanges();

    return toastId;
  }

  /**
   * Remove a toast by ID
   *
   * @param id - The ID of the toast to remove
   */
  remove(id: number): void {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index === -1) return;

    const toastRef = this.toasts[index];

    // Detach from application
    this.appRef.detachView(toastRef.componentRef.hostView);

    // Destroy the component
    toastRef.componentRef.destroy();

    // Remove from tracking
    this.toasts.splice(index, 1);
  }

  /**
   * Remove all active toasts
   */
  clear(): void {
    this.toasts.forEach(toastRef => {
      this.appRef.detachView(toastRef.componentRef.hostView);
      toastRef.componentRef.destroy();
    });
    this.toasts = [];
  }

  /**
   * Show a success toast
   *
   * @param text - The message text
   * @param options - Optional configuration (duration, showCloseButton)
   * @returns The ID of the created toast
   */
  success(text: string, options?: Partial<Omit<ToastConfig, 'text' | 'type'>>): number {
    return this.show({
      text,
      type: ToastType.success,
      ...options,
    });
  }

  /**
   * Show an error toast
   *
   * @param text - The message text
   * @param options - Optional configuration (duration, showCloseButton)
   * @returns The ID of the created toast
   */
  error(text: string, options?: Partial<Omit<ToastConfig, 'text' | 'type'>>): number {
    return this.show({
      text,
      type: ToastType.error,
      ...options,
    });
  }

  /**
   * Show a warning toast
   *
   * @param text - The message text
   * @param options - Optional configuration (duration, showCloseButton)
   * @returns The ID of the created toast
   */
  warning(text: string, options?: Partial<Omit<ToastConfig, 'text' | 'type'>>): number {
    return this.show({
      text,
      type: ToastType.warning,
      ...options,
    });
  }

  /**
   * Show an info toast
   *
   * @param text - The message text
   * @param options - Optional configuration (duration, showCloseButton)
   * @returns The ID of the created toast
   */
  info(text: string, options?: Partial<Omit<ToastConfig, 'text' | 'type'>>): number {
    return this.show({
      text,
      type: ToastType.info,
      ...options,
    });
  }

  /**
   * Get the count of active toasts
   *
   * @returns The number of active toasts
   */
  getActiveCount(): number {
    return this.toasts.length;
  }

  /**
   * Clean up on service destruction
   */
  ngOnDestroy(): void {
    this.clear();
    if (this.containerElement && this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement);
    }
  }
}
