/**
 * CometChatErrorBoundary Component
 *
 * A reusable wrapper component that catches errors from projected child content
 * and renders a fallback UI instead of crashing. Uses signal-based state management
 * and supports custom fallback templates.
 *
 * @module components/cometchat-error-boundary
 * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatLogger } from '../../../utils/CometChatLogger';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';

/**
 * Structured error context emitted when an error is caught.
 */
export interface ErrorContext {
  /** The original error that was caught */
  error: Error;
  /** Name identifying the source component */
  componentName: string;
  /** Epoch milliseconds when the error occurred */
  timestamp: number;
}

/**
 * CometChatErrorBoundary wraps child content via `ng-content` and renders
 * a fallback UI when an error is reported via `handleError()`.
 *
 * @example
 * ```html
 * <cometchat-error-boundary componentName="MessageBubble" (error)="onError($event)">
 *   <cometchat-message-bubble [message]="msg"></cometchat-message-bubble>
 * </cometchat-error-boundary>
 * ```
 *
 * @example Custom fallback
 * ```html
 * <cometchat-error-boundary [fallbackView]="customFallback" componentName="MyComponent">
 *   <my-component></my-component>
 * </cometchat-error-boundary>
 * <ng-template #customFallback let-ctx>
 *   <p>Error in {{ ctx.componentName }}: {{ ctx.error.message }}</p>
 * </ng-template>
 * ```
 */
@Component({
  selector: 'cometchat-error-boundary',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (hasError()) {
      @if (fallbackView) {
        <ng-container
          *ngTemplateOutlet="fallbackView; context: { $implicit: errorContext() }"
        ></ng-container>
      } @else {
        <div class="cometchat-error-boundary__fallback">
          <p class="cometchat-error-boundary__message">
            {{ 'error_boundary_something_went_wrong' | translate }}
          </p>
          <button
            class="cometchat-error-boundary__retry"
            (click)="retry()"
            [attr.aria-label]="'error_boundary_retry' | translate"
          >
            {{ 'error_boundary_retry' | translate }}
          </button>
        </div>
      }
    } @else {
      <ng-content></ng-content>
    }
  `,
  styleUrls: ['./cometchat-error-boundary.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatErrorBoundaryComponent {
  /** Optional custom fallback template rendered when an error occurs */
  @Input() fallbackView?: TemplateRef<{ $implicit: ErrorContext }>;

  /** Name identifying the wrapped component, used in ErrorContext */
  @Input() componentName = 'Unknown';

  /** Emits ErrorContext when an error is caught */
  @Output() error = new EventEmitter<ErrorContext>();

  /** Whether the component is in an error state */
  hasError = signal(false);

  /** The current error context, or null if no error */
  errorContext = signal<ErrorContext | null>(null);

  /**
   * Report an error to the boundary. Sets error state, logs the error,
   * and emits the ErrorContext via the `error` output.
   */
  handleError(err: Error): void {
    const context: ErrorContext = {
      error: err,
      componentName: this.componentName,
      timestamp: Date.now(),
    };
    CometChatLogger.error('CometChatErrorBoundary', `[${this.componentName}]`, err);
    this.errorContext.set(context);
    this.hasError.set(true);
    this.error.emit(context);
  }

  /**
   * Reset the error state and re-render child content.
   * Idempotent — calling when no error has no effect.
   */
  retry(): void {
    this.hasError.set(false);
    this.errorContext.set(null);
  }
}
