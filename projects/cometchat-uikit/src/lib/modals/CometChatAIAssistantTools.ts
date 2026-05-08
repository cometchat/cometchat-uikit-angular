/**
 * Model class that maps tool function names to handler functions for the AI Assistant.
 * This is a plain model class — NOT an Angular service.
 */
export class CometChatAIAssistantTools {
  [key: string]: unknown;

  private readonly actions: Record<string, (...args: unknown[]) => unknown>;

  constructor(actions: Record<string, (...args: unknown[]) => unknown>) {
    this.actions = Object.assign(Object.create(null), actions);
    // Expose each action as a direct property for convenience
    for (const [name, handler] of Object.entries(actions)) {
      if (!(name in this)) {
        (this as any)[name] = handler;
      }
    }
  }

  /**
   * Returns the handler function for the given tool name, or undefined if not registered.
   */
  getAction(name: string): ((...args: unknown[]) => unknown) | undefined {
    return this.actions[name];
  }

  /**
   * Returns a shallow copy of the internal actions map.
   * Mutations to the returned object do not affect this instance.
   */
  getActions(): Record<string, (...args: unknown[]) => unknown> {
    return Object.assign({}, this.actions);
  }
}
