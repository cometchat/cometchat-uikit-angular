/**
 * CometChatCardBubble Storybook Stories
 *
 * Renders persisted developer cards (`message.category === "card"`) through the
 * prebuilt `CometChatCardView` renderer, plus the single-line fallback shown when
 * the card payload is empty or missing.
 *
 * Card messages are mocked as plain objects exposing the getters the bubble
 * reads (`getCard`, `getFallbackText`, `getText`, `getId`) so the stories run
 * without SDK initialization.
 *
 * @module components/cometchat-card-bubble
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCardBubbleComponent } from './cometchat-card-bubble.component';
import { MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';
import { expect } from 'storybook/test';

// ============================================
// Mock Data
// ============================================

/** Builds a mock CardMessage exposing only the getters the bubble reads. */
function makeCardMessage(opts: {
  id?: number;
  card?: unknown;
  text?: string;
  fallbackText?: string;
}): CometChat.CardMessage {
  return {
    getId: () => opts.id ?? 1,
    getCard: () => opts.card,
    getText: () => opts.text ?? '',
    getFallbackText: () => opts.fallbackText ?? '',
  } as unknown as CometChat.CardMessage;
}

/** An order-status card: avatar row, text, divider and two action buttons. */
const ORDER_CARD = {
  version: '1.0',
  fallbackText: 'Your order #45821 has shipped',
  style: { borderRadius: 12, padding: 12 },
  body: [
    {
      id: 'header',
      type: 'row',
      gap: 8,
      items: [
        { id: 'avatar', type: 'avatar', imageUrl: MOCK_AVATARS.georgeAlan, size: 32 },
        { id: 'store', type: 'text', content: 'Sneaker Store', variant: 'heading4', fontWeight: 'bold' },
      ],
    },
    { id: 'spacer-1', type: 'spacer', height: 8 },
    { id: 'title', type: 'text', content: 'Your order #45821 has shipped', variant: 'body', fontWeight: 'medium' },
    { id: 'subtitle', type: 'text', content: 'Estimated delivery: Friday', variant: 'caption1' },
    { id: 'progress', type: 'progressBar', value: 60, label: 'In transit' },
    { id: 'divider', type: 'divider' },
    {
      id: 'actions',
      type: 'row',
      gap: 8,
      items: [
        {
          id: 'track',
          type: 'button',
          label: 'Track order',
          variant: 'filled',
          action: { type: 'openUrl', url: 'https://example.com/orders/45821' },
        },
        {
          id: 'copy',
          type: 'button',
          label: 'Copy order ID',
          variant: 'outlined',
          action: { type: 'copyToClipboard', value: '45821' },
        },
      ],
    },
  ],
};

/** A minimal text-only card. */
const SIMPLE_CARD = {
  version: '1.0',
  fallbackText: 'Welcome to the team!',
  body: [
    { id: 'title', type: 'text', content: 'Welcome to the team!', variant: 'heading3', fontWeight: 'bold' },
    { id: 'body', type: 'text', content: 'Tap below to finish setting up your profile.', variant: 'body' },
    {
      id: 'cta',
      type: 'button',
      label: 'Complete profile',
      variant: 'tonal',
      action: { type: 'customCallback', callbackId: 'complete-profile' },
    },
  ],
};

