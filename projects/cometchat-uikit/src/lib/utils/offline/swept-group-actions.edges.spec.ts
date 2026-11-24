/** Swept group actions: every action kind, a handler that is not there, and the replay stream's guards. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';
import { isGroupMemberAction, replayGroupAction, replaySweptGroupActions } from './swept-group-actions';

const group = { getGuid: () => 'g1' };
const action = (kind: string, extra: Record<string, unknown> = {}): any => ({
  getCategory: () => 'action',
  getType: () => 'groupMember',
  getAction: () => kind,
  getActionOn: () => 'on-user',
  getActionBy: () => 'by-user',
  getActionFor: () => group,
  getNewScope: () => 'admin',
  getOldScope: () => 'participant',
  ...extra,
});

describe('isGroupMemberAction', () => {
  it('only a group-member action message is one', () => {
    expect(isGroupMemberAction(null)).toBe(false);
    expect(isGroupMemberAction(undefined)).toBe(false);
    expect(isGroupMemberAction({} as any)).toBe(false);
    expect(isGroupMemberAction({ getCategory: () => 'message', getType: () => 'text' } as any)).toBe(false);
    expect(isGroupMemberAction(action('left'))).toBe(true);
  });
});

describe('replayGroupAction', () => {
  it('runs the handler of each action kind with the SDK arguments', () => {
    const h = {
      onGroupMemberJoined: vi.fn(),
      onGroupMemberLeft: vi.fn(),
      onGroupMemberKicked: vi.fn(),
      onGroupMemberBanned: vi.fn(),
      onGroupMemberUnbanned: vi.fn(),
      onGroupMemberScopeChanged: vi.fn(),
      onMemberAddedToGroup: vi.fn(),
    };
    for (const kind of ['joined', 'invited', 'left', 'kicked', 'banned', 'unbanned', 'scopeChanged', 'added']) {
      expect(replayGroupAction(action(kind), h as any)).toBe(true);
    }
    expect(h.onGroupMemberJoined).toHaveBeenCalledTimes(2);
    expect(h.onGroupMemberLeft).toHaveBeenCalledWith(expect.anything(), 'by-user', group);
    expect(h.onGroupMemberKicked).toHaveBeenCalledWith(expect.anything(), 'on-user', 'by-user', group);
    expect(h.onGroupMemberBanned).toHaveBeenCalledTimes(1);
    expect(h.onGroupMemberUnbanned).toHaveBeenCalledTimes(1);
    expect(h.onGroupMemberScopeChanged).toHaveBeenCalledWith(expect.anything(), 'on-user', 'admin', 'participant', group);
    expect(h.onMemberAddedToGroup).toHaveBeenCalledWith(expect.anything(), 'on-user', 'by-user', group);
  });

  it('an added member reaches the alias handler when the usual one is not there', () => {
    const alias = vi.fn();
    expect(replayGroupAction(action('added'), { onGroupMemberAddedToGroup: alias } as any)).toBe(true);
    expect(alias).toHaveBeenCalledTimes(1);
  });

  it('no handler for the action, an unknown action, a missing group or a non-action: nothing runs', () => {
    expect(replayGroupAction(action('left'), {} as any)).toBe(false);
    expect(replayGroupAction(action('banned'), {} as any)).toBe(false);
    expect(replayGroupAction(action('unbanned'), {} as any)).toBe(false);
    expect(replayGroupAction(action('kicked'), {} as any)).toBe(false);
    expect(replayGroupAction(action('scopeChanged'), {} as any)).toBe(false);
    expect(replayGroupAction(action('added'), {} as any)).toBe(false);
    expect(replayGroupAction(action('joined'), {} as any)).toBe(false);
    expect(replayGroupAction(action('teleported'), { onGroupMemberLeft: vi.fn() } as any)).toBe(false);
    expect(replayGroupAction(action('left', { getActionFor: () => undefined }), { onGroupMemberLeft: vi.fn() } as any)).toBe(false);
    expect(replayGroupAction(action('left', { getActionFor: () => ({}) }), { onGroupMemberLeft: vi.fn() } as any)).toBe(false);
    expect(replayGroupAction({ getCategory: () => 'message' } as any, { onGroupMemberLeft: vi.fn() } as any)).toBe(false);
    expect(replayGroupAction(action('scopeChanged', { getNewScope: undefined, getOldScope: undefined }), { onGroupMemberScopeChanged: vi.fn() } as any)).toBe(true);
  });

  it('an action whose getters are missing is not replayed', () => {
    const bare: any = { getCategory: () => 'action', getType: () => 'groupMember' };
    expect(replayGroupAction(bare, { onGroupMemberLeft: vi.fn() } as any)).toBe(false);
  });
});

describe('replaySweptGroupActions', () => {
  it('drops events of an older session, runs handlers that are given late, and survives a handler that throws', () => {
    const stream = new Subject<any>();
    let gen = 2;
    let handlers: any = null;
    const left = vi.fn();
    const sub = replaySweptGroupActions(stream, () => gen, () => handlers);
    stream.next({ gen: 1, messages: [action('left')] });
    stream.next({ gen: 2, messages: [action('left')] });
    expect(left).not.toHaveBeenCalled();
    handlers = {
      onGroupMemberLeft: (...args: unknown[]) => {
        left(...args);
        throw new Error('bad handler');
      },
    };
    stream.next({ gen: 2, messages: [action('left'), action('left')] });
    expect(left).toHaveBeenCalledTimes(2);
    gen = 3;
    stream.next({ gen: 2, messages: [action('left')] });
    expect(left).toHaveBeenCalledTimes(2);
    sub.unsubscribe();
  });

  it('accepts the handlers themselves instead of a function', () => {
    const stream = new Subject<any>();
    const left = vi.fn();
    replaySweptGroupActions(stream, () => 1, { onGroupMemberLeft: left } as any);
    stream.next({ gen: 1, messages: [action('left')] });
    expect(left).toHaveBeenCalledTimes(1);
  });
});
