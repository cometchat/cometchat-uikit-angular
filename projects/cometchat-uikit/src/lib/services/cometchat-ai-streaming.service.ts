import { Injectable, NgZone, DestroyRef, inject } from '@angular/core';
import { Subject, BehaviorSubject, Observable, Subscription } from 'rxjs';
import { concatMap, delay, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantTools } from '../modals/CometChatAIAssistantTools';

/**
 * Represents a single processed AI stream event emitted on messageStream$.
 * streamedContent carries the accumulated text for text_message_content events.
 */
export interface IAIStreamEvent {
  message: CometChat.AIAssistantBaseEvent;
  streamedContent?: string;
  chatId: string;
  runId: string;
}

/**
 * CometChatAIStreamingService
 *
 * Mirrors the React stream-message.service pattern:
 * - Single global messageQueue processed via concatMap (sequential, no drops)
 * - Single messageStream$ Subject that all subscribers share
 * - Per-chatId streaming state via BehaviorSubject
 * - NgZone.run() wraps all incoming WebSocket events so OnPush CD fires
 */
@Injectable({ providedIn: 'root' })
export class CometChatAIStreamingService {
  private readonly _zone = inject(NgZone);
  private readonly _destroyRef = inject(DestroyRef);

  // ── Global queue & stream ────────────────────────────────────────────────
  private readonly _messageQueue = new Subject<{ event: CometChat.AIAssistantBaseEvent; chatId: string }>();
  private readonly _messageSubject = new Subject<IAIStreamEvent>();
  private _queueSubscription: Subscription | null = null;

  // ── Accumulated text per chatId+runId (for late-mounting bubbles) ────────
  private _accumulatedText = new Map<string, Map<string, string>>();

  // ── Per-chatId streaming state ───────────────────────────────────────────
  private _streamingSubjects = new Map<string, BehaviorSubject<boolean>>();
  private _signalCache = new Map<string, (() => boolean) & Observable<boolean>>();

  // ── Active runs per chatId ───────────────────────────────────────────────
  private _activeRuns = new Map<string, Set<string>>();

  // ── Stopped chatIds (ignore incoming events after explicit stop) ─────────
  private _stoppedChats = new Set<string>();

  // ── Tool call state ──────────────────────────────────────────────────────
  private _toolCallName = new Map<string, string>(); // keyed by runId
  private _toolCallArgs = new Map<string, string>(); // keyed by runId

  // ── Config ───────────────────────────────────────────────────────────────
  private _streamSpeedMs = 30;
  private _aiTools: CometChatAIAssistantTools | null = null;

  // ── Public API ────────────────────────────────────────────────────────────

  /** Observable that emits every processed IAIStreamEvent. */
  readonly messageStream$: Observable<IAIStreamEvent> = this._messageSubject.asObservable();

  constructor() {
    this._initQueue();
    // Clean up all streaming subjects and queue subscription when service is destroyed
    this._destroyRef.onDestroy(() => this._cleanupAll());
  }

  /** Returns a stable callable+Observable for the given chatId's streaming state. */
  isStreamingFor(chatId: string): (() => boolean) & Observable<boolean> {
    if (this._signalCache.has(chatId)) {
      return this._signalCache.get(chatId)!;
    }
    const subject = this._getOrCreateStreamingSubject(chatId);
    const obs = subject.asObservable();
    // Create a callable that also acts as an Observable for backward compatibility
    const signalLike = (() => subject.getValue()) as (() => boolean) & Observable<boolean>;
    // Copy Observable methods onto the callable
    signalLike.subscribe = obs.subscribe.bind(obs);
    signalLike.pipe = obs.pipe.bind(obs);
    (signalLike as any).forEach = (obs as any).forEach?.bind(obs);
    (signalLike as any)[Symbol.observable] = () => obs;
    this._signalCache.set(chatId, signalLike);
    return signalLike;
  }

  /** Snapshot: is the given chatId currently streaming? */
  isStreamingSnapshot(chatId: string): boolean {
    return this._getOrCreateStreamingSubject(chatId).getValue();
  }

  /** Returns true if any chatId is currently streaming. */
  isAnyStreaming(): boolean {
    for (const subject of this._streamingSubjects.values()) {
      if (subject.getValue()) return true;
    }
    return false;
  }

  /** Returns accumulated text for a chatId+runId (for late-mounting bubbles). */
  getAccumulatedText(chatId: string, runId: string): string {
    return this._accumulatedText.get(chatId)?.get(runId) ?? '';
  }

  /**
   * Routes an incoming WebSocket event into the processing queue.
   * Wraps in NgZone.run() so signal/state updates trigger OnPush CD.
   */
  handleWebsocketMessage(event: CometChat.AIAssistantBaseEvent, chatId: string): void {
    this._zone.run(() => {
      this._messageQueue.next({ event, chatId });
    });
  }

  /** Prepares for a new streaming session: resets state and marks streaming=true. */
  startStreamingMessage(chatId: string): void {
    this._stoppedChats.delete(chatId);
    this._accumulatedText.delete(chatId);
    this._initQueue();
    this._getOrCreateStreamingSubject(chatId).next(true);
  }

  /** Stops streaming for a chatId and cleans up state. */
  stopStreamingMessage(chatId: string): void {
    this._stoppedChats.add(chatId);
    this._getOrCreateStreamingSubject(chatId).next(false);
    this._accumulatedText.delete(chatId);
    this._activeRuns.delete(chatId);
  }

  setStreamSpeed(ms: number): void {
    this._streamSpeedMs = ms;
  }

