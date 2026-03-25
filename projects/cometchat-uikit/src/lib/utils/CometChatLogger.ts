/**
 * Log level enum defining verbosity levels.
 * Ordered from least verbose (none) to most verbose (debug).
 */
export enum LogLevel {
  none = 0,
  error = 1,
  warn = 2,
  info = 3,
  debug = 4,
}

/**
 * Centralized logging utility for the CometChat UIKit.
 * All internal logging goes through this class so consumers can control verbosity.
 *
 * @example
 * // Set log level during app initialization
 * CometChatUIKit.setLogLevel(LogLevel.debug);
 *
 * @example
 * // Or directly
 * CometChatLogger.setLogLevel(LogLevel.error);
 *
 * @example
 * // Usage inside services
 * CometChatLogger.error('ConversationsService', 'Error fetching conversations:', error);
 * CometChatLogger.debug('MessageListService', 'handleReceipt called', { messageId });
 */
export class CometChatLogger {
  private static currentLevel: LogLevel = LogLevel.error;

  /**
   * Sets the active log level. Only messages at this level or below will be output.
   * @param level - The desired log level.
   */
  static setLogLevel(level: LogLevel): void {
    CometChatLogger.currentLevel = level;
  }

  /**
   * Returns the current log level.
   * @returns The active LogLevel value.
   */
  static getLogLevel(): LogLevel {
    return CometChatLogger.currentLevel;
  }

  /**
   * Logs an error message if the current level permits.
   * @param tag - The source identifier (e.g. service or component name).
   * @param message - The log message.
   * @param args - Additional arguments forwarded to `console.error`.
   */
  static error(tag: string, message: string, ...args: unknown[]): void {
    if (CometChatLogger.currentLevel >= LogLevel.error) {
      console.error(`[${tag}]`, message, ...args);
    }
  }

  /**
   * Logs a warning message if the current level permits.
   * @param tag - The source identifier (e.g. service or component name).
   * @param message - The log message.
   * @param args - Additional arguments forwarded to `console.warn`.
   */
  static warn(tag: string, message: string, ...args: unknown[]): void {
    if (CometChatLogger.currentLevel >= LogLevel.warn) {
      console.warn(`[${tag}]`, message, ...args);
    }
  }

  /**
   * Logs an informational message if the current level permits.
   * @param tag - The source identifier (e.g. service or component name).
   * @param message - The log message.
   * @param args - Additional arguments forwarded to `console.info`.
   */
  static info(tag: string, message: string, ...args: unknown[]): void {
    if (CometChatLogger.currentLevel >= LogLevel.info) {
      console.info(`[${tag}]`, message, ...args);
    }
  }

  /**
   * Logs a debug message if the current level permits.
   * @param tag - The source identifier (e.g. service or component name).
   * @param message - The log message.
   * @param args - Additional arguments forwarded to `console.debug`.
   */
  static debug(tag: string, message: string, ...args: unknown[]): void {
    if (CometChatLogger.currentLevel >= LogLevel.debug) {
      console.debug(`[${tag}]`, message, ...args);
    }
  }
}
