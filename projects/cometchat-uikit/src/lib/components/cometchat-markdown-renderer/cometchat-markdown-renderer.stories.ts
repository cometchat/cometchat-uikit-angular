/**
 * CometChatMarkdownRenderer Storybook Stories
 *
 * Renders markdown content as sanitized HTML with support for headings, lists,
 * code blocks (with copy button), tables, links, images, and inline formatting.
 *
 * @module components/cometchat-markdown-renderer
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatMarkdownRenderer } from './cometchat-markdown-renderer.component';
import { MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';
import { within, expect } from '@storybook/test';

const meta: Meta<CometChatMarkdownRenderer> = {
  title: 'Components/AI/Markdown Renderer',
  component: CometChatMarkdownRenderer,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    text: 'Hello, **world**!',
    streaming: false,
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'Markdown text to render as sanitized HTML',
      table: { type: { summary: 'string' }, category: 'Primary Inputs' },
    },
    streaming: {
      control: 'boolean',
      description: 'When true, enables streaming mode (partial markdown parsing)',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Primary Inputs' },
    },
    imageClick: { action: 'imageClick', table: { category: 'Events' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatMarkdownRenderer parses and renders markdown content as sanitized HTML. Supports headings, bold/italic/strikethrough, inline code, code blocks with copy button, blockquotes, ordered/unordered lists, links, images, horizontal rules, tables, and line breaks.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatMarkdownRenderer>;

// ── Stories ───────────────────────────────────────────────────────────────────

/** Default simple markdown. */
export const Default: Story = {
  args: {
    text: 'Hello, **world**! This is a *markdown* renderer.',
  },
};

/** Headings at all levels. */
export const Headings: Story = {
  args: {
    text: `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6`,
  },
  parameters: {
    docs: { description: { story: 'All heading levels rendered.' } },
  },
};

/** Inline formatting: bold, italic, strikethrough, inline code. */
export const InlineFormatting: Story = {
  args: {
    text: `This text has **bold**, *italic*, ~~strikethrough~~, and \`inline code\` formatting.

You can also combine: **bold and *italic* together**.`,
  },
  parameters: {
    docs: { description: { story: 'Inline formatting: bold, italic, strikethrough, and inline code.' } },
  },
};

/** Code block with syntax highlighting label and copy button. */
export const CodeBlock: Story = {
  args: {
    text: `Here is a TypeScript example:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

And a plain code block:

\`\`\`
npm install @cometchat/chat-sdk-javascript
\`\`\``,
  },
  parameters: {
    docs: { description: { story: 'Code blocks with language label and copy-to-clipboard button.' } },
  },
};

/** Ordered and unordered lists. */
export const Lists: Story = {
  args: {
    text: `**Unordered list:**
- Item one
- Item two
- Item three

**Ordered list:**
1. First step
2. Second step
3. Third step`,
  },
  parameters: {
    docs: { description: { story: 'Ordered and unordered lists.' } },
  },
};

/** Blockquote. */
export const Blockquote: Story = {
  args: {
    text: `> This is a blockquote. It can span multiple lines and is typically used to highlight important information or quotes from other sources.

Regular paragraph after the blockquote.`,
  },
  parameters: {
    docs: { description: { story: 'Blockquote rendering.' } },
  },
};

/** Table. */
export const Table: Story = {
  args: {
    text: `| Feature | Status | Notes |
|---------|--------|-------|
| Text messages | ✅ Done | Full formatting support |
| Image messages | ✅ Done | Multi-image grid |
| Audio messages | ✅ Done | Waveform visualization |
| Video messages | ✅ Done | Thumbnail + fullscreen |
| Poll messages | ✅ Done | Real-time voting |`,
  },
  parameters: {
    docs: { description: { story: 'Markdown table rendering.' } },
  },
};

/** Links. */
export const Links: Story = {
  args: {
    text: `Check out the [CometChat documentation](https://www.cometchat.com/docs) for more information.

You can also visit [GitHub](https://github.com/cometchat) for the source code.`,
  },
  parameters: {
    docs: { description: { story: 'Hyperlinks rendered with target="_blank" and rel="noopener noreferrer".' } },
  },
};

/** Full AI response example. */
export const FullAIResponse: Story = {
  args: {
    text: `## How to integrate CometChat in Angular

Here's a step-by-step guide to get started:

### 1. Install the SDK

\`\`\`bash
npm install @cometchat/chat-sdk-javascript @cometchat/chat-uikit-angular
\`\`\`

### 2. Initialize the SDK

\`\`\`typescript
import { CometChat } from '@cometchat/chat-sdk-javascript';

const appID = 'YOUR_APP_ID';
const region = 'us';

CometChat.init(appID, new CometChat.AppSettingsBuilder()
  .subscribePresenceForAllUsers()
  .setRegion(region)
  .build()
).then(() => {
  console.log('CometChat initialized successfully');
});
\`\`\`

### 3. Login a user

\`\`\`typescript
CometChat.login('USER_UID', 'AUTH_KEY').then(user => {
  console.log('Login successful:', user);
});
\`\`\`

> **Note:** Never expose your Auth Key in production. Use Auth Tokens instead.

### Key features available:
- **Real-time messaging** — text, image, audio, video, files
- **Group chats** — public, private, and password-protected
- **Reactions** — emoji reactions on messages
- **Threads** — reply in threads
- **AI features** — smart replies, conversation summary

For more details, see the [official documentation](https://www.cometchat.com/docs).`,
  },
  parameters: {
    docs: { description: { story: 'A realistic full AI response with headings, code blocks, lists, blockquote, and links.' } },
  },
};

/** Streaming mode — partial markdown. */
export const StreamingMode: Story = {
  args: {
    text: 'Here is a partial response that is still being streamed: **bold text** and some `code`...',
    streaming: true,
  },
  parameters: {
    docs: { description: { story: 'Streaming mode enables partial markdown parsing for live-updating content.' } },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders markdown renderer container */
export const TestDefaultRendersMarkdown: Story = {
  args: {
    text: 'Hello, **world**! This is a *markdown* renderer.',
  },
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-markdown-renderer__container');
    expect(container).not.toBeNull();
  },
};
