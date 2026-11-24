#!/usr/bin/env node
// CI 5 (A1): commit the staged public copy to cometchat/cometchat-uikit-angular as the release bot,
// through GitHub's createCommitOnBranch mutation, then tag it. iOS and Android do the same
// (.github/scripts/mirror-commit.py in uikit-ios and uikit-android).
//
//   node scripts/release/mirror-commit.mjs <workdir> <owner/repo> <branch> <tag> [--plan]
//
// <workdir> is a clone of <branch> whose files have been replaced by the staged copy. GH_TOKEN
// must be able to write to <owner/repo>. COMMIT_BODY, if set, is the body of the release commit's
// message (the package digest, A3). --plan prints what would be committed and writes nothing (no
// token needed).
//
// Why the mutation, not `git push`: GitHub builds the commit itself, so it is signed and shows as
// Verified, authored by the bot. A commit made on the runner is never verified, whichever token
// pushes it. expectedHeadOid also makes the write fail if <branch> moved after the clone, instead
// of overwriting someone else's commit.
//
// Batches (as Android): the mutation carries every file inline and GitHub creates each one in the
// same request. Android's 1,428-file release timed out (HTTP 504) where 296 files went through, so
// a change set is split into commits of at most MAX_BATCH_FILES files (default 300) and
// MAX_BATCH_MB of base64 (default 20). One batch commits straight onto <branch>. Several are
// stacked on a throwaway branch, mirror-staging/<tag>, and <branch> then moves to the last one in
// one fast-forward, so the public branch never shows half a release and every commit is Verified.
//
// What the mutation can't carry falls back to a plain push (outputs oversized=true; the workflow
// pushes): a single file over MAX_BATCH_MB, a symlink or a submodule. It also can't set file modes:
// a file already in the public repo keeps its mode, a new file arrives as non-executable. That is
// reported as a warning, as iOS and Android accept it; the public workflows run scripts with bash.
// A file whose only difference is its mode is left out of the commit: the commit couldn't change
// it, so every later run would see the same difference and make an empty commit.
//
// The tag, checked before anything is written: if it exists, it must already point at <branch>'s
// head with nothing left to commit (a re-run), or the run stops with nothing written. Otherwise it
// is created on the release commit. A published tag is never moved.
//
// Writes committed, oversized, reason, oid, verified, files, batches to $GITHUB_OUTPUT.
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const REGULAR = '100644';
const EXECUTABLE = '100755';
const SYMLINK = '120000';
const SUBMODULE = '160000';
const MB = 1024 * 1024;

/**
 * Parses `git diff --cached --raw --no-abbrev --no-renames -z HEAD`.
 * @param {string} raw
 * @returns {{status: string, oldMode: string, newMode: string, oldBlob: string, newBlob: string, path: string}[]}
 */
export function parseRawDiff(raw) {
  const tokens = raw.split('\0');
  const entries = [];
  for (let i = 0; i + 1 < tokens.length; i += 2) {
    const meta = tokens[i];
    if (!meta.startsWith(':')) break;
    const [oldMode, newMode, oldBlob, newBlob, status] = meta.slice(1).split(' ');
    entries.push({ status: status[0], oldMode, newMode, oldBlob, newBlob, path: tokens[i + 1] });
  }
  return entries;
}

/**
 * Sorts a change set into what the mutation adds and deletes, what it can't express, and the
 * file-mode changes it will drop.
 * @param {ReturnType<typeof parseRawDiff>} entries
 */
export function classifyChanges(entries) {
  const additions = [];
  const deletions = [];
  const unsupported = [];
  const modeWarnings = [];
  for (const { status, oldMode, newMode, oldBlob, newBlob, path } of entries) {
    if (status === 'D') {
      deletions.push(path);
      continue;
    }
    if ([SYMLINK, SUBMODULE].includes(newMode) || [SYMLINK, SUBMODULE].includes(oldMode)) {
      unsupported.push(`${path} (${newMode === SUBMODULE || oldMode === SUBMODULE ? 'submodule' : 'symlink'})`);
      continue;
    }
    if (status === 'M' && oldBlob === newBlob) {
      // Same contents, different mode: nothing a signed commit can change, so nothing to commit.
      modeWarnings.push(`${path}: stays ${oldMode} in the public repo (the release has ${newMode})`);
      continue;
    }
    additions.push(path);
    if (status === 'A' && newMode === EXECUTABLE) {
      modeWarnings.push(`${path}: new and executable, arrives as a regular file`);
    } else if (status !== 'A' && oldMode !== newMode) {
      modeWarnings.push(`${path}: stays ${oldMode} in the public repo (the release has ${newMode})`);
    }
  }
  return { additions, deletions, unsupported, modeWarnings };
}

