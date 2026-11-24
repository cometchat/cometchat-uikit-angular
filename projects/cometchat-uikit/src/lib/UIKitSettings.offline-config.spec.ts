/**
 * `CometChatOfflineConfig` is a typed set of options, as Android's `OfflineConfig` is: a typo such
 * as `{ enable: true }` is a compile error instead of silently leaving offline support off.
 * Also guards that the public API names the send-state type that `ccMessageSendStateChanged` carries.
 */
import { describe, expect, it } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import ts from 'typescript';

const LIB = __dirname;
const VIRTUAL = path.join(LIB, '__offline_config_probe__.ts');

/** Type errors of `source` compiled next to UIKitSettings.ts (the real type, the real SDK types). */
function diagnosticsOf(source: string): string[] {
  const options: ts.CompilerOptions = {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const readFile = host.readFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  host.readFile = f => (f === VIRTUAL ? source : readFile(f));
  host.fileExists = f => f === VIRTUAL || fileExists(f);
  const program = ts.createProgram([VIRTUAL], options, host);
  return ts
    .getPreEmitDiagnostics(program, program.getSourceFile(VIRTUAL))
    .map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

const IMPORT = `import { CometChatOfflineConfig } from './UIKitSettings';\n`;

describe('CometChatOfflineConfig is typed', () => {
  it('a misspelled option does not compile', () => {
    const errors = diagnosticsOf(
      `${IMPORT}export const c: CometChatOfflineConfig = { enable: true };`
    );
    expect(errors.join('\n')).toMatch(/enable/);
  });

  it('every option the SDK knows still compiles', () => {
    const errors = diagnosticsOf(
      `${IMPORT}export const c: CometChatOfflineConfig = {
        enabled: true, cacheDurationDays: 1, maxStorageSize: 1, maxMessagesPerConversation: 1,
        maxConversations: 1, maxPendingMessages: 1, autoSendPendingOnReconnect: true,
        pendingQueueOverflowPolicy: 'DISCARD_OLDEST', mediaCaching: 'AUTO', maxMediaCacheSize: 1,
        maxSnapshotQueries: 1, snapshotTtlDays: 1, encryption: false,
        encryptionFailureBehavior: 'FAIL', debugTracing: true,
      };`
    );
    expect(errors).toEqual([]);
  });
});

describe('public API', () => {
  it('exports the send-state type of ccMessageSendStateChanged', () => {
    const source = fs.readFileSync(path.join(LIB, '..', 'public-api.ts'), 'utf8');
    expect(source).toMatch(
      /export type \{[^}]*\bMessageSendState\b[^}]*\} from '\.\/lib\/events\/CometChatMessageEvents'/
    );
  });
});
