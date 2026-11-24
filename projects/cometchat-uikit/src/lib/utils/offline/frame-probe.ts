/**
 * Frame probe (offline TEST-PLAN §3.3): on debug/source builds, the sample app
 * installs `globalThis.__ccFrameProbe`, and the message list hands it the row
 * list `[{key, id, state}]` after each render that changed it. The conformance
 * runners use the log for "never, not even for a moment" assertions.
 *
 * Nothing installs the probe in a published build, so this is one `typeof`
 * check per render there.
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { contractMessageState, contractServerId } from '../state-contract';

export interface FrameProbeRow {
  key: string;
  id: string;
  state: string;
}

type FrameProbe = (surface: string, rows: FrameProbeRow[]) => void;

function installedProbe(): FrameProbe | null {
  const probe = (globalThis as { __ccFrameProbe?: unknown }).__ccFrameProbe;
  return typeof probe === 'function' ? (probe as FrameProbe) : null;
}

/** Reports a surface's rows to the probe when they differ from the last report. */
export class FrameProbeReporter {
  private last = '';

  constructor(private readonly surface: string) {}

  /** `keyOf` gives the key the row renders with, so a frame row and its DOM row carry one key. */
  report(
    messages: readonly CometChat.BaseMessage[],
    keyOf: () => (message: CometChat.BaseMessage) => string
  ): void {
    const probe = installedProbe();
    if (!probe) return;
    const key = keyOf();
    const rows = messages.map(m => ({
      key: key(m),
      id: contractServerId(m),
      state: contractMessageState(m),
    }));
    const signature = JSON.stringify(rows);
    if (signature === this.last) return;
    this.last = signature;
    try {
      probe(this.surface, rows);
    } catch {
      /* a probe never breaks the list */
    }
  }
}