/** Length of `bytes` bytes once base64-encoded. */
export const base64Size = (bytes) => Math.ceil(bytes / 3) * 4;

/**
 * Splits additions into batches of at most maxFiles files and maxBytes of base64. A file that is
 * alone over maxBytes can't be split, so the plan is oversized.
 * @param {string[]} additions
 * @param {Record<string, number>} sizes base64 size of each addition
 * @returns {{batches: string[][]} | {oversized: string}}
 */
export function planBatches(additions, sizes, { maxFiles = 300, maxBytes = 20 * MB } = {}) {
  const tooBig = additions.find((p) => sizes[p] > maxBytes);
  if (tooBig) return { oversized: `${tooBig} is ${(sizes[tooBig] / MB).toFixed(1)} MB as base64, over the ${maxBytes / MB} MB a commit can carry` };
  const batches = [];
  let current = [];
  let bytes = 0;
  for (const p of additions) {
    if (current.length && (current.length >= maxFiles || bytes + sizes[p] > maxBytes)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(p);
    bytes += sizes[p];
  }
  if (current.length) batches.push(current);
  return { batches };
}

/** A REST/GraphQL client for api.github.com; `allow` lists statuses returned as null. */
export function githubClient(token, base = 'https://api.github.com') {
  return async function api(path, { method = 'GET', body, allow = [] } = {}) {
    const url = path === 'graphql' ? `${base}/graphql` : `${base}/${path}`;
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(300_000),
      });
    } catch (err) {
      throw new Error(`${method} ${url}: network error: ${err.message}`);
    }
    if (allow.includes(res.status)) return null;
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${url} -> HTTP ${res.status}: ${text.slice(0, 500)}`);
    const data = text ? JSON.parse(text) : {};
    if (path === 'graphql' && data.errors) throw new Error(`GraphQL: ${JSON.stringify(data.errors).slice(0, 600)}`);
    return data;
  };
}

const COMMIT_MUTATION = 'mutation($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid } } }';

/**
 * Commits the change set and tags it. Every side effect goes through `api` (GitHub) and `readFile`
 * (the working tree), so the whole flow is testable.
 * @returns {Promise<{committed: boolean, oversized: boolean, reason?: string, oid?: string, verified?: boolean, batches: number}>}
 */
export async function mirror({ api, log, warn, readFile, repo, branch, tag, head, additions, deletions, batches, messageBody }) {
  // messageBody goes on the commit the tag points at: the only commit, or the last batch.
  const commit = async (onto, expectedHeadOid, headline, adds, dels, last = true) => {
    const data = await api('graphql', {
      method: 'POST',
      body: {
        query: COMMIT_MUTATION,
        variables: {
          input: {
            branch: { repositoryNameWithOwner: repo, branchName: onto },
            expectedHeadOid,
            message: messageBody && last ? { headline, body: messageBody } : { headline },
            fileChanges: {
              additions: adds.map((path) => ({ path, contents: readFile(path).toString('base64') })),
              deletions: dels.map((path) => ({ path })),
            },
          },
        },
      },
    });
    return data.data.createCommitOnBranch.commit.oid;
  };

  let oid = head;
  const committed = additions.length + deletions.length > 0;
  // Before any write: an existing tag can only be this release's if <branch> already holds the
  // release (nothing to commit) and the tag points at its head. Anything else stops here, so
  // <branch> never moves for a release that can't be tagged.
  const tagged = await tagTarget({ api, repo, tag });
  if (tagged && (committed || tagged !== head)) {
    const why = committed ? `and ${branch} at ${head.slice(0, 9)} doesn't hold this release` : `not ${branch}'s head ${head.slice(0, 9)}`;
    throw new Error(`${tag} already exists in ${repo} at ${tagged.slice(0, 9)}, ${why}. Nothing was written. A published tag is never moved: bump the version and release again.`);
  }
  if (!committed) {
    log(`Nothing to commit: ${repo}@${branch} already holds this release at ${head.slice(0, 9)}.`);
  } else if (batches.length <= 1) {
    oid = await commit(branch, head, `Release ${tag}`, batches[0] ?? [], deletions);
    log(`Committed ${oid.slice(0, 9)} on ${repo}@${branch}`);
  } else {
    const staging = `mirror-staging/${tag}`;
    // Left by a run that failed part-way; it is a throwaway.
    if (await api(`repos/${repo}/git/ref/heads/${staging}`, { allow: [404] })) {
      log(`Removing ${staging}, left by an earlier run`);
      await api(`repos/${repo}/git/refs/heads/${staging}`, { method: 'DELETE' });
    }
    await api(`repos/${repo}/git/refs`, { method: 'POST', body: { ref: `refs/heads/${staging}`, sha: head } });
    for (const [i, batch] of batches.entries()) {
      const n = i + 1;
      const headline = n === batches.length ? `Release ${tag}` : `Release ${tag} (${n}/${batches.length})`;
      oid = await commit(staging, oid, headline, batch, n === 1 ? deletions : [], n === batches.length);
      log(`  batch ${n}/${batches.length}: ${batch.length} files${n === 1 && deletions.length ? ` and ${deletions.length} deletions` : ''} -> ${oid.slice(0, 9)}`);
    }
    // force: false only allows a fast-forward: if <branch> moved meanwhile, nothing changes on it.
    try {
      await api(`repos/${repo}/git/refs/heads/${branch}`, { method: 'PATCH', body: { sha: oid, force: false } });
    } catch (err) {
      throw new Error(
        `${err.message}\nCould not fast-forward ${branch} to ${oid.slice(0, 9)}; ${branch} is unchanged and the signed commits are on ${staging}. ` +
          `If ${branch} moved, re-run the job; if branch protection refused it, let the release bot update ${branch}, then re-run.`
      );
    }
    log(`Fast-forwarded ${repo}@${branch} to ${oid.slice(0, 9)} (${batches.length} commits)`);
    await api(`repos/${repo}/git/refs/heads/${staging}`, { method: 'DELETE', allow: [404, 422] });
  }

  await ensureTag({ api, log, repo, tag, oid });

  let verified;
  if (committed) {
    verified = (await api(`repos/${repo}/commits/${oid}`)).commit.verification.verified;
    if (!verified) warn('Unsigned release commit', `${oid.slice(0, 9)} on ${repo}@${branch} is not Verified; the release bot should produce signed commits.`);
  }
  return { committed, oversized: false, oid, verified, batches: committed ? Math.max(batches.length, 1) : 0 };
}

/** The commit <tag> points at in <repo>, following an annotated tag, or null if there is no tag. */
export async function tagTarget({ api, repo, tag }) {
  const ref = await api(`repos/${repo}/git/ref/tags/${tag}`, { allow: [404] });
  if (!ref) return null;
  if (ref.object.type !== 'tag') return ref.object.sha;
  return (await api(`repos/${repo}/git/tags/${ref.object.sha}`)).object.sha; // annotated tag
}

/** Creates <tag> on oid, accepts it if it is already there, and refuses to move it. */
export async function ensureTag({ api, log, repo, tag, oid }) {
  const target = () => tagTarget({ api, repo, tag });
  let existing = await target();
  if (!existing) {
    const created = await api(`repos/${repo}/git/refs`, { method: 'POST', body: { ref: `refs/tags/${tag}`, sha: oid }, allow: [422] });
    if (created) {
      log(`Created tag ${tag} on ${oid.slice(0, 9)}`);
      return;
    }
    existing = await target(); // 422: created meanwhile
    if (!existing) throw new Error(`Could not create tag ${tag} on ${oid.slice(0, 9)} in ${repo} (HTTP 422)`);
  }
  if (existing !== oid) {
    throw new Error(`${tag} already exists in ${repo} at ${existing?.slice(0, 9)}, not the release commit ${oid.slice(0, 9)}. A published tag is never moved: bump the version and release again.`);
  }
  log(`${tag} already points at ${oid.slice(0, 9)}`);
}

async function main() {
  const args = process.argv.slice(2);
  const planOnly = args.includes('--plan');
  const [workdir, repo, branch, tag] = args.filter((a) => a !== '--plan');
  if (!workdir || !repo || !branch || !tag) {
    console.error('usage: mirror-commit.mjs <workdir> <owner/repo> <branch> <tag> [--plan]');
    process.exit(2);
  }
  const output = (values) => {
    const lines = Object.entries(values).map(([k, v]) => `${k}=${v ?? ''}`);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, lines.join('\n') + '\n');
    console.log(lines.join(' '));
  };
  const summary = (text) => process.env.GITHUB_STEP_SUMMARY && appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
  const warn = (title, msg) => console.log(`::warning title=${title}::${msg}`);
  const git = (...a) => execFileSync('git', ['-C', workdir, ...a], { encoding: 'utf8', maxBuffer: 256 * MB });

  git('add', '-A');
  const head = git('rev-parse', 'HEAD').trim();
  const { additions, deletions, unsupported, modeWarnings } = classifyChanges(parseRawDiff(git('diff', '--cached', '--raw', '--no-abbrev', '--no-renames', '-z', 'HEAD')));
  const sizes = Object.fromEntries(additions.map((p) => [p, base64Size(statSync(join(workdir, p)).size)]));
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  console.log(`${repo}@${branch} at ${head.slice(0, 9)}: ${additions.length} added or changed, ${deletions.length} deleted, ~${(total / MB).toFixed(1)} MB as base64`);

  if (modeWarnings.length) {
    warn(`${modeWarnings.length} file mode(s) not carried`, `A signed commit can't set file modes: ${modeWarnings.join('; ')}`);
    summary(`### File modes the signed commit doesn't carry\n${modeWarnings.map((w) => `- ${w}`).join('\n')}\n`);
  }

  const plan = unsupported.length
    ? { oversized: `a signed commit can't hold ${unsupported.join(', ')}` }
    : planBatches(additions, sizes, {
        maxFiles: Number(process.env.MAX_BATCH_FILES || 300),
        maxBytes: Number(process.env.MAX_BATCH_MB || 20) * MB,
      });
  const files = additions.length + deletions.length;
  if ('oversized' in plan) {
    warn('Release pushed unsigned', `${plan.oversized}. Falling back to a plain push; the release commit won't show as Verified.`);
    output({ committed: 'false', oversized: 'true', reason: plan.oversized, files });
    return;
  }
  console.log(`Plan: ${files ? `${Math.max(plan.batches.length, 1)} signed commit(s)${plan.batches.length > 1 ? ' on a staging branch, then one fast-forward' : ''}` : 'no commit'}, then tag ${tag}`);
  if (planOnly) {
    plan.batches.forEach((b, i) => console.log(`  batch ${i + 1}: ${b.length} files${i === 0 && deletions.length ? ` and ${deletions.length} deletions` : ''}`));
    return;
  }

  if (!process.env.GH_TOKEN) throw new Error('GH_TOKEN is not set');
  const result = await mirror({
    api: githubClient(process.env.GH_TOKEN),
    log: (m) => console.log(m),
    warn,
    readFile: (p) => readFileSync(join(workdir, p)),
    repo,
    branch,
    tag,
    head,
    additions,
    deletions,
    batches: plan.batches,
    messageBody: process.env.COMMIT_BODY,
  });
  summary(
    `### Public commit\n${result.committed ? `${result.batches} signed commit(s), ${files} files; ` : 'No file changes; '}` +
      `${tag} on [\`${result.oid.slice(0, 9)}\`](https://github.com/${repo}/commit/${result.oid})${result.committed ? `, Verified: ${result.verified}` : ''}\n`
  );
  output({ committed: String(result.committed), oversized: 'false', oid: result.oid, verified: String(result.verified ?? ''), files, batches: result.batches });
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().catch((err) => {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  });
}
