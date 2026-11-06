# Changelog

All notable changes to `@cometchat/chat-uikit-angular` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

A pull request into `master-v5` must have a `## [x.y.z]` entry for the version in
`projects/cometchat-uikit/package.json` (checked by `scripts/ci/check-versions.mjs --changelog`).
Add changes under **Unreleased** as they merge, and move them under the version heading when
cutting the release.

## [Unreleased]

## [5.2.3]

_Not yet released; the date is set when it is tagged._

### Security

- The markdown renderer no longer lets crafted message text inject HTML (XSS). It now renders
  only safe URLs: links use `http:`, `https:`, `mailto:` or `tel:` (others, such as `ftp:`,
  link to `#`), and images use `http:` or `https:` (a `data:` image renders with no source).

### Fixed

- A message that fails to send stays in the list with the error tick instead of looking sent.
- A message sent while a new chat is still loading now appears in that chat.
- When a page of older or newer messages fails to load (for example, the connection drops while
  scrolling), the messages already shown stay, instead of the whole chat turning into
  "Something went wrong". To retry, scroll a little away from that end of the list and back
  again; `errorCallback` still reports the failure.
- Conversations, users, groups and group members refresh after a reconnect even when the
  disconnect and the reconnect arrive together (a laptop waking, a throttled tab). The users,
  groups and group members refresh keeps the app's request builder and the active search,
  instead of showing the unfiltered list, and a refresh that finishes after a search or a
  switch to another group no longer replaces that list.
- Search honours `messageSentAtDateTimeFormat` and follows later changes to `searchIn`,
  `searchFilters`, `uid` and `guid`. A slow earlier search no longer replaces the results of a
  newer one, so switching chats mid-search shows the new chat's results.
- Older messages keep loading in a chat opened while the previous chat was still loading a page
  of history; that page used to stop it.
- Popovers re-position when their content resizes, so the emoji keyboard opens above the
  composer instead of hanging below it.
- The message header shows "Offline" for a user who has never signed in.
- Fourteen theme variables that components referenced but no theme defined now resolve, so
  popup shadows on the attachment menu and the emoji, sticker and mention panels appear.
- Copy on an AI agent's reply, and on captioned media, copies the text and shows the toast.
- An AI agent's reply numbered `1)`, `2)` … renders as a numbered list, as one numbered `1.`
  does, instead of running together as one paragraph.
- The message list no longer shows "Something went wrong" over loaded messages when two loads
  of older messages overlap.
- The message list stops its deferred scroll work once it is destroyed.
- The markdown formatter no longer re-reads HTML tags as markdown, keeps `_` and `*` inside
  URLs (`[text](url)` links and bare URLs) intact, and no longer reads `_` inside a word as
  italic, so `snake_case_name` stays as typed.
- `HtmlSanitizerService` returns the same output when run twice on whitespace-only input.
- A layout-mode announcement no longer clears later screen-reader announcements.
- Null or undefined inputs no longer crash the context menu, search bar, message bubble,
  paginated list or message information components.
- Names and other user text containing `$&`, `$'` or `$$` are shown literally in localized
  strings, including the typing indicator's and the mention announcements' screen-reader text,
  instead of being garbled; a name that itself reads like a placeholder (`{name2}`, `{total}`)
  is no longer filled in a second time.
- The calendar date pipe no longer throws for an invalid date, and date patterns take the
  weekday from the target time zone.
- `reconnected$` fires only on a real reconnect, not on the first connection at startup.

### Known issues

- A message that arrives in real time is sometimes not shown in a chat that is already open,
  although the Chats list previews it. Reopening the chat shows it.
- After logging out and back in without reloading the page, real-time updates sometimes stop:
  new messages reach neither the open chat nor the Chats list until the page is reloaded.

### Changed

- Peer dependency ranges. `@angular/core` and `@angular/common` now require **Angular 18 or
  later** (`>=18.0.0 <22.0.0`). The message composer and search use `@defer`, which compiles to
  an Angular 18 runtime call, so an Angular 17 app built but showed a blank page at startup
  (already so in 5.2.2); the range now says so, and CI starts the built app to check it.
- `dompurify` now requires **3.4.17 or later** (`^3.4.17`, was `^3.0.0`) for its security fixes.
  An app that pins an older dompurify gets an npm peer conflict on upgrade; update dompurify.
- The package ships `LICENSE.md`, and its `license` field points to it.
- `CometChatMarkdownParser` HTML-escapes table header and cell text in the tree it returns. Code
  that renders that tree itself should not escape that text again, or it shows `&lt;` and the
  like.
- The notification feed uses the theme's font tokens (`--cometchat-font-body-regular` for the
  feed, body-medium for filter chips).
- Fonts in seven newer stylesheets use the `--cometchat-font-*` tokens; six sizes or weights
  move to the nearest token (600 → 500 weight, 13px → 14px, 11px → 12px).

## [5.2.2] - 2026-09-30

Earlier releases are listed on the
[GitHub releases page](https://github.com/cometchat/cometchat-uikit-angular/releases).