  setAIAssistantTools(tools: CometChatAIAssistantTools): void {
    this._aiTools = tools;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _initQueue(): void {
    if (this._queueSubscription) {
      this._queueSubscription.unsubscribe();
    }

    this._queueSubscription = this._messageQueue.pipe(
      concatMap(({ event, chatId }) => {
        const type = event.getType();
        let delayMs = 0;

        if (type === 'text_message_content') {
          delayMs = this._streamSpeedMs;
        } else if (type === 'tool_call_args') {
          delayMs = 0;
        }

        if (delayMs === 0) {
          // Process synchronously when no delay needed
          this._processEvent(event, chatId);
          return of(null);
        }

        return of({ event, chatId }).pipe(
          delay(delayMs),
          tap(({ event, chatId }) => this._processEvent(event, chatId))
        );
      })
    ).subscribe();
  }

  private _processEvent(event: CometChat.AIAssistantBaseEvent, chatId: string): void {
    // Ignore events for chats that have been explicitly stopped
    if (this._stoppedChats.has(chatId)) return;

    const type = event.getType();
    const runId = event.getMessageId();

    // Ensure accumulated text map exists
    if (!this._accumulatedText.has(chatId)) {
      this._accumulatedText.set(chatId, new Map());
    }
    const accText = this._accumulatedText.get(chatId)!;

    switch (type) {
      case 'run_started': {
        accText.set(runId, '');
        // Track this run as active
        if (!this._activeRuns.has(chatId)) {
          this._activeRuns.set(chatId, new Set());
        }
        this._activeRuns.get(chatId)!.add(runId);
        this._messageSubject.next({ message: event, chatId, runId });
        break;
      }

      case 'text_message_start': {
        accText.set(runId, '');
        this._messageSubject.next({ message: event, chatId, runId });
        break;
      }

      case 'text_message_content': {
        const contentEvent = event as CometChat.AIAssistantContentReceivedEvent;
        const delta = contentEvent.getDelta?.() ?? '';
        const prev = accText.get(runId) ?? '';
        const accumulated = prev + delta;
        accText.set(runId, accumulated);
        this._messageSubject.next({ message: event, streamedContent: accumulated, chatId, runId });
        break;
      }

      case 'text_message_end': {
        this._messageSubject.next({
          message: event,
          streamedContent: accText.get(runId) ?? '',
          chatId,
          runId,
        });
        break;
      }

      case 'tool_call_start': {
        this._toolCallName.set(runId, (event as CometChat.AIAssistantToolStartedEvent).getToolCallName?.() ?? '');
        this._toolCallArgs.set(runId, '');
        this._messageSubject.next({ message: event, chatId, runId });
        break;
      }

      case 'tool_call_args': {
        const delta = (event as CometChat.AIAssistantToolArgumentEvent).getDelta?.() ?? '';
        this._toolCallArgs.set(runId, (this._toolCallArgs.get(runId) ?? '') + delta);
        this._messageSubject.next({ message: event, chatId, runId });
        break;
      }

      case 'tool_call_end': {
        const toolName = this._toolCallName.get(runId);
        const rawArgs = this._toolCallArgs.get(runId) ?? '';
        if (toolName && this._aiTools) {
          const handler = this._aiTools.getAction(toolName);
          if (handler) {
            try { handler(JSON.parse(rawArgs)); } catch { /* malformed JSON */ }
          }
        }
        this._messageSubject.next({ message: event, chatId, runId });
        break;
      }

      case 'run_finished': {
        this._messageSubject.next({
          message: event,
          streamedContent: accText.get(runId) ?? '',
          chatId,
          runId,
        });
        // Remove this run from active set
        const activeRunsForChat = this._activeRuns.get(chatId);
        if (activeRunsForChat) {
          activeRunsForChat.delete(runId);
        }
        accText.delete(runId);
        this._toolCallName.delete(runId);
        this._toolCallArgs.delete(runId);
        // Only set streaming to false if no more active runs
        if (!activeRunsForChat || activeRunsForChat.size === 0) {
          const streamingSubject = this._streamingSubjects.get(chatId);
          if (streamingSubject) {
            streamingSubject.next(false);
          }
          this._activeRuns.delete(chatId);
        }
        break;
      }

      default: {
        this._messageSubject.next({ message: event, chatId, runId });
        break;
      }
    }
  }

  private _getOrCreateStreamingSubject(chatId: string): BehaviorSubject<boolean> {
    if (!this._streamingSubjects.has(chatId)) {
      this._streamingSubjects.set(chatId, new BehaviorSubject<boolean>(false));
    }
    return this._streamingSubjects.get(chatId)!;
  }

  /**
   * Completes and removes the BehaviorSubject for a given chatId from the Map.
   * Called after streaming ends to prevent the Map from growing unbounded
   * across long sessions with many chat IDs.
   */
  private _cleanupStreamingSubject(chatId: string): void {
    const subject = this._streamingSubjects.get(chatId);
    if (subject) {
      subject.complete();
      this._streamingSubjects.delete(chatId);
    }
    this._signalCache.delete(chatId);
  }

  /**
   * Completes and removes all streaming subjects and tears down the queue
   * subscription. Called by DestroyRef when the service is destroyed.
   */
  private _cleanupAll(): void {
    this._queueSubscription?.unsubscribe();
    this._queueSubscription = null;
    this._streamingSubjects.forEach((subject) => subject.complete());
    this._streamingSubjects.clear();
    this._signalCache.clear();
    this._activeRuns.clear();
    this._accumulatedText.clear();
    this._toolCallName.clear();
    this._toolCallArgs.clear();
    this._messageSubject.complete();
    this._messageQueue.complete();
  }
}
