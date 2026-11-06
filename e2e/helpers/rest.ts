import { environment } from '../../projects/sample-app/src/environments/environment';
import { E2E_TAGS } from './run';

/**
 * CometChat REST helpers for arranging test state from outside the browser.
 *
 * Messages are sent "as" a user with the `onBehalfOf` header; the REST API
 * ignores a `sender` field in the body and would send as the System user.
 *
 * The E2E app moderates messages: a new message is `pending` until moderation
 * approves it, and only then reaches the receiver and becomes the conversation's last
 * message. The send helpers wait for that, so arranged state is settled before the
 * page loads. Moderation blocks text with a long run of digits as a phone number, so
 * make message text unique with `uniqueTag()`, never a raw `Date.now()`.
 */

const APP_ID = process.env['E2E_APP_ID'] || environment.appId;
const REGION = process.env['E2E_REGION'] || environment.region;
const API_KEY = process.env['E2E_API_KEY'] || environment.apiKey;
const API_BASE = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`;

/**
 * The app allows 500 REST requests a minute. On a 429, wait as long as the response asks
 * (its message says "retry after N seconds") and try again.
 */
export async function fetchWithRateLimit(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 || attempt >= 5) return res;
    const text = await res.text().catch(() => '');
    const seconds = Number(/retry after (\d+) seconds/i.exec(text)?.[1] ?? 30);
    await new Promise((r) => setTimeout(r, (seconds + 1) * 1_000));
  }
}

async function rest(method: string, path: string, body?: object, onBehalfOf?: string): Promise<any> {
  const res = await fetchWithRateLimit(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: API_KEY,
      ...(onBehalfOf ? { onBehalfOf } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} → ${res.status}: ${text.substring(0, 200)}`);
  }
  return res.json().catch(() => null);
}

/** A short unique tag for test data (message text, names, ids) that moderation lets through. */
export function uniqueTag(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

/**
 * A unique tag of letters only, for names a test searches for: the server's search splits a word
 * that mixes letters and digits, so a mixed tag would also match other runs' names.
 */
export function searchableTag(): string {
  return uniqueTag().replace(/[0-9]/g, (d) => 'qwertyuiop'[Number(d)]);
}

/**
 * Wait until the server's search finds at least `count` users or groups for `searchKey`. New
 * users and groups reach the search index some seconds after they are created (longer while
 * other runs are creating data), so a UI search right after creating them can find nothing.
 */
export async function waitForSearchIndex(kind: 'users' | 'groups', searchKey: string, count: number, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await rest('GET', `/${kind}?searchKey=${encodeURIComponent(searchKey)}&perPage=100`);
    const found = res?.data?.length ?? 0;
    if (found >= count) return;
    if (Date.now() > deadline) throw new Error(`Search for "${searchKey}" found ${found} ${kind}, expected ${count}, after ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, 2_000));
  }
}

/**
 * Wait until moderation has decided on message `messageId`; throws if it was blocked, naming
 * the rule. Messages that moderation doesn't cover return at once.
 */
export async function waitForModeration(messageId: string, timeoutMs = 90_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await rest('GET', `/messages/${messageId}`);
    const moderation = res?.data?.data?.moderation;
    if (moderation?.status === 'disapproved') {
      throw new Error(`Moderation blocked message ${messageId} (rule: ${moderation.rule?.name ?? 'unknown'})`);
    }
    if (moderation?.status !== 'pending') return;
    if (Date.now() > deadline) throw new Error(`Message ${messageId} still pending moderation after ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, 2_000));
  }
}

/** POST a message as `sender` and wait for moderation to pass it; returns the message id. */
async function postMessage(body: object, sender: string): Promise<string> {
  const res = await rest('POST', '/messages', body, sender);
  const id = String(res.data.id);
  await waitForModeration(id);
  return id;
}

export async function getUserName(uid: string): Promise<string> {
  return (await rest('GET', `/users/${uid}`)).data.name;
}

/**
 * Create a user tagged as E2E data, so global teardown deletes it.
 * Use for tests that need a user with no history.
 */
export async function createE2EUser(uid: string, name: string): Promise<void> {
  await rest('POST', '/users', { uid, name, tags: E2E_TAGS });
}

/**
 * Send a text message from `sender` to user `receiver`; returns the message id.
 * Pass `quotedMessageId` to send it as a reply quoting that message.
 */
export async function sendTextAs(
  sender: string,
  receiver: string,
  text: string,
  quotedMessageId?: string
): Promise<string> {
  return postMessage(
    {
      category: 'message',
      type: 'text',
      receiver,
      receiverType: 'user',
      data: { text },
      ...(quotedMessageId ? { quotedMessageId: Number(quotedMessageId) } : {}),
    },
    sender
  );
}

/** Send a custom message (e.g. `extension_poll`) from `sender` to user `receiver`. */
export async function sendCustomAs(
  sender: string,
  receiver: string,
  type: string,
  customData: object
): Promise<string> {
  return postMessage({ category: 'custom', type, receiver, receiverType: 'user', data: { customData } }, sender);
}

export async function deleteMessageAs(sender: string, messageId: string): Promise<void> {
  await rest('DELETE', `/messages/${messageId}`, undefined, sender);
}

export async function addGroupMembers(guid: string, uids: string[]): Promise<void> {
  await rest('POST', `/groups/${guid}/members`, { participants: uids });
}

/** Remove a member from a group; succeeds whether or not they were a member. */
export async function removeGroupMember(guid: string, uid: string): Promise<void> {
  await rest('DELETE', `/groups/${guid}/members/${uid}`).catch(() => undefined);
}

