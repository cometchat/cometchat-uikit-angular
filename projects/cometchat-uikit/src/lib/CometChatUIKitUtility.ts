export class CometChatUIKitUtility {
  /**
   * Counter for generating unique IDs within the same millisecond
   */
  private static counter = 0;

  static getUnixTimestamp(): number {
    return Date.now();
  }

  /**
   * Generates a unique identifier string.
   * The ID is composed of:
   * - 'cc_' prefix for CometChat identification
   * - Current timestamp in milliseconds
   * - An incrementing counter to ensure uniqueness within the same millisecond
   * - A random alphanumeric string for additional uniqueness
   *
   * @returns A unique string identifier suitable for listener IDs and component identifiers
   */
  static ID(): string {
    return `cc_${Date.now()}_${++CometChatUIKitUtility.counter}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Creates a deep clone of the given object, preserving prototype chain and
   * property descriptors. Functions are copied by reference.
   *
   * Mirrors the React UIKit's CometChatUIKitUtility.clone implementation.
   * Used to create new object references for Angular change detection (OnPush).
   *
   * @param arg - The value to clone
   * @returns A deep copy of the argument
   */
  static clone<T>(arg: T): T {
    if (typeof arg !== 'object' || !arg) {
      return arg;
    }

    if (Array.isArray(arg)) {
      const res: unknown[] = [];
      for (const value of arg) {
        res.push(CometChatUIKitUtility.clone(value));
      }
      return res as T;
    }

    const res: Record<string | symbol, unknown> = {};
    const descriptor = Object.getOwnPropertyDescriptors(arg);
    for (const k of Reflect.ownKeys(descriptor)) {
      const curDescriptor = descriptor[k as string];
      if (curDescriptor.hasOwnProperty('value')) {
        Object.defineProperty(res, k, {
          ...curDescriptor,
          value: CometChatUIKitUtility.clone(curDescriptor['value']),
        });
      } else {
        Object.defineProperty(res, k, curDescriptor);
      }
    }
    Object.setPrototypeOf(res, Object.getPrototypeOf(arg));
    return res as T;
  }
}
