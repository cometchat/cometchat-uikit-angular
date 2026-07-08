import { isEmptyCardPayload, cardPayloadToJson, safeString } from './card-utils';

describe('card-utils', () => {
  describe('isEmptyCardPayload', () => {
    it('treats null/undefined as empty', () => {
      expect(isEmptyCardPayload(null)).toBe(true);
      expect(isEmptyCardPayload(undefined)).toBe(true);
    });

    it('treats blank / whitespace-only strings as empty', () => {
      expect(isEmptyCardPayload('')).toBe(true);
      expect(isEmptyCardPayload('   ')).toBe(true);
    });

    it('treats an empty object as empty', () => {
      expect(isEmptyCardPayload({})).toBe(true);
    });

    it('treats a populated object or string as non-empty', () => {
      expect(isEmptyCardPayload({ version: '1.0' })).toBe(false);
      expect(isEmptyCardPayload('{"v":1}')).toBe(false);
    });
  });

  describe('cardPayloadToJson', () => {
    it('returns "" for empty payloads', () => {
      expect(cardPayloadToJson(null)).toBe('');
      expect(cardPayloadToJson({})).toBe('');
      expect(cardPayloadToJson('   ')).toBe('');
    });

    it('stringifies an object payload verbatim', () => {
      const card = { version: '1.0', body: [{ type: 'text' }] };
      expect(cardPayloadToJson(card)).toBe(JSON.stringify(card));
    });

    it('passes a non-empty string payload through unchanged', () => {
      expect(cardPayloadToJson('{"version":"1.0"}')).toBe('{"version":"1.0"}');
    });
  });

  describe('safeString', () => {
    it('returns the getter value', () => {
      expect(safeString(() => 'hi')).toBe('hi');
    });

    it('coerces null/undefined to ""', () => {
      expect(safeString(() => undefined)).toBe('');
      expect(safeString(() => null)).toBe('');
    });

    it('returns "" when the getter throws', () => {
      expect(
        safeString(() => {
          throw new Error('boom');
        })
      ).toBe('');
    });
  });
});
