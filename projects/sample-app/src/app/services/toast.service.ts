import { Injectable, signal } from '@angular/core';

/**
 * Represents a single toast notification in the queue.
 */
export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

/** Auto-dismiss timeout in milliseconds. */
const AUTO_DISMISS_MS = 5000;

/**
 * ToastService
 *
 * Manages a queue of toast notifications displayed to the user.
 * Toasts auto-dismiss after a timeout and can also be removed manually.
 * Components read the `toasts` signal to render active notifications.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Reactive queue of active toasts. */
  toasts = signal<ToastItem[]>([]);

  /** Counter for generating unique toast IDs. */
  private idCounter = 0;

  /** Show a success toast. */
  showSuccess(message: string): void {
    this.addToast('success', message);
  }

  /** Show an error toast. */
  showError(message: string): void {
    this.addToast('error', message);
  }

  /** Show an info toast. */
  showInfo(message: string): void {
    this.addToast('info', message);
  }

  /** Remove a toast by its ID. */
  removeToast(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  /**
   * Creates a toast, appends it to the signal array,
   * and schedules auto-removal after the timeout.
   */
  private addToast(type: 'success' | 'error' | 'info', message: string): void {
    const id = `toast-${++this.idCounter}`;
    const toast: ToastItem = { id, type, message };

    this.toasts.update((current) => [...current, toast]);

    setTimeout(() => this.removeToast(id), AUTO_DISMISS_MS);
  }
}
