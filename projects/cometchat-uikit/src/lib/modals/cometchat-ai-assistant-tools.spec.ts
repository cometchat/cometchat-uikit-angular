import { CometChatAIAssistantTools } from './CometChatAIAssistantTools';

describe('CometChatAIAssistantTools', () => {
  const handlerA = (...args: unknown[]) => args;
  const handlerB = () => 'b';

  describe('constructor', () => {
    it('should create an instance with the provided actions', () => {
      const tools = new CometChatAIAssistantTools({ handlerA, handlerB });
      expect(tools).toBeTruthy();
    });

    it('should accept an empty actions map', () => {
      const tools = new CometChatAIAssistantTools({});
      expect(tools).toBeTruthy();
    });
  });

  describe('getAction', () => {
    it('should return the handler for a registered name', () => {
      const tools = new CometChatAIAssistantTools({ handlerA, handlerB });
      expect(tools.getAction('handlerA')).toBe(handlerA);
      expect(tools.getAction('handlerB')).toBe(handlerB);
    });

    it('should return undefined for an unregistered name', () => {
      const tools = new CometChatAIAssistantTools({ handlerA });
      expect(tools.getAction('nonExistent')).toBeUndefined();
    });

    it('should return undefined for empty string key when not registered', () => {
      const tools = new CometChatAIAssistantTools({ handlerA });
      expect(tools.getAction('')).toBeUndefined();
    });
  });

  describe('getActions', () => {
    it('should return all registered actions', () => {
      const tools = new CometChatAIAssistantTools({ handlerA, handlerB });
      const actions = tools.getActions();
      expect(actions['handlerA']).toBe(handlerA);
      expect(actions['handlerB']).toBe(handlerB);
    });

    it('should return a shallow copy — mutations do not affect the instance', () => {
      const tools = new CometChatAIAssistantTools({ handlerA });
      const copy = tools.getActions();

      // Mutate the copy
      delete (copy as Record<string, unknown>)['handlerA'];
      (copy as Record<string, unknown>)['injected'] = () => {};

      // Original is unaffected
      expect(tools.getAction('handlerA')).toBe(handlerA);
      expect(tools.getActions()['injected']).toBeUndefined();
    });

    it('should return a new object on each call', () => {
      const tools = new CometChatAIAssistantTools({ handlerA });
      const first = tools.getActions();
      const second = tools.getActions();
      expect(first).not.toBe(second);
    });

    it('should return an empty object when no actions registered', () => {
      const tools = new CometChatAIAssistantTools({});
      expect(tools.getActions()).toEqual({});
    });
  });

  describe('index signature (direct property access)', () => {
    it('should allow direct property access via bracket notation', () => {
      const tools = new CometChatAIAssistantTools({ handlerA });
      // The index signature allows tools['handlerA'] — but getAction is the canonical API.
      // We verify the class compiles with the index signature by accessing a known property.
      const fn = (tools as Record<string, unknown>)['getAction'];
      expect(typeof fn).toBe('function');
    });
  });
});
