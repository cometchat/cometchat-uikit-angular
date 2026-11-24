/**
 * Normalization for the offline-OFF baseline (offline TEST-PLAN §5): what may
 * legitimately differ between two runs is masked, everything else must match.
 */

/** Masked wherever they appear in a request or an event payload (TEST-PLAN §5 + clocks). */
const MASKED_KEYS = new Set([
  'muid', 'localMessageId', 'deviceId', 'sdkVersion', 'version', 'userAgent', 'resource', 'wsId',
  'sentAt', 'updatedAt', 'deliveredAt', 'readAt', 'editedAt', 'deletedAt', 'createdAt', 'joinedAt', 'lastActiveAt', 'at', 't', 'timestamp',
  'authToken', 'jwt',
  // The SDK's session ping (POST /user_sessions) carries a fresh session id and clock each run.
  'sessionId', 'generatedAt',
]);

export function mask(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(mask);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      const item = (value as Record<string, unknown>)[key];
      // That ping's `device.id` is generated per run too; a bare `id` is not masked anywhere else.
      if (key === 'device' && item && typeof item === 'object' && 'id' in item) { out[key] = mask({ ...(item as object), id: '<masked>' }); continue; }
      out[key] = MASKED_KEYS.has(key) && item !== null && item !== undefined ? '<masked>' : mask(item);
    }
    return out;
  }
  return value;
}

export interface RecordedRequest { method: string; path: string; query: unknown; body: unknown }
export interface RecordedEvent { name: string; payload: unknown }
export interface RecordedStep { step: string; requests: string[]; events: string[] }
export interface Baseline { kit: string; recordedAt: string; steps: RecordedStep[] }

/** Requests the SDK or the harness make on their own clock, not the kit under test. */
const NOISE = [/^POST \/v1\/ping/, /^WS /];

export function requestLine(r: RecordedRequest): string {
  return `${r.method} ${r.path} ${JSON.stringify(mask(r.query ?? {}))} ${JSON.stringify(mask(r.body ?? null))}`;
}

export function normalizeRequests(requests: RecordedRequest[]): string[] {
  // Within a step, order depends on timers and promise timing: compare as a sorted multiset.
  return requests.map(requestLine).filter(line => !NOISE.some(n => n.test(line))).sort();
}

export function eventLine(e: RecordedEvent): string {
  return `${e.name} ${JSON.stringify(mask(e.payload))}`;
}

/**
 * The OFF changes this minor ships on purpose (README §1; each is release-noted
 * in docs/release-notes/5.3.0-offline.md under "offline-OFF behaviour changes").
 * Applied to both sides, so everything else must stay exact:
 *  - D3/D6: a failed send now carries `metadata.error` on its `ccMessageSent`
 *    error event (merged into the metadata, not replacing it).
 * D1 (fetched conversation row wins), D2 (a list whose first load failed), D4 and
 * D7 change no request or event in this walkthrough.
 */
export function applyRuledOffChanges(line: string): string {
  const at = line.indexOf(' ');
  const name = line.slice(0, at);
  if (!name.endsWith('.ccMessageSent')) return line;
  const payload = JSON.parse(line.slice(at + 1));
  const metadata = payload?.message?.metadata;
  if (metadata && typeof metadata === 'object' && 'error' in metadata) {
    delete metadata.error;
    if (Object.keys(metadata).length === 0) payload.message.metadata = null;
  }
  return `${name} ${JSON.stringify(payload)}`;
}

export interface Diff { step: string; kind: 'request' | 'event'; missing: string[]; extra: string[] }

function multisetDiff(expected: string[], actual: string[]): { missing: string[]; extra: string[] } {
  const remaining = [...actual];
  const missing: string[] = [];
  for (const line of expected) {
    const at = remaining.indexOf(line);
    if (at === -1) missing.push(line);
    else remaining.splice(at, 1);
  }
  return { missing, extra: remaining };
}

/** Requests compare as a multiset per step; events compare in order per step. */
export function compareBaselines(baseline: Baseline, current: Baseline): Diff[] {
  const diffs: Diff[] = [];
  const steps = new Set([...baseline.steps.map(s => s.step), ...current.steps.map(s => s.step)]);
  for (const step of steps) {
    const a = baseline.steps.find(s => s.step === step) ?? { step, requests: [], events: [] };
    const b = current.steps.find(s => s.step === step) ?? { step, requests: [], events: [] };
    const requests = multisetDiff(a.requests, b.requests);
    if (requests.missing.length || requests.extra.length) diffs.push({ step, kind: 'request', ...requests });
    const expectedEvents = a.events.map(applyRuledOffChanges);
    const actualEvents = b.events.map(applyRuledOffChanges);
    if (JSON.stringify(expectedEvents) !== JSON.stringify(actualEvents)) {
      const events = multisetDiff(expectedEvents, actualEvents);
      // Same lines in another order still fail: the order of public events is part of the contract.
      diffs.push({ step, kind: 'event', missing: events.missing, extra: events.extra.length || events.missing.length ? events.extra : ['(same events, different order)'] });
    }
  }
  return diffs;
}