/**
 * Send any message body (category, type, data) from `sender` to `receiver` (a user by
 * default, or a group); returns the message id. Set `parentId` to send a thread reply. For bubbles that need specific data or metadata shapes.
 */
export async function sendMessageAs(
  sender: string,
  receiver: string,
  body: { category: string; type: string; data: object; parentId?: number },
  receiverType: 'user' | 'group' = 'user'
): Promise<string> {
  return postMessage({ ...body, receiver, receiverType }, sender);
}

/** Edit the text of a text message sent by `sender`. */
export async function editTextAs(sender: string, messageId: string, text: string): Promise<void> {
  await rest('PUT', `/messages/${messageId}`, { data: { text } }, sender);
}

/** Unblock `blockedUid` for `uid`; succeeds whether or not it was blocked. */
export async function unblockUser(uid: string, blockedUid: string): Promise<void> {
  await rest('DELETE', `/users/${uid}/blockedusers`, { blockedUids: [blockedUid] }).catch(() => undefined);
}

/**
 * Create a group owned by `owner`, tagged as E2E data so global teardown deletes it.
 * `members` join as participants; `admins` / `moderators` join with that scope. Use for
 * tests that need a group with no history or specific roles.
 */
export async function createE2EGroup(
  guid: string,
  name: string,
  owner: string,
  members: string[] = [],
  options: { type?: 'public' | 'private' | 'password'; password?: string; admins?: string[]; moderators?: string[] } = {}
): Promise<void> {
  const { type = 'public', password, admins = [], moderators = [] } = options;
  await rest('POST', '/groups', {
    guid,
    name,
    type,
    owner,
    tags: E2E_TAGS,
    ...(password ? { password } : {}),
  });
  const participants = members.filter((m) => m !== owner && !admins.includes(m) && !moderators.includes(m));
  if (participants.length || admins.length || moderators.length) {
    await rest('POST', `/groups/${guid}/members`, {
      ...(participants.length ? { participants } : {}),
      ...(admins.length ? { admins } : {}),
      ...(moderators.length ? { moderators } : {}),
    });
  }
}

/** The group's owner UID, or null if the group no longer exists. */
export async function getGroupOwner(guid: string): Promise<string | null> {
  return rest('GET', `/groups/${guid}`)
    .then((res) => res.data.owner as string)
    .catch(() => null);
}

/** Scope of `uid` in group `guid` ('admin' | 'moderator' | 'participant'), or null if not a member. */
export async function getMemberScope(guid: string, uid: string): Promise<string | null> {
  const res = await rest('GET', `/groups/${guid}/members?perPage=100`);
  const member = (res.data as { uid: string; scope: string }[]).find((m) => m.uid === uid);
  return member?.scope ?? null;
}

/** Add `reaction` (an emoji) to a message as `uid`. */
export async function addReactionAs(uid: string, messageId: string, reaction: string): Promise<void> {
  await rest('POST', `/messages/${messageId}/reactions/${encodeURIComponent(reaction)}`, {}, uid);
}

/** The group named exactly `name` (guid, type, owner, membersCount), or null if none. */
export async function findGroupByName(
  name: string
): Promise<{ guid: string; type: string; owner: string; membersCount: number } | null> {
  const res = await rest('GET', `/groups?searchKey=${encodeURIComponent(name)}&perPage=100`);
  return (res.data as { guid: string; name: string; type: string; owner: string; membersCount: number }[]).find(
    (g) => g.name === name
  ) ?? null;
}

/**
 * Delete a group (for groups made through the UI, which carry no teardown tag).
 * A group that is already gone (404) is fine; any other failure is logged so a leaked
 * group shows up in the run output instead of piling up silently. Never throws, so it
 * is safe in `finally` cleanup.
 */
export async function deleteGroup(guid: string): Promise<void> {
  await rest('DELETE', `/groups/${guid}`).catch((err: Error) => {
    if (!/→ 404:/.test(err.message)) console.warn(`[e2e] Could not delete group ${guid}: ${err.message}`);
  });
}

/**
 * Messages visible to `uid` whose text matches `keyword` in the server's search index
 * (id and text). New messages take minutes to be indexed, so a test that searches for one
 * must wait for it here first.
 */
export async function searchMessagesAs(uid: string, keyword: string): Promise<{ id: string; text: string }[]> {
  const res = await rest('GET', `/messages?searchKey=${encodeURIComponent(keyword)}&perPage=100`, undefined, uid);
  return (res.data as { id: string | number; data?: { text?: string } }[]).map((m) => ({
    id: String(m.id),
    text: m.data?.text ?? '',
  }));
}

/**
 * Wait until AI agent `agentUid` has answered message `messageId` that `uid` sent it. The agent
 * replies in a thread under the message (category `agentic`), which the conversation's last
 * message doesn't show, so this reads the latest messages. It answers within seconds; returns
 * false after `timeoutMs` (kept inside a hook's 60 s), so a caller can carry on regardless.
 */
export async function waitForAnswerFrom(uid: string, agentUid: string, messageId: string, timeoutMs = 45_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await rest('GET', `/users/${agentUid}/messages?perPage=20&affix=prepend`, undefined, uid);
    const messages = (res?.data ?? []) as { sender?: string; parentId?: string | number }[];
    if (messages.some((m) => m.sender === agentUid && String(m.parentId) === String(messageId))) return true;
    if (Date.now() > deadline) return false;
    await new Promise((r) => setTimeout(r, 2_000));
  }
}

/** The server's unread message count in `uid`'s 1:1 conversation with `withUid`. */
export async function getUnreadCountAs(uid: string, withUid: string): Promise<number> {
  const res = await rest('GET', `/users/${uid}/users/${withUid}/conversation`);
  return Number(res.data?.unreadMessageCount ?? 0);
}
