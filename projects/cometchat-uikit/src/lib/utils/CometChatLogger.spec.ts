import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CometChatLogger, LogLevel } from './CometChatLogger';

describe('CometChatLogger', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    CometChatLogger.setLogLevel(LogLevel.error);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Requirement 8.5: setLogLevel / getLogLevel round-trip ──

  describe('setLogLevel / getLogLevel round-trip', () => {
    it.each([LogLevel.none, LogLevel.error, LogLevel.warn, LogLevel.info, LogLevel.debug])(
      'round-trips LogLevel %i',
      level => {
        CometChatLogger.setLogLevel(level);
        expect(CometChatLogger.getLogLevel()).toBe(level);
      }
    );
  });

  // ── Requirement 8.1: error() calls console.error when level >= error ──

  describe('error()', () => {
    it('calls console.error when level is error', () => {
      CometChatLogger.setLogLevel(LogLevel.error);
      CometChatLogger.error('TestTag', 'something broke');
      expect(errorSpy).toHaveBeenCalledOnce();
    });

    it('calls console.error when level is debug (higher verbosity)', () => {
      CometChatLogger.setLogLevel(LogLevel.debug);
      CometChatLogger.error('TestTag', 'something broke');
      expect(errorSpy).toHaveBeenCalledOnce();
    });

    it('does NOT call console.error when level is none', () => {
      CometChatLogger.setLogLevel(LogLevel.none);
      CometChatLogger.error('TestTag', 'something broke');
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  // ── Requirement 8.2: debug() suppressed when level is error ──

  describe('debug()', () => {
    it('does NOT call console.debug when level is error', () => {
      CometChatLogger.setLogLevel(LogLevel.error);
      CometChatLogger.debug('TestTag', 'trace info');
      expect(debugSpy).not.toHaveBeenCalled();
    });

    // ── Requirement 8.3: debug() calls console.debug when level is debug ──

    it('calls console.debug when level is debug', () => {
      CometChatLogger.setLogLevel(LogLevel.debug);
      CometChatLogger.debug('TestTag', 'trace info');
      expect(debugSpy).toHaveBeenCalledOnce();
    });
  });

  // ── Requirement 8.4: LogLevel.none suppresses all output ──

  describe('LogLevel.none suppresses all output', () => {
    it('suppresses error, warn, info, and debug', () => {
      CometChatLogger.setLogLevel(LogLevel.none);

      CometChatLogger.error('T', 'msg');
      CometChatLogger.warn('T', 'msg');
      CometChatLogger.info('T', 'msg');
      CometChatLogger.debug('T', 'msg');

      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });
  });

  // ── Tag formatting: [tag] prefix ──

  describe('tag formatting', () => {
    it('prefixes output with [tag]', () => {
      CometChatLogger.setLogLevel(LogLevel.debug);

      CometChatLogger.error('MyService', 'err msg');
      expect(errorSpy).toHaveBeenCalledWith('[MyService]', 'err msg');

      CometChatLogger.warn('MyService', 'warn msg');
      expect(warnSpy).toHaveBeenCalledWith('[MyService]', 'warn msg');

      CometChatLogger.info('MyService', 'info msg');
      expect(infoSpy).toHaveBeenCalledWith('[MyService]', 'info msg');

      CometChatLogger.debug('MyService', 'debug msg');
      expect(debugSpy).toHaveBeenCalledWith('[MyService]', 'debug msg');
    });

    it('forwards extra args after tag and message', () => {
      CometChatLogger.setLogLevel(LogLevel.error);
      const extra = { id: 42 };
      CometChatLogger.error('Svc', 'failed', extra);
      expect(errorSpy).toHaveBeenCalledWith('[Svc]', 'failed', extra);
    });
  });
});
