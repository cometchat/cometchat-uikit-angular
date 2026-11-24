import type { ConnectionStateService } from '../services/connection-state.service';

/**
 * Reports the connection going up or down the way the SDK's connection listener does.
 *
 * ConnectionStateService takes a reconnect from the SDK events (a connect that follows a
 * disconnect), not from its `connected` signal, so a spec that only sets the signal never
 * reaches `reconnected$`. This sets the signal and replays the same bookkeeping the listener
 * does, so the spec stays in step with the service.
 */
export function setConnection(connection: ConnectionStateService, connected: boolean): void {
  const service = connection as unknown as {
    _connected: { set(value: boolean): void };
    disconnectedSinceConnect: boolean;
    reconnects: { next(value: boolean): void };
    connects: { next(): void };
  };
  service._connected.set(connected);
  if (!connected) {
    service.disconnectedSinceConnect = true;
    return;
  }
  if (service.disconnectedSinceConnect) {
    service.disconnectedSinceConnect = false;
    service.reconnects.next(true);
  }
  // Every connect reaches `connects$`, whether or not it changed the state and whether or not a
  // disconnect was reported before it. A spec that drove a connect over an unchanged `true` and
  // expected nothing to happen was passing on the state not changing, which is the bug.
  service.connects.next();
}