const orderCardMessage = makeCardMessage({ id: 101, card: ORDER_CARD });
const simpleCardMessage = makeCardMessage({ id: 102, card: SIMPLE_CARD });
const emptyCardMessage = makeCardMessage({
  id: 103,
  card: {},
  fallbackText: 'Your order #45821 has shipped',
});
const noFallbackMessage = makeCardMessage({ id: 104, card: null });

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatCardBubbleComponent> = {
  title: 'Components/Bubbles/Card Bubble',
  component: CometChatCardBubbleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatCardBubbleComponent],
    }),
  ],
  args: {
    themeMode: 'auto',
  },
  argTypes: {
    message: {
      control: false,
      description: 'The developer card message (CometChat.CardMessage) to render. Required.',
      table: { type: { summary: 'CometChat.CardMessage' }, category: 'Data' },
    },
    themeMode: {
      control: 'select',
      options: ['auto', 'light', 'dark'],
      description: 'Theme mode passed straight to the card renderer.',
      table: { type: { summary: "'auto' | 'light' | 'dark'" }, defaultValue: { summary: "'auto'" }, category: 'Appearance' },
    },
    themeOverride: {
      control: 'object',
      description: 'Optional renderer theme overrides.',
      table: { type: { summary: 'CometChatCardThemeOverride' }, category: 'Appearance' },
    },
    onCardAction: {
      action: 'onCardAction',
      description: 'Pure-forward of the raw renderer action (also published on CometChatMessageEvents.ccCardActionClicked).',
      table: { type: { summary: 'EventEmitter<CardBubbleAction>' }, category: 'Events' },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatCardBubble renders persisted developer cards (message category "card") via the CometChatCardView renderer. When the card payload is empty or invalid it shows a single-line fallback: getFallbackText() → getText() → "Card Message". Card actions are forwarded on the (onCardAction) output and the ccCardActionClicked event bus; the bubble implements no action behavior itself.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatCardBubbleComponent>;

/** Shared render: a bubble-width container around the card bubble. */
const renderCard = (message: CometChat.CardMessage): Story['render'] => (args) => ({
  props: { ...args, message },
  template: `
    <div style="width: 320px; background: var(--cometchat-background-color-01); border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-3); overflow: hidden;">
      <cometchat-card-bubble
        [message]="message"
        [themeMode]="themeMode"
        [themeOverride]="themeOverride"
        (onCardAction)="onCardAction($event)">
      </cometchat-card-bubble>
    </div>
  `,
});

// ============================================
// Stories
// ============================================

/** Default card bubble rendering an order-status developer card. */
export const Default: Story = {
  render: renderCard(orderCardMessage),
  parameters: {
    docs: {
      description: {
        story:
          'An order-status card with an avatar header, text, progress bar and two action buttons. Clicking a button logs the forwarded action in the Actions panel.',
      },
    },
  },
};

/** A minimal text-only card with a single call-to-action. */
export const SimpleCard: Story = {
  render: renderCard(simpleCardMessage),
  parameters: {
    docs: {
      description: {
        story: 'A minimal card with a title, body text and one custom-callback button.',
      },
    },
  },
};

/** Dark renderer theme. */
export const DarkTheme: Story = {
  args: { themeMode: 'dark' },
  render: renderCard(orderCardMessage),
  parameters: {
    docs: {
      description: {
        story: 'The same order card rendered with `themeMode` set to `dark`.',
      },
    },
  },
};

/** Fallback text shown when the card payload is empty. */
export const FallbackText: Story = {
  render: renderCard(emptyCardMessage),
  parameters: {
    docs: {
      description: {
        story:
          'When `getCard()` returns an empty payload, the bubble shows the message\'s fallback text instead of a card.',
      },
    },
  },
};

/** Default localized fallback when there is no card and no fallback text. */
export const NoFallbackText: Story = {
  render: renderCard(noFallbackMessage),
  parameters: {
    docs: {
      description: {
        story:
          'With no card payload, no fallback text and no message text, the bubble shows the localized "Card Message" label.',
      },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: an empty card payload renders the fallback text instead of the card view. */
export const TestFallbackRendersText: Story = {
  render: renderCard(emptyCardMessage),
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 500));
    const fallback = canvasElement.querySelector('.cometchat-card-bubble__fallback');
    expect(fallback).not.toBeNull();
    expect(fallback?.textContent).toContain('Your order #45821 has shipped');
    expect(canvasElement.querySelector('cometchat-card-view')).toBeNull();
  },
};

/** Test: a valid card payload renders the card view. */
export const TestCardRendersCardView: Story = {
  render: renderCard(orderCardMessage),
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 500));
    expect(canvasElement.querySelector('cometchat-card-view')).not.toBeNull();
    expect(canvasElement.querySelector('.cometchat-card-bubble__fallback')).toBeNull();
  },
};
