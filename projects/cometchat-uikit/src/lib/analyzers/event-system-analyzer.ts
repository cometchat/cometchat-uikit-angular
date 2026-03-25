/**
 * Event System Usage Analyzer
 * Audits subscriptions to CometChat static event buses and verifies cleanup.
 */
import * as fs from 'fs';
import * as path from 'path';
import { EventSystemReport, EventSubscriptionEntry } from './types';

const EVENT_BUSES = [
  'CometChatMessageEvents',
  'CometChatUIEvents',
  'CometChatGroupEvents',
  'CometChatCallEvents',
  'CometChatConversationEvents',
  'CometChatUserEvents',
];

function scanDir(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...scanDir(full));
    else if (entry.isFile() && entry.name.endsWith('.component.ts') && !entry.name.endsWith('.spec.ts')) {
      results.push(full);
    }
  }
  return results;
}

function extractComponentName(content: string, filePath: string): string {
  const match = content.match(/export\s+class\s+(\w+)/);
  return match ? match[1] : path.basename(filePath, '.ts');
}

export function analyzeEventSystem(libRoot: string): EventSystemReport {
  const subscriptions: EventSubscriptionEntry[] = [];
  const componentsDir = path.join(libRoot, 'components');
  const files = scanDir(componentsDir);

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8');
    const componentName = extractComponentName(content, f);
    const hasNgOnDestroy = content.includes('ngOnDestroy');

    for (const bus of EVENT_BUSES) {
      // Match patterns like CometChatMessageEvents.ccMessageSent.subscribe(
      // or CometChatMessageEvents.on('messageSent', ...)
      const subRegex = new RegExp(`${bus}\\.(\\w+)\\.subscribe\\s*\\(`, 'g');
      const onRegex = new RegExp(`${bus}\\.on\\s*\\(\\s*['"]([\\w]+)['"]`, 'g');

      let match: RegExpExecArray | null;

      while ((match = subRegex.exec(content)) !== null) {
        const eventName = match[1];
        const unsubPattern = new RegExp(`${bus}\\.${eventName}\\.unsubscribe|${bus}\\.${eventName}\\s*=\\s*null`);
        const hasUnsubscribe = hasNgOnDestroy && (unsubPattern.test(content) || content.includes('takeUntilDestroyed'));
        const hasContextFilter = /conversationId|userId|groupId|guid|uid/.test(content);

        subscriptions.push({
          componentName,
          eventBus: bus,
          eventName,
          hasUnsubscribe,
          hasContextFilter,
          purpose: `Subscribes to ${bus}.${eventName}`,
        });
      }

      while ((match = onRegex.exec(content)) !== null) {
        const eventName = match[1];
        const offPattern = new RegExp(`${bus}\\.off\\s*\\(\\s*['"]${eventName}['"]`);
        const hasUnsubscribe = hasNgOnDestroy && (offPattern.test(content) || content.includes('takeUntilDestroyed'));
        const hasContextFilter = /conversationId|userId|groupId|guid|uid/.test(content);

        subscriptions.push({
          componentName,
          eventBus: bus,
          eventName,
          hasUnsubscribe,
          hasContextFilter,
          purpose: `Listens to ${bus} '${eventName}' event`,
        });
      }
    }
  }

  const byEventBus: Record<string, number> = {};
  let missingUnsubscribe = 0;
  let missingContextFilter = 0;
  for (const s of subscriptions) {
    byEventBus[s.eventBus] = (byEventBus[s.eventBus] || 0) + 1;
    if (!s.hasUnsubscribe) missingUnsubscribe++;
    if (!s.hasContextFilter) missingContextFilter++;
  }

  return {
    subscriptions,
    summary: {
      totalSubscriptions: subscriptions.length,
      missingUnsubscribe,
      missingContextFilter,
      byEventBus,
    },
  };
}
