// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { alreadyGone, planDeletion, runTag } from './e2e-sweep.mjs';

const NOW = 1_800_000_000;
const HOUR = 3600;
const user = (uid: string, ageHours: number, tags: string[] = ['e2e-test-data']) => ({
  uid,
  name: uid,
  createdAt: NOW - ageHours * HOUR,
  tags,
});
const group = (guid: string, ageHours: number, tags: string[] = ['e2e-test-data'], name = guid) => ({
  guid,
  name,
  createdAt: NOW - ageHours * HOUR,
  tags,
});
const ids = (plan: { users: { uid: string }[]; groups: { guid: string }[] }) => ({
  users: plan.users.map((u) => u.uid),
  groups: plan.groups.map((g) => g.guid),
});

describe('e2e-sweep', () => {
  describe('--hours: stale data', () => {
    it('deletes E2E data older than the cut-off and keeps newer data', () => {
      const plan = planDeletion({
        users: [user('old', 3), user('new', 1)],
        groups: [group('old-g', 3), group('new-g', 0.5)],
        now: NOW,
        hours: 2,
      });
      expect(ids(plan)).toEqual({ users: ['old'], groups: ['old-g'] });
    });

    it('deletes untagged groups only when their name starts with "E2E"', () => {
      const plan = planDeletion({
        users: [],
        groups: [group('ui-made', 3, [], 'E2E Live Group abc'), group('customer', 3, [], 'Team chat')],
        now: NOW,
        hours: 2,
      });
      expect(ids(plan).groups).toEqual(['ui-made']);
    });

    it('never deletes shared fixtures, however old', () => {
      const plan = planDeletion({
        users: [user('filler', 500, ['e2e-test-data', 'e2e-fixture'])],
        groups: [],
        now: NOW,
        hours: 2,
      });
      expect(plan.users).toEqual([]);
    });

    it('lists a group found by both tag and name once', () => {
      const g = group('both', 3, ['e2e-test-data'], 'E2E Both');
      expect(ids(planDeletion({ users: [], groups: [g, { ...g }], now: NOW, hours: 2 })).groups).toEqual(['both']);
    });
  });

  describe('--run: one run\'s data', () => {
    it('derives the same tag as e2e/helpers/run.ts', () => {
      expect(runTag('40526910872-1')).toBe('e2e-run-40526910872-1');
    });

    it('deletes the run\'s data and every shard\'s, whatever its age', () => {
      const plan = planDeletion({
        users: [
          user('smoke', 0.1, ['e2e-test-data', 'e2e-run-123-1']),
          user('shard2', 0.1, ['e2e-test-data', 'e2e-run-123-1-s2']),
          user('other-run', 0.1, ['e2e-test-data', 'e2e-run-999-1']),
        ],
        groups: [group('g', 0.1, ['e2e-test-data', 'e2e-run-123-1-s4'])],
        now: NOW,
        run: '123-1',
      });
      expect(ids(plan)).toEqual({ users: ['smoke', 'shard2'], groups: ['g'] });
    });

    it('does not match a run whose id merely starts with the same digits', () => {
      const plan = planDeletion({
        users: [user('run-10', 0.1, ['e2e-test-data', 'e2e-run-123-10'])],
        groups: [],
        now: NOW,
        run: '123-1',
      });
      expect(plan.users).toEqual([]);
    });

    it('leaves another attempt of the same run alone', () => {
      const plan = planDeletion({
        users: [user('attempt-2', 0.1, ['e2e-test-data', 'e2e-run-123-2-s1'])],
        groups: [],
        now: NOW,
        run: '123-1',
      });
      expect(plan.users).toEqual([]);
    });

    it('never deletes fixtures, even if tagged with the run', () => {
      const plan = planDeletion({
        users: [user('filler', 0.1, ['e2e-fixture', 'e2e-run-123-1'])],
        groups: [],
        now: NOW,
        run: '123-1',
      });
      expect(plan.users).toEqual([]);
    });
  });

  it('treats a 404 on delete as already gone, and nothing else', () => {
    expect(alreadyGone({ status: 404 })).toBe(true);
    for (const status of [401, 403, 429, 500]) expect(alreadyGone({ status })).toBe(false);
    expect(alreadyGone(new Error('network down'))).toBe(false);
  });
});
