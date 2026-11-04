# stream-chat-react-native v9 → v10: AI migration guide

Execution guide for a coding agent upgrading an app from v9 to v10 of `stream-chat-react-native` (React Native
CLI), `stream-chat-expo` (Expo) and `stream-chat-react-native-core` (the shared core both wrappers re-export).
v10 runs on `stream-chat` v10, whose reactive state layer replaces most of what the SDK used to copy into React
context: state is read from `stream-chat` instance stores (`channel.state`, `channel.messagePaginator`,
`thread.messagePaginator`) with `useStateStore(store, selector)`. Upgrade the SDK and `stream-chat` together.

Verified against `V10` @ `74884ff55` (`stream-chat-react-native-core@9.11.1` in `package/package.json`; the
version is bumped to 10.x at release; `stream-chat@^10.0.0-rc.30`), 2026-11-03.

## Rules for the agent

1. **The installed packages are the source of truth, not your memory and not this guide.** Before writing a
   v10 symbol, prop or import, find it in:
   - `node_modules/stream-chat-react-native-core/lib/typescript/index.d.ts` (public types; the source ships too,
     under `node_modules/stream-chat-react-native-core/src/`). `stream-chat-react-native` and `stream-chat-expo`
     re-export all of it; import from the wrapper the app already uses. If the core package is not at the top of
     `node_modules` (pnpm, nested installs), locate it with
     `node -p "require.resolve('stream-chat-react-native-core/package.json', { paths: [require.resolve('stream-chat-react-native/package.json')] })"`
     (use `stream-chat-expo/package.json` for Expo apps).
   - `node_modules/stream-chat/dist/types/index.d.ts` (and `node_modules/stream-chat/src/`) for `stream-chat`.
   - `node_modules/@stream-io/i18n/dist/index.d.ts` for the i18n runtime behind `Streami18n`.
2. **If a symbol this guide names is missing from the installed package, stop and report it.** Do not invent a
   fallback, and do not keep the v9 code "just in case".
3. **Detect before editing.** Run §1; skip every section whose detection returns zero hits.
4. **Make the smallest edit that fixes the break.** Code that still type-checks and still does what the app
   needs stays as it is. The snippets show one valid form, not the only one; do not rewrite working code into
   their shape.
5. **A green build is not the finish line.** Many v10 changes compile and still change behaviour, and in plain
   JavaScript none of them fail to compile. Walk [Breaks that compile](#breaks-that-compile) after the build is
   green.
6. **Keep the app's behaviour** unless a section says an SDK default changed and the app relied on the old
   default; then restore the old behaviour explicitly, or list it as a decision for the human.
7. **Do not edit lockfiles, generated files or `node_modules` by hand.** Change dependencies with the app's
   package manager only.
8. **`stream-chat` errors this guide does not cover** — look the symbol up in the `stream-chat` guide and its
   [type rename table](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md#type-rename-table)
   (see Companion documents). Do not guess a v10 name from a v9 one.
9. **How the state model changed, in one line:** state that used to come from React context is read from
   `stream-chat` stores. The entry points are `useChannelContext().channel` (the `Channel`), `useChannel()`
   (thread-aware: `thread?.channel ?? channel`), `useMessagePaginator()` (the thread's paginator inside a
   `<Thread>`, the channel's otherwise) and `useStateStore(store, selector)`. Define selectors at module scope,
   return an object of slice references, and never allocate new arrays inside a selector. Message operations
   moved to `useMessageOperations()` (§9) and mark-read to `useMarkRead(channel)` (§5).
10. **Section ids** (`§4`, `§13.1`, `§K.5`, `P.17`, `§R.2`) are unique. Find a section by searching for its id
    at the start of a heading (`## 4.`, `## 13.1`, `## K.5`, `## P.17`, `### 2.1`); §16.1–§16.3 are numbered
    bullets inside §16. Each section names the imports it needs.

## Companion documents

Fetch these only when the "when" column applies. `ai-docs/` is not part of the npm packages, so read them
from these URLs.

| Document | Raw URL | When to fetch |
| --- | --- | --- |
| `stream-chat` v9 → v10 guide | https://raw.githubusercontent.com/GetStream/stream-chat-js/release-v10/ai-docs/ai-migration-v9-to-v10.md | A `stream-chat` compile error or call this guide does not cover (§17.5, §R.7, §R.8 cover the common ones) |
| `stream-chat` v10 breaking changes (reference) | https://raw.githubusercontent.com/GetStream/stream-chat-js/release-v10/ai-docs/v10-breaking-changes.md | Looking up a renamed `stream-chat` type ([type rename table](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md#type-rename-table)) or a `stream-chat` behaviour change ([behaviour index](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md#behaviour-index)) |
| RN v10 breaking changes (reference) | https://raw.githubusercontent.com/GetStream/stream-chat-react-native/V10/ai-docs/v10-breaking-changes.md | Checking that a removed prop or field is covered; edge cases and fix details behind the one-line "No action" sections |
| i18n migration guide | https://raw.githubusercontent.com/GetStream/stream-chat-react-native/V10/ai-docs/i18n-v10-migration.md | The app registers translations, calls `t()` with its own keys, constructs `Streami18n`, or formats dates (§19) |
| i18n key map (v9 key → v10 key) | https://raw.githubusercontent.com/GetStream/stream-chat-react-native/V10/ai-docs/i18n-v10-key-map.json | Renaming v9 translation keys in the app's dictionaries (§19) |

## Workflow

**Phase 0 — Preflight.** Record, before changing anything:

- the installed versions of `stream-chat-react-native` / `stream-chat-expo`, `stream-chat-react-native-core`,
  `stream-chat`, `react-native`, `expo`, `react` and `typescript`, from `package.json` and the lockfile;
- the package manager (from the lockfile), the Node version (`node -v`), and whether the app is TypeScript or
  plain JavaScript;
- that the git tree is clean (`git status`); if it is not, stop and ask;
- the baseline result of the app's own typecheck, lint and test scripts (read `scripts` in `package.json`), so
  that errors you did not cause are not counted against the migration.

**Phase 1 — Install and platform.** Apply §R.1 first: React Native ≥ 0.79, Expo SDK ≥ 53, and Node ≥ 22.18 for
installs and CI. If the app is below a floor, upgrading React Native / Expo is its own task: stop and report
it. Then install the v10 wrapper the app uses (`stream-chat-react-native` or `stream-chat-expo`; list versions
with `npm view <package> versions`; if no stable 10.x exists and the user named no version, ask which
pre-release to use). Set `stream-chat` to the range in the installed core package's `dependencies` (§17). Run
`pod install` for iOS, and `npx expo install --check` for Expo apps.

**Phase 2 — Detect.** Run every command in §1 from the app root. Write down the sections with hits.

**Phase 3 — Apply compile-breaking sections**, in the order they appear in this guide, only for sections with
hits. Re-run the typecheck after each Part. For a remaining `stream-chat` error, see Rule 8.

**Phase 4 — Walk [Breaks that compile](#breaks-that-compile).** Run each row's Detect command. Fix the row, or
record it as a decision for the human when the right behaviour is a product choice.

**Phase 5 — Verify.** Run [Verification](#verification): typecheck, lint, tests, the leftover-identifier grep
(must return zero hits), and list the runtime checks that apply.

**Phase 6 — Report**, using the template below.

**Definition of done**

- The app's typecheck, lint and tests are no worse than the Phase 0 baseline.
- The leftover-identifier grep in [Verification](#verification) returns no hits outside comments and changelogs.
- Every section with detection hits is either applied or listed as skipped with a reason.
- Every Breaks-that-compile row with hits is fixed or listed as an open decision.
- Dependencies changed only through the package manager; no lockfile or generated file edited by hand.

**Report template**

```text
Upgraded: <wrapper>@<from> → <to>, stream-chat@<from> → <to> (<package manager>, Node <version>)
Changed files by section: §<id> <file>, <file>; §<id> …
Skipped sections (zero hits / not applicable): §<id> <reason>; …
Breaks that compile — fixed: <row>; checked, no hits: <rows>
Open decisions for the human: <row / section + the choice to make>
Symbols this guide names that were missing from node_modules: <none | list>
Verification: typecheck <result>, lint <result>, tests <result>, leftover grep <hits>
Runtime checks still to do on a device: <items from Verification>
```

## 1. Detection (run first)

Run from the app root. Each command searches every JS/TS source (`.js .jsx .mjs .cjs .ts .tsx .mts .cts`)
outside `node_modules`; patterns match the **v9** names. Zero hits for a section's commands = skip that
section. A comment line starting `#` names the section the commands below it belong to.

```bash
# §2 — TypingContext removed; typing prop/util changes (§2.1)
rg -n -t js -t ts -g '!**/node_modules/**' '\b(useTypingContext|TypingProvider|TypingContext|TypingContextValue|useCreateTypingContext|filterTypingUsers)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' -A6 '<TypingIndicatorContainer\b' . | rg '\bthread\b'

# §3 — PaginatedMessageListContext removed
rg -n -t js -t ts -g '!**/node_modules/**' '\b(usePaginatedMessageListContext|PaginatedMessageListProvider|PaginatedMessageListContext|PaginatedMessageListContextValue|useCreatePaginatedMessageListContext)\b' .

# §4 — ChannelContext / MessageContext members, read, watchers, watcherCount removed
rg -n -t js -t ts -g '!**/node_modules/**' -A8 'use(Channel|Message)Context\(\)' . | rg '\b(members|read|watchers|watcherCount)\b'

# §5 — markRead removed from ChannelContext
rg -n -t js -t ts -g '!**/node_modules/**' -A8 'useChannelContext\(\)' . | rg '\bmarkRead\b'

# §6 — message targeting / highlight removed
rg -n -t js -t ts -g '!**/node_modules/**' '\b(useTargetedMessage|targetedMessage|setTargetedMessage)\b' .

# §7 — unread-state store and props removed
rg -n -t js -t ts -g '!**/node_modules/**' '\b(channelUnreadStateStore|setChannelUnreadState|ChannelUnreadState)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' 'unreadCount\s*=' .
rg -n -t js -t ts -g '!**/node_modules/**' '\btotal_unread_count\b|\bactiveChannels\b' .

# §8 — ChannelContext loaders and <Channel messageId> removed
rg -n -t js -t ts -g '!**/node_modules/**' '\b(loadChannelAroundMessage|loadChannelAtFirstUnreadMessage|reloadChannel|highlightedMessageId)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' -A8 'useChannelContext\(\)' . | rg '\bloading\b'
rg -n -t js -t ts -g '!**/node_modules/**' -A20 '<Channel\b' . | rg '\bmessageId='

# §9 — message operations off MessagesContext; updateMessage single-argument
rg -n -t js -t ts -g '!**/node_modules/**' -A10 'useMessagesContext\(\)' . | rg '\b(sendReaction|deleteReaction|deleteMessage|removeMessage|retrySendMessage|updateMessage)\b'
rg -n -t js -t ts -g '!**/node_modules/**' '\bupdateMessage\([^)]*,' .

# §10 — thread API: Thread instance, standalone <Thread>, removed thread props/fields
rg -n -t js -t ts -g '!**/node_modules/**' '\b(useThreadContext|openThread|closeThread|reloadThread|loadMoreThread|loadMoreRecentThread|threadMessages|threadHasMore|threadLoadingMore|threadInstance|closeThreadOnDismount|ThreadFooterComponent|threadList|ThreadMessageComposer|ThreadType|additionalMessageListProps|additionalMessageFlashListProps|additionalMessageComposerProps|shouldUseFlashList|shouldSyncChannel|onThreadSelect|onAlsoSentToChannelHeaderPress)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' -A20 '<Channel\b' . | rg '\b(thread|threadList|allowThreadMessagesInChannel)='

# §11 — editMessage removed from the message input context
rg -n -t js -t ts -g '!**/node_modules/**' '\beditMessage\b' .

# §12 — MessageList / MessageFlashList removed props; §12.1 FooterComponent / HeaderComponent
rg -n -t js -t ts -g '!**/node_modules/**' -A20 '<(MessageList|MessageFlashList)\b' . | rg '\b(channelUnreadStateStore|setChannelUnreadState|setTargetedMessage|targetedMessage|threadHasMore|loadMoreThread|loadMoreRecentThread|threadInstance|loadChannelAroundMessage|loading|reloadChannel|highlightedMessageId|thread|FooterComponent|HeaderComponent)='

# §13 — ChannelProps state props removed
rg -n -t js -t ts -g '!**/node_modules/**' -A20 '<Channel\b' . | rg '\b(messages|loadingMore|loadingMoreRecent|threadMessages|setThreadMessages)='

# §13.1 — props replaced by client.config; raw server flags; setup function
rg -n -t js -t ts -g '!**/node_modules/**' '\b(doMarkReadRequest|doSendMessageRequest|doUpdateMessageRequest|doFileUploadRequest|stateUpdateThrottleInterval|newMessageStateUpdateThrottleInterval|setMessageComposerSetupFunction)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' '\.getConfig\(\)|\bclient\.configs\b' .
rg -n -t js -t ts -g '!**/node_modules/**' '(serverConfig|getConfig\(\))\??\.(typing_events|read_events|replies|user_message_reminders|delivery_events|commands|uploads|polls|url_enrichment|shared_locations|max_message_length)' .
rg -n -t js -t ts -g '!**/node_modules/**' 'messagePaginator\.(pageSize\s*=|updateConfig\()' .

# §14–§15 — hooks with narrowed signatures
rg -n -t js -t ts -g '!**/node_modules/**' '\buseMutedUsers\(\s*\w|\b(useCreateChannelContext|useCreateMessagesContext|useCreateThreadContext|useCreateMessageInputContext|useCreateMessageContext)\b' .

# §15.1 — message action hooks take no arguments; handlers set on <Message> no longer reach the menu
rg -n -t js -t ts -g '!**/node_modules/**' '\b(useMessageActions|useMessageActionHandlers)\(\s*\{|\bMessageActionsHookProps\b' .
rg -n -t js -t ts -g '!**/node_modules/**' -A10 '<Message\b' . | rg '\b(handle[A-Z]\w*|messageActions|supportedReactions)='

# §16 — behavioral defaults (page size, sendMessage rejects)
rg -n -t js -t ts -g '!**/node_modules/**' '\b(sendMessage|SendMessageDisallowedIndicator)\b' .

# §17 — stream-chat v10 dependency
rg -n '"stream-chat"' package.json

# §17.1 — custom fields under .custom
rg -n -t js -t ts -g '!**/node_modules/**' '\.data\??\.(name|image)\b|\.(mime_type|file_size|ai_generated)\b' .

# §17.2 — deleteMessage options snake_case
rg -n -t js -t ts -g '!**/node_modules/**' '\b(hardDelete|deleteForMe)\s*:' .

# §17.4 — moderation V1 → V2
rg -n -t js -t ts -g '!**/node_modules/**' '\bmoderation_details\b' .

# §17.5 — stream-chat types, nanosecond dates, request objects, sort arrays
rg -n -t js -t ts -g '!**/node_modules/**' "from 'stream-chat'" .
rg -n -t js -t ts -g '!**/node_modules/**' '(new Date|dayjs|moment)\([^)]*\b(created_at|updated_at|last_read|last_message_at|deleted_at|pinned_at|expires_at|remind_at|last_active)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' '\b(EventTypes|FormatMessageResponse|AppSettingsAPIResponse|ReadResponse|TranslationLanguages|ChannelSort|MessageResponseBase|createAbortControllerForNextRequest|sendFile|sendImage)\b|sort=\{\{|sort:\s*\{' .

# §17.6 — attachments mid-upload carry localMetadata
rg -n -t js -t ts -g '!**/node_modules/**' '\b(localId|originalFile|createAttachmentsCompositionMiddleware|createDraftAttachmentsCompositionMiddleware|localAttachmentToAttachment|isLocalUrl|makeImageCompatibleUrl)\b' .

# §17.7 — client options are the configuration tree
rg -n -t js -t ts -g '!**/node_modules/**' '(new StreamChat|StreamChat\.getInstance|useCreateChatClient)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' '\b(axiosRequestConfig|persistUserOnConnectionFailure|allowServerSideConnect|StreamChatOptions|client\.options)\b' .

# §18 — ChannelList event-override props, query props, channelManager
rg -n -t js -t ts -g '!**/node_modules/**' '\b(onAddedToChannel|onRemovedFromChannel|onChannelDeleted|onChannelHidden|onChannelVisible|onChannelUpdated|onChannelTruncated|onChannelMemberUpdated|onNewMessage|onNewMessageNotification|useChannelUpdated|queryChannelsOverride|createChannelManager|lockChannelOrder)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' -A15 '<ChannelList\b' . | rg '\b(filters|sort|options|paginator)='
rg -n -t js -t ts -g '!**/node_modules/**' '\bloadNextPage\(\s*\w' .

# §K — channel.state reads, in-place channel.data writes, channel.disconnected, AI indicator
rg -n -t js -t ts -g '!**/node_modules/**' '\bchannel\??\.state\??\.(members|read|typing|watchers|watcher_count|member_count|mutedUsers)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' '\.data\.\w+\s*=[^=]|\.state\.membership\.\w+\s*=[^=]' .
rg -n -t js -t ts -g '!**/node_modules/**' '\.disconnected\b|ai_indicator\.|AI_STATE_CHECKING_SOURCES|\bactivate\(\)' .

# §L — connection recovery moved into the client; ChannelContext error removed
rg -n -t js -t ts -g '!**/node_modules/**' '\b(recoverState|recoverStateOnReconnect|preventThreadCleanup)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' "connection\.(changed|recovered)" .
rg -n -t js -t ts -g '!**/node_modules/**' -A8 'useChannelContext\(\)' . | rg '\berror\b'

# §M, §N — offline DB and search internals (custom offline code only)
rg -n -t js -t ts -g '!**/node_modules/**' '\b(AbstractOfflineDB|getChannelsForQuery|getChannelsForFilterSort|upsertCidsForQuery|syncStatus|_internalState|InternalSearchControllerState)\b' .

# §O — maximumMessageLimit and allowSendBeforeAttachmentsUpload moved to configuration
rg -n -t js -t ts -g '!**/node_modules/**' '\b(maximumMessageLimit|allowSendBeforeAttachmentsUpload)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' -A20 '<Channel\b' . | rg '\benableOfflineSupport='

# P.1–P.9 — removed exports, renamed hooks, dead fields and props, list paging, unread types
rg -n -t js -t ts -g '!**/node_modules/**' '\b(useSelectedChannelState|reduceMessagesToString|findInMessagesById|findInMessagesByDate|getLastReceivedMessage|DebugContextProvider|useDebugContext|DebugContextValue|DebugDataType|useIsOnline|isChannelActive|scrollToFirstUnreadThreshold|shouldShowUnreadUnderlay|currentUserId|deleteReactionsForMessage)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' '\buseMutedChannels\(\s*\w|\buseMessageList\(' .
rg -n -t js -t ts -g '!**/node_modules/**' -A15 '<(MessageList|MessageFlashList)\b' . | rg '\b(loadMore|loadMoreRecent|hasMore|loadingMore|loadingMoreRecent|FlatList)='

# P.11–P.15, P.17, P.20 — ChatContext, chat hooks, deleted channels, composer submit, ChannelsContext
rg -n -t js -t ts -g '!**/node_modules/**' -A8 'useChatContext\(\)' . | rg '\b(appSettings|channel|setActiveChannel|mutedUsers|enableOfflineSupport|isOnline|connectionRecovering)\b'
rg -n -t js -t ts -g '!**/node_modules/**' '\b(useClientMutedUsers|useAppSettings|MessagePropsWithContext|preSendMessageRequest|patchMessageTextCommand)\b|channel\.deleted' .
rg -n -t js -t ts -g '!**/node_modules/**' -A8 'useChannelsContext\(\)' . | rg '\b(channels|hasNextPage|error|loadingChannels|channelListInitialized|loadingNextPage|refreshing|forceUpdate)\b'

# Q.1, Q.3 — plural count keys; isMessageAIGenerated on <Chat> only
rg -n -t js -t ts -t json -g '!**/node_modules/**' 'messageList\.newMessages\.text|messageList\.scrollToBottom\.withCount|channelPreview\.unreadCount\.accessibilityLabel|message\.reactionList\.more|avatar\.channel\.group' .
rg -n -t js -t ts -g '!**/node_modules/**' '\bisMessageAIGenerated\b' .

# §R.1 — platform floors and packaging (also check package.json: react-native >=0.79, expo >=53)
rg -n '"(react-native|expo|dayjs|i18next|@stream-io/state-store)"' package.json
rg -n -t js -t ts -g '!**/node_modules/**' "import[^;]*\b(StateStore|Unsubscribe)\b[^;]*from 'stream-chat'" .

# §R.2 — connection status off ChatContext
rg -n -t js -t ts -g '!**/node_modules/**' '\b(isOnline|connectionRecovering|statusReporter|NetworkDownIndicator)\b' .

# §R.3 — delivery receipts
rg -n -t js -t ts -g '!**/node_modules/**' '\b(readBy|deliveredToCount)\b' .

# §R.4 — more removed / retyped context fields and props
rg -n -t js -t ts -g '!**/node_modules/**' '\b(uploadAbortControllerRef|forceUpdate|InlineLoadingMoreIndicator|InlineLoadingMoreRecentIndicator|LoadingErrorIndicator|CommandSuggestionItem|giphyVersion|ImageGalleryStateStore)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' 'AIStates\.\w+\s*\]\.includes\b' .

# §R.5 — <Channel> / <Thread> behaviour
rg -n -t js -t ts -g '!**/node_modules/**' '\b(initializeOnMount|isLocalUnreadCountEnabled|supersededBy|UnreadMessagesNotification|filterErrorMessages)\b' .

# §R.6 — channel list query inputs
rg -n -t js -t ts -g '!**/node_modules/**' -A12 'new ChannelPaginator\b' . | rg '\b(filters|offset|limit)\b'

# §R.7 — stream-chat state read directly
rg -n -t js -t ts -g '!**/node_modules/**' 'channel\.state\.(messages|latestMessages|messageSets|threads|pinnedMessages|isUpToDate|findMessage|loadMessageIntoState|addMessageSorted|mutedUsers)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' '\.lastMessage\(\)|\b(activeChannels|hydrateActiveChannels|threadsById)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' 'client\.threads\.(state|loadNextPage)\b|thread\.(loadNextPage|loadPrevPage|queryReplies)\b|thread\.state\b|channel\.query\(' .

# §R.8 — stream-chat client calls
rg -n -t js -t ts -g '!**/node_modules/**' '\b(addDevice|getDevices|removeDevice|setLocalDevice|queryChannels|queryUsers|queryMembers|muteUser|unmuteUser|flagMessage|flagUser|banUser|shadowBan|upsertReminder|createReminder|stopLiveLocationSharing|sendEvent|ErrorFromResponse|connectUser|logger)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' -A3 'client\.channel\(' . | rg '\b(name|members|image)\b'

# §R.9 — offline DB contract (custom offline code only)
rg -n -t js -t ts -g '!**/node_modules/**' '\b(getChannelsForQuery|handleOfflineFailedUpdateMessagePendingTask|mergeFailedMessageUpdateIntoPendingSendMessage|deleteMessagesForChannel|OfflineStoreApis|OfflineDB|SqliteClient)\b' .

# §R.10 — i18n gaps
rg -n -t js -t ts -g '!**/node_modules/**' '\b(geti18Instance|getAvailableLanguages|getTranslations|addOnTFunctionOverrideListener|userLanguage|isDayOrMoment|SCROLL_TO_BOTTOM_\w+)\b' .
rg -n -t js -t ts -t json -g '!**/node_modules/**' 'Location end at|Remind Me|ReminderNotification|MessageEditedTimestamp' .

# §R.11 — deep imports
rg -n -t js -t ts -g '!**/node_modules/**' "stream-chat-(react-native|expo)(-core)?/(src|lib)/" .

# §19 — i18n: keys, the Streami18n API, the a11y namespace, date helpers
rg -n -t js -t ts -g '!**/node_modules/**' '\bStreami18n\b|registerTranslation|translationsForLanguage|setLanguage|getTranslators|addOnLanguageChangeListener|relativeCompactDateFormatter' .
rg -n -t js -t ts -t json -g '!**/node_modules/**' "t\(\s*'a11y/|t\(\s*'[A-Z][a-z]+ [a-z]|\"a11y/" .   # v9 keys WERE the English copy
rg -n -t js -t ts -g '!**/node_modules/**' '\b(enTranslations|esTranslations|frTranslations|heTranslations|hiTranslations|itTranslations|jaTranslations|koTranslations|nlTranslations|ptBRTranslations|ruTranslations|trTranslations)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' -A4 'getDateString|getDateStringForA11y' . | rg '\bdate:'
rg -n '"(dayjs|i18next)"' package.json
```

---

## Quick reference — v9 → v10 map

Ctrl-F the v9 symbol you used. Every entry preserves the capability — only the
means changed. Details in the linked section.

| v9 — you used to… | v10 — now do… | § |
|---|---|---|
| `useTypingContext().typing` | `useStateStore(channel.state, s => ({ typing: s.typing }))` | §2 |
| `filterTypingUsers({ client, thread, typing })` | `filterTypingUsers({ client, threadId: thread?.id, typing })` | §2.1 |
| `usePaginatedMessageListContext().messages` | `useStateStore(channel.messagePaginator.state, s => ({ messages: s.items }))` | §3 |
| …`.hasMore` / `.hasMoreNewer` | `channel.messagePaginator.state.hasMoreTail` / `.hasMoreHead` | §3 |
| …`.loadMore()` / `.loadMoreRecent()` | `channel.messagePaginator.toTail()` / `.toHead()` | §3 |
| …`.loadLatestMessages()` | `channel.messagePaginator.jumpToTheLatestMessage()` | §3 |
| `useChannelContext().members` / `read` / `watchers` / `watcherCount` | `useStateStore(channel.state, selector)` (one store; selector picks the slice) | §4 |
| `useChannelContext().markRead()` | `useMarkRead(channel)()` — or `channel.markReadViaReporter()` (`channel.markRead()` is now the direct request) | §5 |
| `<Channel doMarkReadRequest>` | `client.config.set({ channel: { requestHandlers: { markReadRequest } } })` | §13.1 |
| `<Channel doUpdateMessageRequest>` | `…{ requestHandlers: { updateMessageRequest } }` | §13.1 |
| `<Channel doSendMessageRequest>` | `…{ requestHandlers: { sendMessageRequest } }` (retry: `retrySendMessageRequest`) | §13.1 |
| `<Channel doFileUploadRequest>` | `client.config.set({ messageComposer: { attachments: { doUploadRequest } } })` | §13.1 |
| `attachment.custom?.localId` | `isLocalUploadAttachment(a) ? a.localMetadata.id : undefined` | §17.6 |
| `attachment.custom?.originalFile?.uri` | `getAttachmentPreviewUrl(a, a.asset_url, a.image_url)` (`stream-chat`); for video playback `getPlayableVideoUrl(a)` (SDK) | §17.6 |
| `createAttachmentsCompositionMiddleware` (RN) | the same-named export from `stream-chat` | §17.6 |
| `<Channel stateUpdateThrottleInterval>` | `…{ channel: { messagePaginator: { stateThrottleMs } } }` | §13.1 |
| `channel.getConfig()` | `channel.serverConfig` (getter) — or `channel.config` for resolved gates | §13.1 |
| `client.configs[cid]` | `client.channelServerConfigs[cid]` | §13.1 |
| `channel.serverConfig?.typing_events` (and the other gated flags) | `channel.config.typingEvents.enabled` — resolved, server ANDed with yours | §13.1 |
| `client.setMessageComposerSetupFunction(fn)` | `client.config.setSetupFunction('messageComposer', fn)` | §13.1 |
| `setupCommandUIMiddlewares(composer)` | delete the call; `stream-chat` installs the command middlewares by default | §13.1 |
| re-setting `channel.messagePaginator.pageSize` after mount | `client.config.set({ channel: { messagePaginator: { pageSize } } })` | §13.1, §16.1 |
| `useTargetedMessage()` / `setTargetedMessage(id)` | `useMessagePaginator()?.jumpToMessage(id, { focusReason: 'jump-to-message', focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION })`; read with `useIsTargetedMessage(id)` | §6 |
| `useChannelContext().channelUnreadStateStore` / `setChannelUnreadState` | `channel.messagePaginator.unreadStateSnapshot` | §7 |
| `<ScrollToBottomButton unreadCount={n} />` | self-derived from `channel.state` `read` (override the component to control) | §7 |
| app-wide unread from `event.total_unread_count` | sum `channel.countUnread()` over `client.channelManager.values()` | §7.1 |
| `useMessagesContext()` → `sendReaction` / `deleteReaction` / `deleteMessage` / `removeMessage` / `retrySendMessage` / `updateMessage` | `useMessageOperations()` (same names) | §9 |
| `useMessagesContext().targetedMessage` | `useIsTargetedMessage(messageId)` (per row) | §6 |
| `useThreadContext().thread` (parent message) | `thread` is now the `Thread`; parent via `useStateStore(thread.state, s => ({ parentMessage: s.parentMessage }))` | §10 |
| `useThreadContext().threadMessages` | `thread.messagePaginator.state.items` | §10 |
| `useThreadContext().loadMoreThread()` / `loadMoreRecentThread()` | `thread.messagePaginator.toTail()` / `.toHead()` | §10 |
| `useThreadContext().threadHasMore` / `threadLoadingMore` | `thread.messagePaginator.state.hasMoreTail` / `.isLoading` | §10 |
| `useThreadContext().reloadThread()` | `thread.reload()` | §10 |
| `openThread(msg)` / `closeThread()` | lift `onThreadSelect` into app state, render `<Thread thread={thread}>` | §10.1 |
| `ThreadType` / `<Channel thread={message}>` | `<Thread thread={thread}>` with a `Thread` instance; `client.threads.ensure({ channel, parentMessage })` builds one from a message | §10.1 |
| `<Channel thread={thread} threadList><Thread /></Channel>` | `<Thread thread={thread}><MessageList /><MessageComposer /></Thread>`, no `<Channel>` around it | §10.1 |
| `threadList` (prop or context field) | `useThreadContext().thread` | §10.2 |
| `ThreadMessageComposer` slot / `additionalMessageComposerProps` | a `MessageComposer` child of `<Thread>` with its own props | §10.2 |
| `MessageList` slot | a `MessageList` (or `MessageFlashList`) child of `<Thread>`, or your own list component | §10.2 |
| `useMessageComposerContext().thread` (parent message; deep import only) | `thread` is now the `Thread`; parent on `thread.state` | §10.2 |
| `editMessage()` on the message input context | removed: `useMessageInputContext().sendMessage()` saves an edit; intercept with `updateMessageRequest` | §11, P.17 |
| `<MessageList targetedMessage / loadMoreThread / threadInstance …>` props | removed — list reads the `Thread` from `ThreadContext` + paginator internally; `thread` stays, retyped to `Thread` (or `undefined`) | §12 |
| custom `FooterComponent` / `HeaderComponent` reading `loadingMore` from context | receive `{ loadingMore?: boolean }` as a prop | §12.1 |
| `<Channel messages / loadingMore / threadMessages / setThreadMessages …>` props | removed — state lives in the paginator | §13 |
| `useMutedUsers(channel)` | `useMutedUsers()` | §14 |
| `useCreateTypingContext` / `useCreatePaginatedMessageListContext` | removed (their contexts are gone) | §15 |
| `useMessageActions({ channel, client, message, … })` / `useMessageActionHandlers({ … })` | `useMessageActions()` / `useMessageActionHandlers()` inside a message; `MessageActionsHookProps` removed | §15.1 |
| initial message-list page size ~100 | 25 — `<Channel>`'s default when no `pageSize` is registered through `client.config` | §16.1 |
| `sendMessage` errors swallowed | `sendMessage` throws — handle the rejection | §16.2 |
| `stream-chat` v9 | `stream-chat` `^10.x` required | §17 |
| `<ChannelList onNewMessage / onAddedToChannel / …>` event callbacks | `client.channelManager.addEventHandler(...)` / `client.on(...)`; membership+order via the paginator's `filters`/`sort` | §18 |
| `<ChannelList filters sort options lockChannelOrder>` | `<ChannelList paginator>` with an app-owned `ChannelPaginator` registered on `client.channelManager` | §18.6 |
| `queryChannelsOverride` returning `Channel[]` | removed - the paginator's `paginatorOptions.doRequest` → `return { items }` | §18.1 |
| `useChannelUpdated()` | removed — `channel.updated` is handled by the orchestrator | §18.2 |
| `loadNextPage(queryType?, retryCount?)` | `loadNextPage()` (no args; a no-op until the first page has loaded) | §18.3 |
| `client.createChannelManager(…)` | `client.channelManager` — one per client | §18.4 |
| `client.recoverState()` | `client.connectionRecovery.recover()` | §L.6 |
| `useChannelContext().error` | `useStateStore((thread ?? channel).messagePaginator.state, sel).lastQueryError` | §L.7 |
| `<Channel>` refreshing the channel / open thread on reconnect | `client.connectionRecovery`; `<Channel>` only marks them active | §L.4 |
| a custom channel/thread view built on the contexts | `useEffect(() => channel.activate(), [channel])` (same for `thread.activate()`) — `activate()` returns its release function; there is no `deactivate()`. Without it recovery cannot see them (`<Channel>` and `<Thread>` do it for you) | §L.4 |
| `new StreamChat(key, { recoverStateOnReconnect: false })` | `client.config.set({ client: { connectionRecovery: { enabled: false } } })` | §L.1 |
| `new StreamChat(key, { axiosRequestConfig, persistUserOnConnectionFailure, … })` / `useCreateChatClient({ options })` | the same fields under `client`: `new StreamChat(key, { client: { … } })` | §17.7 |
| a `connection.changed` listener | delete it — the event is **no longer dispatched** (it compiles and never fires). Reconnect is `client.connectionRecovery`'s job; status is `client.wsConnection.state` / `client.networkConnection.state` (`useWSConnectionState()`, `useNetworkConnectionState()`, `useSettledWSConnectionHealth()`) | §L, §R.2 |
| `connection.recovered` as "the `_reconnect()` path fired" | now dispatched on **every** reconnect path, after the recovery reload | §L.2 |
| rendering from `channel.state.members` / `.read` / `.typing` / `.watchers` and re-reading on events | `useStateStore(channel.state, selector)` — the getters still exist but do not subscribe | §K.1 |
| `channel.state.mutedUsers` | `useMutedUsers()` / `client.mutedUsersStore` | §K.2 |
| in-place `channel.data.member_count = n` (or any `channel.data` field) | reassign `channel.data = { …channel.data, member_count: n }` | §K.5 |
| `channel.disconnected` | `channel.pendingDisposal` (hard rename — no alias) | §K.8 |
| `t('Send Message')` — the key *was* the English copy | `t('messageInput.sendMessage.accessibilityLabel', 'Send Message')` — stable dotted key, copy inline | §19 |
| `t('a11y/Send message')` | the `.accessibilityLabel` leaf of the owning component's key | §19 |
| `import { frTranslations } from 'stream-chat-react-native'` | removed — English is the only bundled language; supply your own dictionary | §19 |
| `new Streami18n(opts, i18nextConfig)` | `new Streami18n({ ...opts, i18nextConfigOverrides: i18nextConfig })` | §19 |
| `const t = await i18n.setLanguage('de')` | `await i18n.setLanguage('de')` → `void`; read `i18n.t` or subscribe to `i18n.state` | §19 |
| `i18n.addOnLanguageChangeListener(fn)` | `i18n.state.subscribeWithSelector(({ t }) => ({ t }), fn)` | §19 |
| `i18n.getTranslators()` | `i18n.init()` — removed, not aliased; same return value | §19 |
| the `relativeCompactDateFormatter` formatter in a translation string | the `timestampFormatter(relativeCompact: true)` formatter in its place | §19 |
| `getDateString({ date, … })` | `getDateString({ messageCreatedAt, … })`; returns `null`, not `undefined`, when unrenderable | §19 |
| `getDateStringForA11y({ date, … })` | `getCalendarDateStringForA11y({ messageCreatedAt, … })` — same behaviour under a new name | §19 |
| poll `state.errors.x` as an English string | a `PollComposerValidationError` — key your copy on `error.code`, fall back to `error.message` | §19 |
| React Native 0.76–0.78 / Expo SDK 52 | React Native ≥0.79 / Expo SDK ≥53 | §R.1 |
| `import { StateStore, Unsubscribe } from 'stream-chat'` | the same names from `@stream-io/state-store` (one copy) | §R.1 |
| `useChatContext().isOnline` / `.connectionRecovering` | `useNetworkConnectionState()?.isOnline === false` (device) / `useSettledWSConnectionHealth()` (socket) | §R.2 |
| `useMessageContext().readBy` / `.deliveredToCount` | `useIsMessageReadByOthers({ message })` / `useIsMessageDeliveredToOthers({ message })` | §R.3 |
| `<MessageStatus readBy={n} deliveredToCount={n} />` | `<MessageStatus read={bool} delivered={bool} />` | §R.3 |
| `useMessageContext().members` | `useStateStore(channel.state, (s) => ({ members: s.members }))` | §4 |
| `<ChannelList options={{ offset, limit }}>` | the `ChannelPaginator` owns paging: `requestOptions` takes neither; page size is `paginatorOptions.pageSize` | §R.6 |
| `<ChannelList filters={{ myField: x }}>` | `new ChannelPaginator({ client, filters: { 'custom.myField': x } })` | §R.6 |
| `channel.state.messages` / `channel.lastMessage()` | `channel.messagePaginator.state` (`items`) / `channel.messagePaginator.latestMessage` | §R.7 |
| `client.activeChannels[cid]` | `client.channelManager.get(cid)` | §R.7 |
| `client.threads.state` `threads` / `client.threads.loadNextPage()` | `client.threads.paginator.state` `items` / `client.threads.paginator.toTail()` | §R.7 |
| `client.addDevice(token, provider)` / `getDevices()` / `removeDevice(id)` | `client.createDevice({ id: token, push_provider })` / `listDevices()` / `deleteDevice({ id })` | §R.8 |
| `client.queryChannels(filters, sort, options)` returning `Channel[]` | `client.queryChannelsAndHydrate({ filter_conditions: filters, sort, ...options })` | §R.8 |
| `client.muteUser(id)` / `client.banUser(id)` / `client.flagMessage(id)` | `client.moderation.mute({ target_ids: [id] })` / `.ban({ target_user_id: id })` / `.flagMessage({ message_id: id })` | §R.8 |
| `message.ai_generated` | `message.custom?.ai_generated` | §R.8 |
| custom `AbstractOfflineDB.getChannelsForQuery({ filters, sort })` | `getChannelsForQuery({ userId, options })` — `options.filter_conditions`, `options.sort` | §R.9 |
| `i18n.geti18Instance()` | `i18n.i18nInstance` | §R.10 |
| `t('timestamp/ReminderNotification', …)` and the other app-callable formatter keys | register the expression yourself in a `LooseTranslationDictionary` | §R.10 |
| `<Channel messageId={id}>` | `channel.messagePaginator.jumpToMessage(id, …)` yourself + `initialScrollToFirstUnreadMessage={!messageId}` | §8 |
| `channel.data.name` / `.image`, `attachment.mime_type` / `file_size` | `channel.data.custom?.name`, `attachment.custom?.mime_type` | §17.1 |
| `deleteMessage(msg, { hardDelete: true })` / `{ deleteForMe: true }` | `{ hard: true }` / `{ delete_for_me: true }` | §17.2 |
| `message.moderation_details` | `message.moderation` (V2) | §17.4 |
| `new Date(message.created_at)` / `dayjs(message.created_at)` | `convertTimestampToDate(message.created_at)` — server dates are unix-nanosecond `TimestampNS` numbers | §17.5 |
| `{ last_message_at: -1 }` sort objects | `[{ field: 'last_message_at', direction: -1 }]` | §17.5 |
| `<Channel maximumMessageLimit={n}>` | `client.config.set({ channel: { messagePaginator: { maxLoadedItems: n } } })` | §O.1 |
| `<Channel allowSendBeforeAttachmentsUpload>` / `<Channel enableOfflineSupport>` | `client.config.set({ messageComposer: { attachments: { pendingUploadsEnabled } } })`; offline support stays on `<Chat>` | §O.3 |
| `useSelectedChannelState`, `findInMessagesById`, `getLastReceivedMessage`, `DebugContextProvider` | see the table in P.1 | P.1 |
| `useIsOnline(client, …)` | `useConnectionLifecycle(client, …)` (returns nothing) | P.2 |
| `useMutedChannels(channel)` | `useMutedChannels()` | P.3 |
| `OfflineStoreApis.*({ currentUserId })` | `{ userId }` | P.6 |
| `<MessageList loadMore / loadMoreRecent / hasMore / loadingMore>` | removed — the list pages its own paginator | P.7 |
| `useMessageList({ threadList })` | `useMessageList({ paginator: useMessagePaginator() })` | P.8 |
| `useChatContext().appSettings` / `.mutedUsers` / `.channel` / `.enableOfflineSupport` | `await getAppSettings()` / `useMutedUsers()` / your navigation state / `client.offlineDb !== undefined` | P.11 |
| `useClientMutedUsers(client)` / `useAppSettings(…)` | `useMutedUsers()` / `useChatContext().getAppSettings()` | P.12 |
| `<Channel preSendMessageRequest>` | a `sendMessageRequest` handler that calls `defaultRequest(params)` | P.17 |
| `useChannelsContext().channels` / `hasNextPage` / `loadingChannels` | `useStateStore(useChannelsContext().paginator.state, selector)` | P.20 |
| `<Channel isMessageAIGenerated>` / `useMessageContext().isMessageAIGenerated` | `<Chat isMessageAIGenerated>` / `useChatContext().isMessageAIGenerated` | Q.3 |
| `client.offlineDb.syncManager.syncStatus` | `client.offlineDb.syncManager.isSynced` | §N.3 |

## Breaks that compile

These compile cleanly in TypeScript, or are silently ignored in plain JavaScript, and change behaviour at
runtime. Check every row whose Detect finds something; a green build does not cover them. `rg …` below is short
for `rg -n -t js -t ts -g '!**/node_modules/**' … .` run from the app root.

| Symptom | Cause | Detect | Fix | § |
| --- | --- | --- | --- | --- |
| Translation overrides stop applying; a non-English UI renders English | v9 keys were the English copy; v10 keys are dotted ids, and the 12 bundled non-English dictionaries are gone. An old key never matches | `rg -e "registerTranslation" -e "t\(\s*'[A-Z]" -e "'a11y/"` | Rename keys with the key map, register your own dictionaries, type them as `TranslationDictionary` | §19 |
| An override of "{{count}} new messages" (and four other count strings) no longer applies | They are plural keys now; the bundled English plural wins over a bare-key override | `rg -t json -e 'newMessages\.text' -e 'withCount' -e 'unreadCount\.accessibilityLabel' -e 'reactionList\.more' -e 'avatar\.channel\.group'` | Provide the `_one` / `_other` forms | Q.1 |
| Dates render blank, `Invalid Date`, or in 1970 / far future | Server timestamps are unix-nanosecond numbers (`TimestampNS`); `new Date(ts ?? …)`, date libraries and arithmetic with `Date.now()` compile | `rg -e 'new Date\(' -e 'dayjs\(' -e 'moment\('` (review the ones given a server field such as `created_at`) | `convertTimestampToDate(ts)` at the boundary; compare raw numbers | §17.5 |
| Dates stay English after registering a language | Two copies of `dayjs` (the app pins a different version); the locale registers on the copy the SDK does not use | `npm ls dayjs` (or the package manager's equivalent) | One `dayjs` copy, range-compatible with `^1.11.23`; do not declare `i18next` | §19, §R.1 |
| Channel name, image or attachment metadata renders empty; `isMessageAIGenerated` returns false | Custom fields moved under `.custom` (`channel.data.custom.name`, `message.custom.ai_generated`, `attachment.custom.mime_type`) | `rg -e '\.data\??\.name\b' -e '\.data\??\.image\b' -e '\.mime_type\b' -e '\.file_size\b' -e '\.ai_generated\b'` | Read `custom`; `useChannelName(channel)` for names | §17.1, §R.8 |
| User fields you connect with (`imageUrl`, `nickname`, …) are lost | `connectUser` takes a `ClientUser`; extra top-level keys are rejected only in an object literal passed inline | `rg -B8 'connectUser\('` | Avatar in `image`, other app fields under `custom` | §R.8 |
| A `connection.changed` listener never fires | The event is no longer dispatched | `rg "connection\.changed"` | Delete it; read `useNetworkConnectionState()` / `useSettledWSConnectionHealth()` or `client.wsConnection.state` | §L, §R.2 |
| Offline banners always or never show (plain JS) | `useChatContext().isOnline` / `connectionRecovering` are gone; `useNetworkConnectionState().isOnline` is tri-state (`undefined` = unknown) | `rg -e '\bisOnline\b' -e '\bconnectionRecovering\b'` | Test `isOnline === false`, never `!isOnline` | §R.2 |
| A `connection.recovered` listener now runs on every app foreground | It fires on every reconnect path, including background → foreground | `rg "connection\.recovered"` | Make the listener idempotent and cheap | §L.2 |
| Channels or the open channel load twice after a reconnect | The client recovers lists, active channels and threads itself; an app-side re-query or re-watch duplicates it | `rg -e 'connection\.changed' -e 'connection\.recovered' -e 'recoverState'` | Delete the app's reconnect re-query / re-watch | §L, §L.1 |
| A custom channel or thread screen not built on `<Channel>` / `<Thread>` is not refreshed after a reconnect | Recovery reloads only `active` channels and threads | Review screens that render messages without `<Channel>` / `<Thread>` | `useEffect(() => channel.activate(), [channel])` (same for `thread`); no `deactivate()` exists | §K.4, §L.4 |
| The channel list never updates live | Its `ChannelPaginator` is not registered on `client.channelManager` | `rg -e 'new ChannelPaginator' -e 'insertPaginator'` | `client.channelManager.insertPaginator({ paginator })` before `connectUser` | §18.6 |
| Channel-list callbacks (`onNewMessage`, `onAddedToChannel`, …) and `filters` / `sort` / `options` props do nothing (plain JS) | The props are removed; the list is a projection of its paginator's query | `rg '<ChannelList' -A15` | Move the query onto the paginator; global handlers via `client.channelManager.addEventHandler` | §18, §18.6 |
| A channel no longer jumps to the top on a new message, or the order differs from v9 | No default promote-to-top; the order follows `sort`; a list without `sort` sorts by recency | `rg 'new ChannelPaginator' -A12` | Pass an explicit `sort`; `paginator.boost(cid)` to float a channel | §18.5, §N.4 |
| A custom channel preview shows stale name, unread count or last message | Rows re-render only when their own channel changes; direct reads of `channel.data` / `channel.state` do not subscribe | Review custom `ChannelPreview*` overrides | `useChannelName(channel)`, `useStateStore(channel.state, selector)` | P.20, §K.1 |
| A component reading `channel.state.members` / `.read` / `.typing` stops re-rendering | The getters return the current value but do not subscribe | `rg -e 'state\??\.members\b' -e 'state\??\.read\b' -e 'state\??\.typing\b' -e 'state\??\.watchers\b' -e 'state\??\.watcher_count\b'` | `useStateStore(channel.state, selector)` | §K.1 |
| Writing `channel.data.x = …` does not update the UI | Only a store write notifies subscribers | `rg '\.data\.\w+\s*=[^=]'` | Reassign `channel.data = { ...channel.data, x }` | §K.5 |
| Removed `<Channel>` props do nothing (plain JS): `do*Request`, `preSendMessageRequest`, throttle props, `messageId`, `maximumMessageLimit`, `allowSendBeforeAttachmentsUpload`, `enableOfflineSupport`, `isMessageAIGenerated`, `thread`, `threadList`, `isOnline` | Moved to `client.config`, `<Chat>`, `<Thread>`, or removed | `rg '<Channel\b' -A20` | Apply the section for each prop | §8, §10.2, §13, §13.1, §O, P.17, Q.3 |
| Action handlers passed to a `<Message>` (`handleDelete`, `messageActions`, …) are ignored | The action menu reads them from `<Channel>` props | `rg '<Message\b' -A10` | Set them on `<Channel>` | §15.1 |
| Reactions or edits appear twice, or flicker | Reactions and edits are always optimistic now; an app-side optimistic layer double-applies | Review custom reaction / edit code | Remove the app's optimistic update | §9, §M.1 |
| An unhandled promise rejection after a failed send | `sendMessage` rejects instead of swallowing the error | `rg '\bsendMessage\('` | Catch the rejection in custom send paths | §16.2 |
| Opening a channel loads 25 messages instead of ~100 | `<Channel>` applies a page size of 25 unless one is registered | Review | `client.config.set({ channel: { messagePaginator: { pageSize } } })` | §16.1 |
| A page size or other paginator value set at runtime reverts | Imperative `updateConfig()` / `pageSize =` is dropped when the configuration re-resolves | `rg -e 'messagePaginator\.pageSize\s*=' -e 'messagePaginator\.updateConfig\('` | Register it with `client.config.set`, or in a setup function | §13.1 |
| Link previews appear where they did not before | `linkPreviews.enabled` defaults to `true` (still gated by the channel type's URL enrichment) | Review | `client.config.set({ messageComposer: { linkPreviews: { enabled: false } } })` | §13.1 |
| Users without `upload-file` lose the attach button although uploads go to your own storage | A custom `doUploadRequest` no longer waives the capability | `rg -e 'doUploadRequest' -e 'doFileUploadRequest'` | `attachments: { customCdn: true }` | §13.1 |
| UI offers a feature the client has switched off | Reading raw `serverConfig` / `getConfig()` flags instead of the resolved config | `rg -e 'serverConfig\??\.' -e 'getConfig\(\)'` | Read `channel.config.*` / `composer.config.*` | §13.1 |
| `persistUserOnConnectionFailure` you set is overwritten | `<Chat>` writes it from `enableOfflineSupport` on mount | `rg persistUserOnConnectionFailure` | Enable offline support, or set it after `<Chat>` mounts | §17.7 |
| Sending while attachments upload is on (or off) unexpectedly | `<Chat enableOfflineSupport>` turns `pendingUploadsEnabled` on once, and never back off | `rg -e 'enableOfflineSupport' -e 'pendingUploadsEnabled'` | Register `pendingUploadsEnabled` yourself | §O.3 |
| A deleted channel keeps rendering | `<Channel>` no longer unmounts on `channel.deleted` | `rg '<Channel\b'` | Check `pendingDisposal` above `<Channel>` | P.15 |
| A thread screen reads `thread.text` / `thread.user` as `undefined` (plain JS) | `thread` is the `Thread` instance everywhere; the parent message is on `thread.state` | `rg -e '\bthread\??\.text\b' -e '\bthread\??\.user\b' -e '\bthread\??\.reply_count\b'` | `useStateStore(thread.state, (s) => ({ parentMessage: s.parentMessage }))` | §10 |
| A custom `UnreadMessagesNotification` stops marking the channel read on dismiss | Dismiss goes through its `markRead` prop | `rg UnreadMessagesNotification` | Forward `markRead` | §R.5 |
| `<Channel initializeOnMount={false}>` still sends a request | It runs a non-watching query when the paginator is empty | `rg initializeOnMount` | Seed the paginator before mounting | §R.5 |
| A screen holds a stale channel after a direct message is created | `<Channel>` may render `channel.supersededBy` | Review code that reads the channel from its own prop inside `<Channel>` | Read it from `useChannelContext()` | §R.5 |
| A deep link lands on the newest messages instead of the target | `<Channel>` / `<Thread>` jump back to the newest page when opened on an older one, unless a jump is already landed or loading | Review deep-link code (`rg 'jumpToMessage'`) | Start the jump before `<Channel>` mounts | §8 |
| Plain JS: `stream-chat` calls written for v9 (`addDevice`, `queryChannels` expecting `Channel[]`, `muteUser`, positional arguments) fail at runtime | Request objects, raw `queryChannels`, moved moderation methods, renamed device methods | §R.8 detection | Apply §R.8; anything else in the `stream-chat` guide | §R.8 |
| `channel.query()` no longer updates the message list | Only `watch()` and the paginator place pages | `rg 'channel\.query\('` | Page with `channel.messagePaginator.toTail()` / `toHead()` | §R.7 |
| A watch / presence request throws `No connection id is available…` | It waits for a socket instead of silently dropping `watch` | `rg -e '\.watch\(' -e 'presence:'` | `connectUser()` (or `openConnection()`) first | §R.7 |
| Console shows `stream-chat` info logs | `chatLoggerSystem` is on by default at `info` | Review | `chatLoggerSystem.configureLoggers({ default: { level: 'warn' } })` | §R.8 |
| First launch after the upgrade is cold; queued offline messages are lost | `dbVersion` 16 → 18 reinitializes the offline database | `rg enableOfflineSupport` | Nothing to fix; tell the human | §N.2 |
| Screen-reader dates are spelled out in full instead of "Today" / "Yesterday" | v9's `getDateStringForA11y` is `getCalendarDateStringForA11y` in v10; the name `getDateStringForA11y` now exports a different, more verbose variant | `rg getDateStringForA11y` | Rename to `getCalendarDateStringForA11y` (root import) | §19 |
| `getDateString({ date })` returns `null` (plain JS) | The parameter is `messageCreatedAt` | `rg 'getDateString' -A4` | Rename the parameter | §19 |

---

# Part A — Removed contexts

## 2. `TypingContext` removed → `useStateStore(channel.state, …)`

Removed symbols: `TypingContext`, `TypingProvider`, `useTypingContext`,
`TypingContextValue`, `useCreateTypingContext`.

**Before (v9):**

```tsx
import { useTypingContext } from 'stream-chat-react-native';

const { typing } = useTypingContext();
```

**After (v10):**

```tsx
import { useChannelContext, useStateStore } from 'stream-chat-react-native';
import type { TypingUsersState } from 'stream-chat';

const typingSelector = (state: TypingUsersState) => ({ typing: state.typing });

const { channel } = useChannelContext();
const { typing } = useStateStore(channel.state, typingSelector) ?? { typing: {} };
```

`typing` is still keyed by user id; each value is now the typed `typing.start` event
(`Record<string, EventPayload<'typing.start'>>`). `channel.state` is one flat store (§K), so a
`(s: TypingUsersState) => …` selector is assignable to it.

### 2.1 Typing prop/util changes (if you override the typing indicator)

- **`TypingIndicatorContainerProps`**: the `thread` prop is removed; pass
  `threadId?: string` instead. `typing` is retyped
  `TypingContextValue['typing']` → `TypingUsersState['typing']` (same runtime
  shape).
- **`filterTypingUsers` util** (deep import only in v9 and v10): signature changed
  `({ client, thread, typing })` → `({ client, threadId, typing })` where
  `typing: TypingUsersState['typing']`. Pass `threadId: thread?.id`.

```tsx
// Before
filterTypingUsers({ client, thread, typing });
// After
filterTypingUsers({ client, threadId: thread?.id, typing });
```

## 3. `PaginatedMessageListContext` removed → `useMessagePaginator()` / `channel.messagePaginator`

Removed symbols: `PaginatedMessageListContext`, `PaginatedMessageListProvider`,
`usePaginatedMessageListContext`, `PaginatedMessageListContextValue`,
`useCreatePaginatedMessageListContext`.

The message-list state (messages / hasMore / loading) now lives on the paginator.
**Direction mapping** (non-obvious): the paginator is bi-directional — `tail` =
older messages, `head` = newer.

| Removed context field | Replacement |
|---|---|
| `messages` | `channel.messagePaginator.state.items` |
| `hasMore` (older) | `channel.messagePaginator.state.hasMoreTail` |
| `hasMoreNewer` | `channel.messagePaginator.state.hasMoreHead` |
| `loading` | `channel.messagePaginator.state.isLoading` |
| `loadMore()` (older) | `channel.messagePaginator.toTail()` |
| `loadMoreRecent()` (newer) | `channel.messagePaginator.toHead()` |
| `loadLatestMessages()` | `channel.messagePaginator.jumpToTheLatestMessage()` |

> `next()` / `prev()` exist on the paginator but are **deprecated** aliases of
> `toTail()` / `toHead()` — use the `to*` forms.

**Before (v9):**

```tsx
const { messages, hasMore, loadMore } = usePaginatedMessageListContext();
```

**After (v10):**

```tsx
import { useChannelContext, useStateStore } from 'stream-chat-react-native';
import type { LocalMessage } from 'stream-chat';

const selector = (s: { items?: LocalMessage[]; hasMoreTail: boolean }) => ({
  messages: s.items,
  hasMore: s.hasMoreTail,
});

const { channel } = useChannelContext();
const { messages, hasMore } = useStateStore(channel.messagePaginator.state, selector) ?? {};
const loadMore = () => channel.messagePaginator.toTail();
```

Use `channel.messagePaginator` for the channel message list. For thread replies,
use `useMessagePaginator()` inside the `<Thread>`. Outside a `<Thread>` it returns
`channel.messagePaginator`, so the **main** channel list keeps reading the channel's paginator even
while a thread is open.

---

# Part B — `ChannelContext` value changes

## 4. `ChannelContext` scalar state fields removed → `useStateStore(channel.state, …)`

`useChannelContext()` no longer returns `members`, `read`, `watchers`, or
`watcherCount`. Read them from the one unified `channel.state` store (§K) with a
selector that picks the slice.

| Removed context field | Replacement store | Store state key |
|---|---|---|
| `members` | `channel.state` | `members` |
| `read` | `channel.state` | `read` |
| `watchers` | `channel.state` | `watchers` |
| `watcherCount` | `channel.state` | `watcherCount` |

**Before (v9):**

```tsx
const { members, watcherCount } = useChannelContext();
```

**After (v10):**

```tsx
import { useChannelContext, useStateStore } from 'stream-chat-react-native';
import type { ChannelWatchState, MembersState } from 'stream-chat';

const membersSelector = (s: MembersState) => ({ members: s.members });
const watcherSelector = (s: ChannelWatchState) => ({
  watcherCount: s.watcherCount,
  watchers: s.watchers,
});

const { channel } = useChannelContext();
const { members } = useStateStore(channel.state, membersSelector) ?? { members: {} };
const { watcherCount } = useStateStore(channel.state, watcherSelector) ?? {};
```

`members` is gone from the per-message surface too: `MessageContextValue.members`, the `members` prop of
`<Message>`, `MessageFooter` and `MessageItemView`, and the `members` param of `useCreateMessageContext`. A custom
message footer reads the channel state itself, as above. The built-in footer only needs to know whether the channel is
a 1:1, so it reads `memberCount` (see §R.5).

## 5. `ChannelContext.markRead` removed → `useMarkRead(channel)` / `channel.markReadViaReporter()`

`markRead` is removed from `ChannelContextValue`. Mark-read now fires
automatically inside the SDK (the `useMarkRead` hook is wired into `MessageList` /
`MessageFlashList` / `Channel`), and the read-reporting cadence is owned by the
`stream-chat` client's `messageDeliveryReporter` — the SDK's own 500ms
throttle/debounce is gone.

> **Replacement hook: `useMarkRead(channel)`** (exported; new in v10). It returns
> a stable `markRead(options?)` callback — the drop-in replacement for the old
> context `markRead`. Most apps can just **drop manual calls** (mark-read is
> automatic now). For a one-off imperative call use `channel.markReadViaReporter()`.
> **`channel.markRead()` is now the direct request**: it skips the delivery reporter and
> any `markReadRequest` handler you registered, and it throws when read events are
> disabled.

**Before (v9):**

```tsx
const { markRead } = useChannelContext();
markRead();
```

**After (v10):**

```tsx
import { useChannelContext, useMarkRead } from 'stream-chat-react-native';

const { channel } = useChannelContext();
const markRead = useMarkRead(channel); // 1:1 replacement for the old context markRead
markRead();
// or, imperatively (no hook): await channel.markReadViaReporter();
```

A custom mark-read handler is still honored, but it is no longer a `Channel` prop —
register it as `client.config.set({ channel: { requestHandlers: { markReadRequest } } })`.
See §13.1.

## 6. Message targeting / highlight removed → `messagePaginator.messageFocusSignal`

Removed symbols: `ChannelContext.targetedMessage`,
`ChannelContext.setTargetedMessage`, `MessagesContext.targetedMessage`, and the
`useTargetedMessage` hook (deleted, no replacement hook). List props
`targetedMessage` / `setTargetedMessage` are removed too (see §12).

Highlighting is now driven by the paginator's `messageFocusSignal`, which
auto-clears after `DEFAULT_HIGHLIGHT_DURATION` (3000ms). Read it per row with
`useIsTargetedMessage(messageId)` — `ChannelContext.highlightedMessageId` is
**removed**, because a context value that changed on every jump re-rendered every
consumer (i.e. every message row) instead of just the two rows whose highlight
actually changed.

**Before (v9):**

```tsx
const { setTargetedMessage } = useTargetedMessage(); // or from useChannelContext()
setTargetedMessage(messageId);
```

**After (v10):**

```tsx
import { useMessagePaginator, useIsTargetedMessage, DEFAULT_HIGHLIGHT_DURATION } from 'stream-chat-react-native';

// Jump to + highlight a message (loads it if not in the current window).
// useMessagePaginator resolves to the thread's reply list inside a `<Thread>`,
// and the channel's main list otherwise.
const paginator = useMessagePaginator();
await paginator?.jumpToMessage(messageId, {
  focusReason: 'jump-to-message',
  focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
});

// Is THIS row the highlighted one? (auto-clears after ~3s)
const isTargeted = useIsTargetedMessage(messageId);
```

## 7. Unread state moved to the paginator

Removed symbols: `ChannelContext.channelUnreadStateStore`,
`ChannelContext.setChannelUnreadState`, and the related list /
notification / button props (`channelUnreadStateStore`, `setChannelUnreadState`
on `MessageListProps`; `channelUnreadStateStore` on
`UnreadMessagesNotificationProps`; `unreadCount` on `ScrollToBottomButtonProps`).

The unread snapshot now lives on `channel.messagePaginator.unreadStateSnapshot`
(a `StateStore` of `UnreadSnapshotState`). Read it with `useStateStore`, or
`getLatestValue()` for a one-off read. The SDK's own `ChannelUnreadState` type is gone (P.9).

| Removed | Replacement |
|---|---|
| `channelUnreadStateStore` | `channel.messagePaginator.unreadStateSnapshot` |
| `setChannelUnreadState` | (managed internally by the paginator) |
| `ScrollToBottomButtonProps.unreadCount` | self-derived from `channel.state` `read[userId].unread_messages` (undefined in thread lists) |
| `UnreadMessagesNotificationProps.channelUnreadStateStore` | count from `channel.messagePaginator.unreadStateSnapshot` |

`UnreadMessagesNotificationProps` also **adds** an optional
`markRead?: (options?: MarkReadFunctionOptions) => void` (the shared mark-read
used by the dismiss button). Custom overrides of these components no longer
receive/need the removed props — the built-ins self-derive their counts.

### 7.1 App-wide unread badge (advisory — app code, no SDK symbol change)

Compute an app-wide unread total from `channel.countUnread()`, **not** from
`event.total_unread_count`. Under the localized-unread "viewing live" gate, the
active channel reports `0` locally while the server total may still briefly count
it, so the server total can transiently over-count.

```tsx
const total = client.channelManager.values().reduce((n, c) => n + c.countUnread(), 0);
```

`client.activeChannels` no longer exists (§R.7): `client.channelManager.values()` lists the stored channels and
`client.channelManager.get(cid)` returns one.

## 8. `ChannelContext` loaders removed — jump through the paginator

Removed symbols: `ChannelContext.loadChannelAroundMessage`,
`ChannelContext.loadChannelAtFirstUnreadMessage`, `ChannelContext.reloadChannel`,
`ChannelContext.loading`, `ChannelContext.highlightedMessageId`.

These were read-only context values (never `<Channel>` props), so the only code
affected is code that *read* them from `useChannelContext()`. Every one of them
has a direct equivalent on the paginator, which is where the state already lived
— the context was forwarding it, and that forwarding re-rendered every consumer
on channel traffic.

| v9 | v10 |
|---|---|
| `loadChannelAroundMessage({ messageId })` | `paginator.jumpToMessage(messageId, { focusReason: 'jump-to-message', focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION })` |
| `<Channel messageId={id} />` | the same `paginator.jumpToMessage(...)`, from a `useLayoutEffect` or before `<Channel>` mounts — the prop is **removed** (see below) |
| `loadChannelAtFirstUnreadMessage()` | `paginator.jumpToTheFirstUnreadMessage({ focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION })` |
| `reloadChannel()` | `paginator.jumpToTheLatestMessage()` |
| `loading` | `useStateStore(paginator.state, (s) => ({ loading: !!s.isLoading && !s.items?.length }))` |
| `highlightedMessageId` | `useIsTargetedMessage(messageId)` (§6) |

### The `messageId` prop is removed

`<Channel messageId={id} />` only ever called `jumpToMessage` for you, so it is gone: target a
message by calling the paginator yourself.

```tsx
useLayoutEffect(() => {
  if (!channel || !messageId) return;
  channel.messagePaginator.jumpToMessage(messageId, {
    focusReason: 'jump-to-message',
    focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
  });
}, [channel, messageId]);
```

**Use `useLayoutEffect`, not `useEffect`.** React runs every layout effect before any passive one,
and the message list decides its initial anchor in a passive effect — so a layout effect lands first
and you get no scroll-to-bottom-then-jump. Starting the jump before `<Channel>` mounts (where you
navigate) works too, and is the safer order when the channel may have been left on an older page
(next paragraph): a layout effect in the screen runs after `<Channel>`'s own layout effects.

`<Channel>` reads the paginator's focus signal, so it will not override a jump you have **already
completed** with its own jump to the first unread.

**Reopening on an older page.** A channel's and a thread's paginator outlive the screen. When
`<Channel>` or `<Thread>` mounts on a paginator left on an older page (after a jump to a quoted, pinned
or searched message), it jumps back to the newest messages before the first paint. It skips this when a
jump has already landed or is still loading at mount, when it is about to jump to the first unread, and
under `<Channel initializeOnMount={false}>`. With `initializeOnMount={false}`, call the exported
`useJumpToLatestOnOpen()` from a component inside `<Channel>` / `<Thread>` if you want the same behaviour.

**If you also use `initialScrollToFirstUnreadMessage`, turn it off while deep-linking:**

```tsx
<Channel channel={channel} initialScrollToFirstUnreadMessage={!messageId} />
```

Opening at the first unread and jumping to a specific message are two answers to the same question,
and `<Channel>` cannot see a jump that is still *in flight* — `jumpToMessage` emits its focus signal
only once the query lands, which for a message that is not loaded yet is a round trip away. The
removed prop encoded this precedence internally (`!messageId && initialScrollToFirstUnreadMessage`);
the caller states it now. With both enabled at once the two jumps race and the last one wins.

where `const paginator = useMessagePaginator()` — thread-aware: the thread's
reply paginator inside a `<Thread>`, the channel's otherwise. Use
`channel.messagePaginator` directly if you specifically want the channel list.

The jump methods emit `messageFocusSignal`, which drives both the highlight and
the scroll-to-target, so the old `setTargetedMessage` callbacks have no analogue
and are not needed.

---

# Part C — Message operations

## 9. Message operations removed from `MessagesContext`

Removed from `MessagesContextValue`: `deleteMessage`, `deleteReaction`,
`sendReaction`, `removeMessage`, `retrySendMessage`, `updateMessage` (which also
lost its `extraState` / `throttled` params), plus `targetedMessage` (§6). They
moved to the exported `useMessageOperations()` hook (returning a
`MessageOperations` object).

> **Replacement hook: `useMessageOperations()`** (exported; new in v10). It
> returns the same six ops with the optimistic + thread-aware behavior the old
> context methods had — the drop-in replacement for the removed
> `useMessagesContext()` ops. **Custom `Message` overrides also still receive all
> six as props** (the built-in `Message` spreads them in), so override users need
> no change. Prefer the hook over raw `channel.*` requests: for **reactions**
> especially, the hook applies the optimistic update that raw
> `channel.sendReaction` skips (raw `channel.sendReaction` only renders once the
> WS echo lands).

The hook's op signatures:

```ts
sendReaction(type: string, messageId: string): Promise<void>;
deleteReaction(type: string, messageId: string): Promise<void>;
deleteMessage(message: LocalMessage, options?): Promise<void>;
retrySendMessage(message: LocalMessage): Promise<void>;
removeMessage(message: { id: string; parent_id?: string }): Promise<void>;
updateMessage(updatedMessage: MessageResponse | LocalMessage): void; // single-arg now
```

`updateMessage` is retyped to a single argument (was
`(msg, extraState?, throttled?) => void`). This also affects
`MessageProps.updateMessage` overrides. `useMessageActions` now takes no
arguments at all (§15.1).

> **Note (behavioural):** reactions are now **always** optimistic, with or without
> `enableOfflineSupport` (v9 applied them optimistically only with offline support
> on). A reaction that fails definitively is rolled back and the promise rejects; one
> queued for offline replay keeps its optimistic state. Remove any reaction
> optimism of your own, or it applies twice.

**Before (v9):**

```tsx
const { sendReaction, deleteMessage, updateMessage } = useMessagesContext();
```

**After (v10) — via the exported hook (preferred):**

```tsx
import { useMessageOperations } from 'stream-chat-react-native';

const { sendReaction, deleteReaction, deleteMessage, updateMessage } = useMessageOperations();
await sendReaction(type, messageId); // optimistic + thread-aware
await deleteReaction(type, messageId);
await deleteMessage(message);
```

**After (v10) — from a custom `Message` override (still props):**

```tsx
const MyMessage = ({ sendReaction, deleteMessage, updateMessage }) => { /* … */ };
```

**Lower level (non-React call sites):** `channel.messageOperations` — `send`,
`update`, `retry`, `delete({ localMessage, options })`,
`addReaction({ messageId, reaction })`, `deleteReaction({ messageId, type })` —
runs the same optimistic lifecycle as the hook; `thread.messageOperations` does
the same for replies loaded in a thread. Plain `channel.sendMessage` / `channel.sendReaction`
are HTTP-only and apply no optimistic update, so use the hook in UI code.

### 9.1 Optimistic lifecycle is LLC-owned (behavioral)

Do **not** hand-roll optimistic message/reaction state. The
`channel.messageOperations` / `thread.messageOperations` engine + the message
paginators + the offline DB own the pending → received/failed lifecycle. Custom
optimistic layers will double-apply or conflict.

---

# Part D — Threads

## 10. Thread API: instance-based, rendered by a standalone `<Thread>`

This is the largest behavioral shift. A thread is a `stream-chat` `Thread` instance, and
`<Thread thread={thread}>` renders it on its own, next to `<Channel>` rather than inside it.
`ThreadContextValue` is reduced to **two fields**; everything else is derived from `thread`. The separate
`threadInstance` field is gone: `thread` is the instance now.
Opening and closing a thread is up to the app (no imperative `openThread` / `closeThread`).

**`ThreadContextValue` now = `{ thread?: Thread, allowThreadMessagesInChannel: boolean }`.**

Only `<Thread>` provides it. `useThreadContext()` no longer throws outside a provider: everywhere
else it returns `{ thread: undefined, allowThreadMessagesInChannel: false }`, and an `undefined`
`thread` is how a component knows it is not rendering a thread.

> **`thread` keeps its name but changes type.** In v9 `useThreadContext().thread` was the parent
> `LocalMessage`. In v10 it is the `Thread` instance. `thread.id` is the same value in both, since a
> thread's id is its parent message's id. Message fields such as `thread.text` or `thread.user` are
> now on `thread.state.getLatestValue().parentMessage`. TypeScript reports those reads as errors,
> while plain JavaScript gets `undefined`. The same applies to `useMessageComposerContext().thread`
> and the `thread` prop of `<Thread>`.

Removed or retyped fields (all derivable from `thread`):

| v9 `ThreadContext` field | v10 (off `thread`) |
|---|---|
| `thread` (parent message) | `thread.state.getLatestValue().parentMessage` (reactive via `useStateStore`) |
| `threadMessages` | `thread.messagePaginator.state.items` |
| `loadMoreThread` | `thread.messagePaginator.toTail()` |
| `loadMoreRecentThread` | `thread.messagePaginator.toHead()` |
| `threadHasMore` | `thread.messagePaginator.state.hasMoreTail` |
| `threadLoadingMore` / `threadLoadingMoreRecent` | `thread.messagePaginator.state.isLoading` |
| `reloadThread` | `thread.reload()` |
| `threadInstance` | `thread` |
| `openThread` / `closeThread` / `setThreadLoadingMore` | removed - see 10.1 |
| `parentMessagePreventPress` | removed from the context - a `<ThreadFooterComponent>` prop, default `true` |
| `onAlsoSentToChannelHeaderPress` | moved to `MessagesContext`; still a prop on `<Channel>` and `<Thread>` |

```tsx
import { useThreadContext, useStateStore } from 'stream-chat-react-native';

const { thread } = useThreadContext();
const { parentMessage } = useStateStore(thread?.state, (s) => ({
  parentMessage: s.parentMessage,
}));
const { replies } = useStateStore(thread?.messagePaginator.state, (s) => ({
  replies: s.items,
}));
```

### 10.1 `<Thread thread>` is a sibling of `<Channel>`

There is no imperative `openThread` / `closeThread`, and `<Channel>` has no `thread` or
`threadList` prop. Lift the selected thread into your own state (or navigation params) from a
list's `onThreadSelect`, then render `<Thread thread={thread}>` with the thread UI as its children.
`<Thread>` needs no `<Channel>` above it: it uses `thread.channel`.

```diff
- <Channel channel={channel} thread={thread} threadList>
-   <Thread />
- </Channel>
+ <Thread thread={thread} onThreadDismount={() => setThread(undefined)}>
+   <MessageList />
+   <MessageComposer />
+ </Thread>
```

```tsx
// Channel screen
<Channel channel={channel}>
  <MessageList onThreadSelect={(thread) => navigation.navigate('ThreadScreen', { thread })} />
  <MessageComposer />
</Channel>

// Thread screen
<Thread thread={route.params.thread}>
  <MessageList />
  <MessageComposer />
</Thread>
```

- **Children, not a built-in layout.** `<Thread>` renders `{children}`; compose `MessageList` (or
  `MessageFlashList`) and `MessageComposer` yourself. Inside a `<Thread>`, `MessageList` defaults its
  `FooterComponent` and `MessageFlashList` its `HeaderComponent` to `ThreadFooterComponent`, so the
  parent message renders above the replies as before.
- **Same configuration props as `<Channel>`.** `<Thread>` accepts the shared configuration props
  (`messageActions`, `onPressMessage`, `supportedReactions`, `keyboardVerticalOffset`, `topInset`,
  `audioRecordingEnabled`, `onAlsoSentToChannelHeaderPress`, ...), so pass the same set you pass to
  your `<Channel>`. Thread-only props: `allowThreadMessagesInChannel` (default `true`),
  `notificationHostId`, and `onThreadDismount`.
- **Lifecycle.** `<Thread>` activates the thread (it marks itself read while open and reloads when
  stale), loads the first reply page when nothing is loaded yet, and, for a thread opened from the
  thread list whose channel nothing has queried, watches that channel once so capabilities are
  known. It does **not** run the channel's open sequence: opening a thread no longer marks the
  channel read.

Every thread API takes and passes a `stream-chat` `Thread` instance. `onThreadSelect` is
`(thread: Thread) => void` on `MessageList`, `MessageFlashList`, `Message` and `ThreadList`. The
parent message is on `thread.state.getLatestValue().parentMessage` and the channel on
`thread.channel`.

`ThreadType` (`{ thread: LocalMessage; threadInstance: Thread }`) is removed. Where you only have
the message, for example from a push notification, a deep link or a draft, build the thread with
`client.threads.ensure`. It returns the instance the client already holds for that parent, or
registers a new one.

```diff
- navigation.navigate('ThreadScreen', { thread: parentMessage });
+ navigation.navigate('ThreadScreen', {
+   thread: client.threads.ensure({ channel, parentMessage }),
+ });
```

```diff
- <ThreadList onThreadSelect={({ thread, threadInstance }, channel) => open(threadInstance, channel)} />
+ <ThreadList onThreadSelect={(thread) => open(thread, thread.channel)} />
```

`onAlsoSentToChannelHeaderPress` receives `{ targetedMessageId, thread? }`. `thread` replaces
`parentMessage` and is set when the header is pressed in a channel list.

### 10.2 Removed thread-related props / context fields

- **`<Channel>`**: `thread`, `threadList`, `allowThreadMessagesInChannel` (now a `<Thread>` prop) and
  `shouldSyncChannel` removed. A `<Channel>` only ever renders its channel's main list and always runs its own
  lifecycle (v9 apps passed `shouldSyncChannel={false}` to a `<Channel>` that only hosted a thread); render a
  `<Thread>` for replies.
- **`ThreadProps`**: removed `closeThread`, `loadMoreThread`, `reloadThread`, `threadInstance`,
  `additionalMessageListProps`, `additionalMessageFlashListProps`, `additionalMessageComposerProps`,
  `shouldUseFlashList`, `autoFocus`,
  `disabled`, `closeThreadOnDismount` and `parentMessagePreventPress`. `thread` is required and is
  the `Thread` instance (it was the parent message). Configure the list and composer through their
  own props (they are your children now), use `onThreadDismount` for cleanup on unmount, and pass
  `parentMessagePreventPress` to `ThreadFooterComponent`.
- **`ThreadMessageComposer` slot**: removed from `WithComponents`. Render the composer you want as a
  child of `<Thread>`.
- **`MessageList` slot**: removed from `WithComponents`. In v9 only `<Thread>` read it, to render the
  thread's list; `<Thread>` now renders its children, so render the list you want as a child.
- **`threadList`**: removed everywhere - `ChannelContextValue.threadList`,
  `MessageContextValue.threadList`, the `threadList` prop of `Message`, `MessageList`,
  `MessageFlashList` and `MessageComposer`, and `useIncomingMessageAnnouncements({ threadList })`.
  Use `useThreadContext().thread` to tell whether a subtree renders a thread. Components that took a
  `threadList` prop now take `thread` (`Thread | undefined`): `MessageItemView`,
  `SentToChannelHeader` and `ShowThreadMessageInChannelButton`.
- **`MessageComposerContextValue`** (deep import only in v9 and v10): `thread` is now the `Thread` instance (it was the parent
  message).
- **`ThreadFooterComponentProps`**: `thread` removed; the type is now
  `{ parentMessagePreventPress?: boolean }`, and `parentMessagePreventPress` defaults to `true`. Read
  `thread` via `useThreadContext()` inside a custom footer and get the parent/`replyCount` off
  `thread.state`.
- **`MessageReplies`**: no longer knows about threads. `MessageItemView` hides the replies row inside
  a `<Thread>`; a custom layout that renders `MessageReplies` directly inside a thread must check
  `useThreadContext().thread` itself (v9 hid it).
- **`MessageProps`**: removed `openThread` (§9).

### 10.3 Behavior inside a `<Thread>`

- `useMessagePaginator()` resolves to `thread.messagePaginator` inside a `<Thread>` and to
  `channel.messagePaginator` everywhere else. `useChannel()` resolves to `thread.channel` inside a
  `<Thread>`.
- Rows read the thread's paginator: the unread separator comes from
  `thread.messagePaginator.unreadStateSnapshot`, and the newest reply gets the last-bubble style.
  `MessageContextValue.isVeryLastMessage` (new, optional) marks the newest row of the list a
  message renders in; the thread's parent message is never marked.
- The scroll-to-bottom button in a thread jumps the thread's replies and does not mark the channel
  read (the thread marks itself read while open).

## 11. `InputMessageInputContextValue.editMessage` removed

`editMessage` is gone from the message input context, along with `sendMessage` as a value you pass
in. Submitting goes through the composer; see P.17.

---

# Part E — Component props

## 12. `MessageList` / `MessageFlashList` props

Removed props (from both list components): `channelUnreadStateStore`,
`setChannelUnreadState`, `setTargetedMessage`, `targetedMessage`, `threadHasMore`, `loadMoreThread`,
`loadMoreRecentThread`, `threadInstance`, `loadChannelAroundMessage`, `loading`, `reloadChannel`,
`maximumMessageLimit` (O.1), plus `highlightedMessageId` on `MessageFlashList`. The list now reads
thread state from the `Thread` in `ThreadContext`, unread from the paginator snapshot (§7), and
targeting from the focus signal (§6) — all internally. `allowSendBeforeAttachmentsUpload` became
`pendingUploadsEnabled` (O.3).

`thread` is **not** removed: it is retyped `LocalMessage | null` → `Thread | undefined`. Leave it out inside a
`<Thread>` (the list reads the one in `ThreadContext`); `threadList` is gone (§10.2).

The paging props `loadMore`, `loadMoreRecent`, `hasMore`, `loadingMore` and `loadingMoreRecent` are
removed too: the list pages its own paginator (P.7). `markRead` is still passed.

### 12.1 Custom `FooterComponent` / `HeaderComponent` receive `loadingMore` as a prop

The inline loading indicators no longer read `loadingMore` /
`loadingMoreRecent` from `PaginatedMessageListContext`; the list owns those flags
and passes them as props.

- **`MessageList`** (inverted): custom `FooterComponent` now receives
  `{ loadingMore?: boolean }` as a prop.
- **`MessageFlashList`**: custom `HeaderComponent` now receives
  `{ loadingMore?: boolean }` as a prop.

**Before (v9):**

```tsx
const MyFooter = () => {
  const { loadingMore } = usePaginatedMessageListContext();
  return loadingMore ? <Spinner /> : null;
};
```

**After (v10):**

```tsx
const MyFooter = ({ loadingMore }: { loadingMore?: boolean }) =>
  loadingMore ? <Spinner /> : null;
```

No-prop override components remain assignable (the prop is optional), so
overrides that don't read the flag need no change.

The **newer** end gets nothing: a custom `HeaderComponent` (`MessageList`) or `FooterComponent`
(`MessageFlashList`) is rendered with no props, and with `PaginatedMessageListContext` gone there is no
SDK source for `loadingMoreRecent`. Read `isLoading` from the paginator instead
(`useStateStore(useMessagePaginator()?.state, selector)`); it is not direction-specific.

## 13. `ChannelProps`

Removed props: `messages`, `loadingMore`, `loadingMoreRecent`, `threadMessages`,
`setThreadMessages` — message/thread-reply state now lives in the LLC paginator,
so these are no longer inputs. Drop them.

Also removed, and covered in §13.1:

| Removed prop | v10 replacement |
|---|---|
| `doMarkReadRequest` | `client.config.set({ channel: { requestHandlers: { markReadRequest } } })` |
| `doUpdateMessageRequest` | `client.config.set({ channel: { requestHandlers: { updateMessageRequest } } })` |
| `doFileUploadRequest` | `client.config.set({ messageComposer: { attachments: { doUploadRequest } } })` |
| `stateUpdateThrottleInterval` | `client.config.set({ channel: { messagePaginator: { stateThrottleMs } } })` |
| `newMessageStateUpdateThrottleInterval` | same as above |

`stateThrottleMs` replaces both throttle props.

`doSendMessageRequest` is removed like every other `do*Request` prop — register a
`sendMessageRequest` through `client.config` instead (§13.1). `stream-chat` awaits attachment
uploads before any handler runs.

## 13.1 Instance configuration → `client.config`

v10's `stream-chat` ships a declarative configuration API for the objects the SDK builds
on your behalf — channels, threads, message composers, paginators, the client's own
managers. Several `<Channel>` props are gone because this replaced them, and a number of
values that were previously unreachable are now settable.

### Where to register it

At the client, **not** from a component effect:

```tsx
const client = StreamChat.getInstance(apiKey);

client.config.set({
  channel: {
    messagePaginator: { pageSize: 50, stateThrottleMs: 250 },
    readEvents: { enabled: false },
  },
  messageComposer: {
    drafts: { enabled: true },
    attachments: { doUploadRequest: myUpload, customCdn: true },
  },
});
```

Some configuration is read once when an instance is constructed, and channels are
constructed by `client.channel()` / `client.queryChannels()` — which an app typically
calls before or during the same commit that mounts `<Chat>`. Registering from a
`useEffect` runs after that, so those values arrive too late for instances that already
exist. There is deliberately no `<Chat>` prop for this: binding registration to a
component lifecycle would recreate that ordering problem.

### Request handlers

The `doMarkReadRequest`, `doUpdateMessageRequest` and `doFileUploadRequest` props are
removed (§13). Register the handlers instead:

```tsx
// v9
<Channel channel={channel} doUpdateMessageRequest={myUpdate}>…</Channel>

// v10
client.config.set({
  channel: {
    requestHandlers: {
      updateMessageRequest: async ({ localMessage, options }) => ({
        message: await myUpdate(localMessage, options),
      }),
    },
  },
});
<Channel channel={channel}>…</Channel>
```

Three things change with it:

- **The signature is the LLC's, not the prop's.** Handlers take a single params object
  (`{ localMessage, options }`, plus `message` for send) and must return `{ message }`.
  The props took positional arguments; an adapter inside the SDK filled in the rest.
- **Registration is per client**, not per mounted subtree. If you were passing different
  handlers to different `<Channel>` instances, branch inside one handler on the
  `localMessage.cid` you receive.
- **Thread-scoped handlers** go under the `thread` key with the same shape.

The send prop moves the same way. `sendMessageRequest` also receives the wire-ready `message`
(`MessageRequest`, attachment uploads already resolved), and `retrySendMessageRequest` is a
separate slot — register the same function in both to keep v9's behaviour, where one prop
covered send and retry:

```tsx
// v9
<Channel channel={channel} doSendMessageRequest={(channelId, message, options) => mySend(channelId, message, options)}>

// v10
const sendMessageRequest = async ({ localMessage, message, options }) => {
  const response = await mySend(localMessage.cid, message, options);
  return { message: response.message };
};
client.config.set({
  channel: { requestHandlers: { retrySendMessageRequest: sendMessageRequest, sendMessageRequest } },
});
```

If your handler resolves without a `message`, nothing is sent a second time — v9 fell back to
`channel.sendMessage`, which sent the message twice. Return the server's response to update the
message straight away; otherwise the `message.new` event reconciles it.

### Behaviour, not values → setup functions

Values go in `set()`. Reach for a setup function when what you are changing is behaviour
that no value can express — middleware, comparators:

```tsx
client.config.setSetupFunction('messageComposer', ({ composer }) => {
  composer.textComposer.middlewareExecutor.insert({ /* … */ });
});
```

This replaces `client.setMessageComposerSetupFunction(fn)`, which is deprecated in the
LLC. A setup function is also what makes a per-instance change survive
`client.config.reset()` — reset re-runs setup functions but discards imperative
`updateConfig()` calls made outside one.

### Read the resolved value, never the raw server flag

Several channel-type flags now resolve **into** the instance's own configuration, ANDed
with whatever you registered — either side can switch a feature off, neither can widen:

| Read this | …instead of |
|---|---|
| `channel.config.typingEvents.enabled` | `channel.serverConfig?.typing_events` |
| `channel.config.readEvents.enabled` | `…?.read_events` |
| `channel.config.replies.enabled` | `…?.replies` |
| `channel.config.userMessageReminders.enabled` | `…?.user_message_reminders` |
| `channel.config.deliveryEvents.enabled` | `…?.delivery_events` |
| `channel.config.availableCommands` | `…?.commands` |
| `composer.config.attachments.enabled` | `…?.uploads` |
| `composer.config.polls.enabled` | `…?.polls` |
| `composer.config.linkPreviews.enabled` | `…?.url_enrichment` |
| `composer.config.location.enabled` | `…?.shared_locations` |
| `composer.config.text.maxLengthOnSend` | `…?.max_message_length` |

Gating UI on the raw flag offers features the client has already disabled. Both
`channel.configState` and `composer.configState` are reactive stores, so
`useStateStore(channel.configState, selector)` re-renders when a value moves — define
the selector at module scope.

`channel.getConfig()` is **removed**; `channel.serverConfig` is a getter returning the
same value. Note it is a getter, so `jest.spyOn(channel, 'getConfig')` has no direct
equivalent — write to `client.channelServerConfigsStore` in tests instead.

`client.configs` is also gone → `client.channelServerConfigs`, still keyed by cid.

### Two silent behaviour changes

Neither produces a compile error.

- **`linkPreviews.enabled` now defaults to `true`.** It was `false`, and the manager used
  to AND the channel type's `url_enrichment` itself; that gate moved into resolved
  configuration. Net effect: link previews turn **on** wherever enrichment is enabled
  server-side. Opt out with
  `client.config.set({ messageComposer: { linkPreviews: { enabled: false } } })`.
- **A custom `doUploadRequest` no longer waives the `upload-file` capability.** That
  conflated *how* files are sent with *where* they land. If your uploads go to storage
  Stream does not host, set `attachments: { customCdn: true }` — otherwise uploads are
  refused for users without the capability and the attachment control disappears.

### What this unlocks that no prop could

These had no v9 equivalent — the SDK constructs the objects, so there was nothing to pass
a prop to:

```tsx
client.config.set({
  messagePaginator: { stateThrottleMs: 250, retryCount: 2, lockItemOrder: true },
  channel: { messagePaginator: { pageSize: 50 }, pinnedMessagesPaginator: { pageSize: 25 } },
  thread: { messagePaginator: { pageSize: 25 } },
  client: {
    notifications: { durations: { error: 10_000 } },
    reminders: { scheduledOffsetsMs: [5 * 60_000, 60 * 60_000] },
    messageDelivery: { markAsReadThrottleTimeoutMs: 2000 },
  },
  messageOperations: { failedSendCacheTtlMs: 5 * 60_000 },
});
```

The top-level `messagePaginator` key applies to **every** `MessagePaginator` — the channel
list and thread replies both — because one class backs both. The per-parent slices
(`channel.messagePaginator`, `thread.messagePaginator`) override it field by field, which
is how `pageSize` can differ while `stateThrottleMs` does not.

`client.config.getTree()` dumps everything you have registered, without needing to know
the key names.

### Caveats worth knowing

- **`pageSize` is not `channelQueryOptions.messages.limit`.** The prop sizes the *initial*
  channel query; `pageSize` sizes every *subsequent* page. They are different numbers and
  you usually want both.
- **`<Channel>`'s 25-message default is itself an imperative patch**, applied on mount only
  when no `pageSize` is registered under `channel.messagePaginator` or `messagePaginator`
  (§16.1). Register a value to opt out of it.
- **Imperative `updateConfig()` does not survive a re-derivation**, except on
  `MessageComposer`. `channel.messagePaginator.updateConfig({ pageSize: 200 })` is dropped
  the next time anything re-resolves that paginator's configuration — including a
  `client.config.set()` on an unrelated key, because `Channel` watches `messagePaginator`
  and `messageOperations`. Register the value, or use a setup function.
- **`X.config` is `Readonly`.** Assigning to a field is a compile error; nested writes
  throw at runtime because the defaults are deep-frozen. Use `updateConfig()`.
- **No configuration key reaches a channel-list paginator.** `lockItemOrder` and `doRequest` live on
  the app-owned `ChannelPaginator` (§18.6): set them in its constructor or with `updateConfig()`.

---

# Part F — Hooks

## 14. `useMutedUsers` signature narrowed

The deprecated `(channel)` overload is removed; the hook takes **no argument**
and reads `client.mutedUsersStore`.

```tsx
// Before
const muted = useMutedUsers(channel);
// After
const muted = useMutedUsers(); // UserMuteResponse[]
```

## 15. `useCreate*Context` signatures narrowed

If you build custom context values with the `useCreate*Context` hooks, their
parameter shapes dropped the removed fields:

- `useCreateChannelContext` — no longer accepts the removed `ChannelContext`
  fields (§4/§5/§6/§7).
- `useCreateMessagesContext` — no longer accepts the removed `MessagesContext`
  ops (§9) or `openThread`.
- `useCreateThreadContext` — accepts only `Pick<ThreadContextValue,
  'allowThreadMessagesInChannel' | 'thread'>` (§10).
- `useCreateMessageInputContext` — no longer takes a thread.
- `useCreateTypingContext` and `useCreatePaginatedMessageListContext` are
  **removed entirely** (§2/§3).

## 15.1 `useMessageActions` / `useMessageActionHandlers` take no arguments

Both hooks read everything from the contexts of the message they are called in
(`MessageContext`, `MessagesContext`, `ChannelContext`, `ChatContext`, …), so
the caller no longer collects ~28 arguments from four contexts.
`MessageActionsHookProps` is removed. Call them inside a message: a custom
message component, a custom `MessageActionList`, or overlay content.

```tsx
// Before
const actions = useMessageActions({
  channel,
  client,
  deleteMessage,
  handleDelete,
  message,
  setEditingState,
  t,
  /* … */
});
const handlers = useMessageActionHandlers({ channel, client, message /* … */ });

// After
const actions = useMessageActions(); // same return shape: { copyMessage, deleteMessage, …, handleReaction }
const handlers = useMessageActionHandlers(); // same shape: { handleCopyMessage, …, handleToggleReaction }
```

- `useMessageActionHandlers()` returns the message's own handler instance (also
  on `MessageContext` as `messageActionHandlers`); every caller shares it.
- The `handleX` callbacks (`handleDelete`, `handleCopy`, …) and
  `selectReaction` are read from `MessagesContext`, i.e. the props set on
  `<Channel>`. Passing them directly to a `<Message>` no longer reaches the
  action menu; set them on `<Channel>`. `MessageProps` no longer declares
  `handleBan`, `handleBlockUser`, `handleCopy`, `handleDelete`,
  `handleDeleteForMe`, `handleEdit`, `handleFlag`, `handleMarkUnread`,
  `handleMute`, `handlePinMessage`, `handleQuotedReply`, `handleRetry`,
  `messageActions` or `supportedReactions`.
- The `messageActions` prop (array or function) and `MessageActionsParams` are
  unchanged. The SDK now builds the actions only when a message's menu opens,
  so the function form runs at that point, not on every render of every row.

---

# Part G — Behavioral defaults

## 16. Behavioral changes (no symbol removed)

- **16.1 Initial message-list page size 100 → 25.** The `stream-chat` default is 100;
  v10 resolves 25. Apps that assumed ~100 messages loaded on open now get 25 and
  paginate the rest in. `<Channel>` applies the 25 on mount only when no `pageSize` is
  registered. To change it, **register** the value —
  `client.config.set({ channel: { messagePaginator: { pageSize: 50 } } })` (§13.1).
  Do **not** re-set `channel.messagePaginator.pageSize` after mount: that is an
  imperative patch and is dropped the next time the paginator's configuration
  re-resolves. Note this is separate from `channelQueryOptions.messages.limit`, which
  sizes only the initial query.
- **16.2 `sendMessage` throws on failure** (previously swallowed). The built-in
  `MessageInput` catches the rejection and shows a notification. Any custom code
  that calls the context `sendMessage` (or `channel.messageOperations.send`)
  directly must handle the rejected promise itself.
- **16.3 `SendMessageDisallowedIndicator` renders only once the channel's capabilities are known**
  (from a query or the offline database) and `sendMessage` is missing, and not while a message is being
  edited. No action unless you relied on it rendering before capabilities arrived.

---

# Part H — Dependency

## 17. `stream-chat` must be v10

v10 SDK code hard-depends on `stream-chat` v10 APIs (`channel.messagePaginator`,
the unified reactive `channel.state`, `channel.messageOperations`, `messageDeliveryReporter`,
`messagePaginator.messageFocusSignal`). `stream-chat` is a regular **dependency** of
`stream-chat-react-native-core` (not a peer): read the range from `dependencies` in
`node_modules/stream-chat-react-native-core/package.json`. If the app also lists `stream-chat` itself (it
does whenever it imports from it), set the app's range to that same range so exactly one copy resolves.
Platform floors and other packaging changes are in §R.1.

---

# Part I — stream-chat v10 type-surface (OpenAPI overhaul)

The v10 bump brings the OpenAPI type overhaul. Most of it is internal to the SDK (already
migrated); the items below are the ones that reach **integrator** code — custom components,
`<Channel>` override props, and any direct `stream-chat` client/channel usage.

## 17.1 Custom fields moved under `.custom`

v10 drops the custom-overlay pattern: custom fields live under a `.custom` bag, not at the object
root. Relevant only if you authored a custom component/override that reads them at the root — the
SDK's own reads are already migrated.

- `channel.data.name` / `channel.data.image` → `channel.data.custom?.name` / `.custom?.image`
- Attachment metadata: `attachment.mime_type` / `file_size` / `duration` →
  `attachment.custom?.<same>` (`duration` is now `voiceRecording`-only)
- `attachment.originalFile` → **gone entirely** — an attachment whose upload has not resolved
  carries `localMetadata` instead, see §17.6

The RN SDK augments `CustomChannelData` (`name`, `image`); `mime_type` and `file_size` come from
`stream-chat` itself. Add your own custom keys the same way (`declare module 'stream-chat'`).

`stream-chat` no longer has `CustomCommandData`, and the SDK's `DefaultCommandData` is gone with it.
Delete `interface CustomCommandData extends DefaultCommandData {}` and the `DefaultCommandData` import
from your augmentation file.

## 17.2 `deleteMessage` options are snake_case

`useMessageOperations().deleteMessage(message, options)` (and the `MessageContext` value) now takes
the LLC's `DeleteMessageOptions` (`{ hard?, delete_for_me? }`) instead of the v9 RN
shape (`{ hardDelete?, deleteForMe? }`). The `boolean` shorthand (`deleteMessage(msg, true)` = hard
delete) still works.

- `deleteMessage(msg, { hardDelete: true })` → `deleteMessage(msg, { hard: true })`
- `deleteMessage(msg, { deleteForMe: true })` → `deleteMessage(msg, { delete_for_me: true })`

## 17.3 Update-message override moved off `<Channel>`

`doUpdateMessageRequest` is **removed as a prop** (§13). Register an `updateMessageRequest`
handler on `client.config` instead (§13.1). The signature is the LLC's, so it takes a single
params object rather than the prop's positional arguments:

- v9 prop: `doUpdateMessageRequest(channelId, localMessage, options)`
- v10 handler: `updateMessageRequest({ localMessage, options })` → `{ message }`

If your handler calls the client itself, derive the request with
`localMessageToNewMessagePayload(localMessage)` — that is what the SDK's adapter used to do — and
pass the message id as its own argument:
`client.updateMessage({ id: localMessage.id }, { message: localMessageToNewMessagePayload(localMessage), ...options })`.

`doSendMessageRequest` is removed too — see §13.1 for its `sendMessageRequest` replacement.

## 17.4 `message.moderation_details` → `message.moderation`

v10 uses V2 moderation: `message.moderation` (`ChatModerationV2Response`, `action: 'remove' |
'bounce'`). `message.moderation_details` (V1) is gone. The SDK's `isBlockedMessage` /
`isBouncedMessage` read only V2 — **if your backend still emits V1 payloads, blocked/bounced
detection won't fire.**

## 17.5 Underlying `stream-chat` type changes (renames / Date / method sigs)

If you call the `stream-chat` client/channel directly or annotate with its types, the reference is
[`ai-docs/v10-breaking-changes.md`](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md)
in `stream-chat-js`, with every renamed type in its
[type rename table](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md#type-rename-table).
The calls RN apps make most are in §R.7 and §R.8. Highlights that hit integrator code:

- **Server-sent dates are unix-nanosecond numbers** on every response and event type (`created_at`,
  `updated_at`, `last_read`, …) — not `Date` objects and not ISO strings. They are typed
  **`TimestampNS`**, a branded `number`: reading, comparing, sorting and subtracting work as with any
  number. At compile time:
  - **`new Date(timestamp)` is a type error.** `stream-chat`'s published types augment the global
    `DateConstructor`, because a nanosecond value is out of `Date`'s range (`Date` tops out near
    8.64e15 ms; a current timestamp is ~1.79e18) and yields an Invalid Date.
  - **Minting one needs a helper.** A plain `number` is not assignable to a `TimestampNS` field or
    parameter: use `nowNs()`, `msToNs(ms)`, `dateToNs(date)`, or `asTimestampNS(n)` for a value that
    is already in nanoseconds — a SQLite row, a fixture, the epoch `asTimestampNS(0)`. Arithmetic drops
    the brand; wrap the result in `asTimestampNS` when it goes back into a timestamp.

  What the compiler still does **not** catch:
  - **Date libraries.** A date library reads a bare number as **milliseconds**, so
    `dayjs(ns).format()` returns the literal string `Invalid Date`. This SDK's date helpers turn that
    string into `null`, so a missed conversion shows up as a **blank timestamp** rather than as an error
    or a wrong date.
  - **Fallbacks and derived values.** `new Date(ts ?? Date.now())` and `new Date(Math.max(a, b))`
    compile, because the argument is no longer purely `TimestampNS`. Convert first, then fall back.
  - **A unit mix-up between two numbers.** Comparing a wire timestamp against `Date.now()`, or adding
    a millisecond duration to one, produces a plausible-looking number and no complaint at all.

  Convert at the boundary with the helpers `stream-chat` exports — `convertTimestampToDate(ts)`
  (guarded, returns `undefined` for an absent or non-finite value), or `nsToDate` / `dateToNs` /
  `nsToMs` / `msToNs` / `nowNs` / `asTimestampNS` when the value is known to be present. Compare and
  sort the raw numbers directly; only convert where a `Date` is actually required.

  What changed on **this SDK's** own surface:
  - **`findInMessagesByDate`** is removed (P.1); compare `created_at` numbers yourself, or jump with
    `channel.messagePaginator.jumpToMessage(id)`.
  - **The `ChannelUnreadState` type is removed** (P.9). The unread
    snapshot's `lastReadAt` is a `TimestampNS | null`; the lists treat `null` as the epoch, meaning the
    whole channel is unread. Guard it with `!= null`, never with truthiness.
  - **`useIsChannelMuted`**'s `muteStatus` is core's `ChannelMuteStatus`: `{ createdAt: TimestampNS |
    null; expiresAt: TimestampNS | null; muted: boolean }`.
  - **Offline DB rows** hold plain integers. The SDK's read mappers brand them on the way out
    (`mapStorableToTimestamp` / `mapStorableToRequiredTimestamp`), so hydrated state carries
    `TimestampNS` like live state. If you read the SQLite tables yourself, brand with `asTimestampNS`,
    never `msToNs` — the value is already in nanoseconds.
  - **`getDateString` does not rescale a nanosecond number.** A call site that skips
    `convertTimestampToDate` renders a **blank** timestamp (the helper returns `null` for `Invalid Date`).
  - Presentational props are unchanged: `MessageFooter` / `MessageDeleted` still take
    `date?: string | Date`, and `getDateSeparatorValue` still returns a `Date`. Convert where core
    data enters the tree.
- **Outgoing request date fields are still `Date`** — filter bounds (`created_at_before`,
  `created_at_around`, …), `remind_at` and `message_timestamp`. `JSON.stringify` emits RFC3339 for a
  `Date`, which is the format the request spec declares. Use `nsToDate` when handing a server-sent
  timestamp back to the API.
- **Type renames** — `EventTypes`→`EventType`, `Mute`→`UserMuteResponse`,
  `PollOption`→`PollOptionResponseData`, `ReadResponse`→`ReadStateResponse`,
  `AppSettingsAPIResponse`→`GetApplicationResponse`, `FormatMessageResponse`→`LocalMessage`,
  `Logger`→`Sink`, `*SortBase`→`*Sort`, `TranslationLanguages`→`TranslationLanguage`. `Role` is **not**
  renamed: it now names the generated role *object*, and role names are plain `string` (there is no
  `RoleName`).
- **`Event` is a discriminated union** — narrow with `EventPayload<'the.type'>`, or drop the `: Event`
  annotation so `client.on('x', cb)` narrows automatically.
- **Method signatures collapsed to request objects, with path parameters split out** — a method whose
  endpoint has URL path parameters takes them as a separate first argument,
  `method(pathParams, request?)`: `channel.sendReaction({ id }, { reaction, ... })`,
  `client.deleteMessage({ id }, { hard })`, `client.queryReactions({ id }, { filter, sort, limit })`;
  one whose arguments are all path parameters takes just those (`deleteReaction({ id, type })`),
  but keeps an unused request slot so request options stay third — pass `undefined` there:
  `channel.deleteReaction({ id, type }, undefined, { signal })`,
  `client.getMessage({ id }, undefined, { signal })`. Methods that take no arguments of their own
  (`client.getAppSettings`, `channel.pin` / `unpin` / `archive` / `unarchive`,
  `channel.disableSlowMode`, `channel.stopAIResponse`) likewise take request options second:
  `channel.pin(undefined, { signal })`. Calls that pass no request options are unchanged.
  Methods without path parameters take a single request object (`sendMessage({ message, ... })`,
  `queryChannels(request)`). A body field left in the path-params argument through a spread is not a
  compile error — the client throws at runtime instead;
  `client.uploadImage({ file: { uri, name, type } })` for RN image upload — the `file` field takes
  a browser `File`/`Blob` or an RN `{ uri, name, type }` descriptor, so the MIME type still has to
  be explicit, it just lives on the descriptor now; the same shape applies to `client.uploadFile`
  and `channel.uploadFile` / `channel.uploadImage` (which replace `channel.sendFile` /
  `sendImage`); the `client` constructor is 1–2 args; `client.listeners` is a `Map`;
  `createAbortControllerForNextRequest` is removed — pass `{ signal }` as the request options instead.
- **Sort is `SortParamRequest[]`** — `{ last_message_at: -1 }` → `[{ field: 'last_message_at', direction: -1 }]`.

## 17.6 Attachments mid-upload carry `localMetadata`, not `custom.*`

Only relevant if you override a component that renders message attachments, or read an attachment
off a message that is still sending (`messageComposer.attachments.pendingUploadsEnabled`, on by
default whenever `enableOfflineSupport` is set — see §O.3).

v9 flattened an unresolved attachment into a plain `Attachment`: the local file URI was written into
`image_url` / `asset_url`, and the upload id and file handle were smuggled through
`custom.localId` / `custom.originalFile`. v10 leaves this to `stream-chat`:
the switch is the composer's own `attachments.pendingUploadsEnabled` (§O.3), and with it on, `stream-chat`'s `createAttachmentsCompositionMiddleware` keeps the real
`LocalUploadAttachment` on the local message while the API payload carries only what already
resolved to a URL. `MessageOperations` then awaits the remaining uploads and fills in their URLs
before the request goes out:

```ts
// v9
const localId = attachment.custom?.localId;
const uri = attachment.image_url ?? attachment.custom?.originalFile?.uri;

// v10
import { getAttachmentPreviewUrl, isLocalUploadAttachment } from 'stream-chat';
import { getPlayableVideoUrl } from 'stream-chat-react-native'; // or 'stream-chat-expo'

const localId = isLocalUploadAttachment(attachment) ? attachment.localMetadata.id : undefined;
const uri = getAttachmentPreviewUrl(attachment, attachment.asset_url, attachment.image_url); // image, file, audio
const videoSource = getPlayableVideoUrl(attachment); // video playback only
```

There is **no URL at all** on a pending attachment until its upload resolves — `localMetadata`
holds `id` (the `client.uploadManager` key), `file` (the handle a retry needs), `previewUri` (what
to render meanwhile) and `uploadState`. Two helpers encode the distinction, and overrides should
use them rather than reading the fields directly:

- `getAttachmentPreviewUrl(attachment, ...urls)` from `stream-chat` — the default for every type.
  Returns the first of `urls` that is set (e.g. `a.asset_url, a.image_url`), else
  `localMetadata.previewUri`. For images, files and audio `previewUri` is the picked file's own
  URI, so the same call renders an image, opens a file and plays audio.
- `getPlayableVideoUrl(attachment)` from `stream-chat-react-native` / `stream-chat-expo` — **video
  playback only**. It returns `asset_url` / `image_url`, else the local file URI, skipping
  `previewUri`, which for a video is the thumbnail image
  (`setupVideoAttachmentPreviewMiddleware` puts it there).

`getUrlOfImageAttachment` already applies both — the preview fallback for images, the playable
source for videos — so the gallery, the image gallery and the channel-details media list need no
change.

Removed exports (they existed only to produce the v9 shape):

- `createAttachmentsCompositionMiddleware` — use `stream-chat`'s export of the same name, which the
  composer installs by default. The SDK no longer replaces it; `<Chat>` only supplies a
  default for `attachments.pendingUploadsEnabled` (§O.3)
- `createDraftAttachmentsCompositionMiddleware` — the client's default applies now, which keeps
  **successful uploads only**. A draft is sent to the server, so an unresolved attachment no longer
  persists a local file URI no other device can read
- `localAttachmentToAttachment`
- `DefaultAttachmentData.originalFile` / `.localId`

`setupVideoAttachmentPreviewMiddleware` stays — a video file is not renderable, so its preview is
still the thumbnail the picker extracted.

Two exported URL utilities changed behaviour, because a pending attachment is rendered from a
local URI:

- `isLocalUrl(url?)` checks the scheme instead of searching for `http` anywhere in the string. A
  `content://` or `ph://` URI containing that substring now counts as local, where v9 called it
  remote. It also accepts `undefined` and returns `false` for it; v9 threw.
- `makeImageCompatibleUrl(url?)` accepts `undefined` and returns it unchanged; v9 threw.

## 17.7 Client options are the configuration tree (breaking — `stream-chat`)

`StreamChatOptions` and `client.options` are gone. `new StreamChat(key, config)` and
`StreamChat.getInstance(key, config)` take the same tree `client.config.set()` takes, and each former
option is a field of its `client` slice. The old `config` wrapper is dropped, so the tree is the
argument itself:

```ts
// v9
const client = StreamChat.getInstance(apiKey, {
  axiosRequestConfig: { timeout: 6000 },
  persistUserOnConnectionFailure: true,
});

// v10
const client = StreamChat.getInstance(apiKey, {
  client: {
    axiosRequestConfig: { timeout: 6000 },
    persistUserOnConnectionFailure: true,
  },
});
```

The same goes for `allowServerSideConnect`, `baseURL` and `browser`. `notifications` (a
`NotificationManager` instance) became `client.notificationManager`. The full option mapping is
[`StreamChatOptions` keys -> `config.client`](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md#streamchat-options)
in the `stream-chat` reference.

`useCreateChatClient({ options })` takes this tree too (`DeepPartial<InstanceConfigTree>`, both
exported from `stream-chat`), so move whatever you passed there under `client`, or drop the `config`
wrapper if you used one.

`client.persistUserOnConnectionFailure` is no longer a field, so assigning it does nothing. `<Chat>`
already writes it from `enableOfflineSupport`: on mount (and whenever `client` or `enableOfflineSupport`
changes) it runs `client.config.setConfig('client', { persistUserOnConnectionFailure: enableOfflineSupport })`,
which **overwrites** a value you registered at construction or with `setConfig` yourself. With
`enableOfflineSupport={false}` it is written back to `false`; to keep it `true`, set it again after `<Chat>` has
mounted, or enable offline support.

---

# Part J — `ChannelList` & `ChannelManager` (orchestrator)

`<ChannelList>` now runs on `stream-chat` v10's client-owned orchestrator: `client.channelManager`
(one instance per client) plus one `ChannelPaginator` per list, which the app creates and registers
(§18.6). The list is a **deterministic projection of its paginator's `filters` + `sort`** — every query (initial load, pagination, pull-to-refresh,
reconnect) re-asserts them, so the list can no longer silently drift from, or be forced to
contradict, its own query. Most of the removed API below existed to make the list disagree with its
query; that is intentionally gone (a footgun removed). What you actually need is served by `filters`,
`sort`, and — for transient surfacing — the paginator's `boost` primitive.

## 18. `<ChannelList>` per-event override props removed

Removed props (the v9 options type `ChannelListEventListenerOptions` is still exported, but nothing
takes it any more): `onAddedToChannel`, `onRemovedFromChannel`, `onChannelDeleted`, `onChannelHidden`,
`onChannelVisible`, `onChannelUpdated`, `onChannelTruncated`, `onChannelMemberUpdated`,
`onNewMessage`, `onNewMessageNotification`.

In v9 these callbacks let you imperatively rewrite the list on each WS event. In v10 that is
redundant: the list is a projection of `filters` + `sort` that re-asserts on every query, so a
membership/order change you made by hand was either wiped by the next refresh/reconnect or is already
expressible declaratively. Map what each override did to its v10 equivalent:

| The override did… | v10 |
|---|---|
| decide membership (keep/drop a channel) | `filters` — the query is the source of truth |
| decide order | `sort` (+ `paginatorOptions.lockItemOrder` to freeze order across events) |
| filter what renders without changing the query | `channelRenderFilterFn` (unchanged prop) |
| briefly float a channel to the top | `paginator.boost(cid, { ttlMs })` (survives queries) |
| genuinely global event handling (new event type, SDK-bug hotfix, side effect) | `client.channelManager.addEventHandler(...)` or `client.on(...)` |

Global handler (replaces the old per-list callbacks):

```tsx
const unsubscribe = client.channelManager.addEventHandler({
  eventType: 'message.new',
  id: 'my-app:on-new-message',
  handle: ({ event, ctx: { channelManager } }) => {
    // side effects, or drive the list via channelManager / its paginators
  },
});
// call unsubscribe() on cleanup
```

> Why they're gone as per-list props: the manager is a single client-owned instance shared by every
> list, so per-list handlers pooled into it (last-writer-wins) and unmounting one `<ChannelList>`
> restored the default — clobbering a still-mounted sibling. Global handlers belong on
> `client.channelManager`; per-list shaping stays in each list's `filters` / `sort`.

## 18.1 `queryChannelsOverride` removed → `paginatorOptions.doRequest`

The prop is gone with the other query props (§18.6). Its replacement is the paginator's `doRequest`,
which receives the query params the paginator would have sent (a `QueryChannelsRequest` plus an optional
`stateOptions`, which is not part of the request) and must return `{ items }`, not a `Channel[]`. Call
`client.queryChannelsAndHydrate(...)` inside so client state stays in sync. Plain `client.queryChannels` is the
raw call in v10: it returns the response object, creates no `Channel` instances and stores nothing.

```tsx
// v9: <ChannelList queryChannelsOverride={(filters, sort, options) => Promise<Channel[]>} />
// v10:
const paginator = new ChannelPaginator({
  client,
  id: 'channels:main',
  paginatorOptions: {
    doRequest: async ({ stateOptions, ...request }) => ({
      items: await client.queryChannelsAndHydrate(request, stateOptions),
    }),
  },
});
```

To swap it at runtime, call `paginator.updateConfig({ doRequest })`.

## 18.2 `useChannelUpdated` removed

The public `useChannelUpdated` hook is gone (it patched a `useState`-backed channel array that no
longer exists). `channel.updated` is handled by the orchestrator; there is nothing to wire — delete
the usage.

## 18.3 `ChannelsContextValue.loadNextPage` retyped

`loadNextPage` is now `() => Promise<void>` (it dropped its optional `queryType` / `retryCount`
arguments). It is also a **no-op until the list has finished its first query**:

```tsx
// Before: loadNextPage(queryType?, retryCount?)
// After:
loadNextPage();
```

## 18.4 One `client.channelManager` per client

No v9 prop or context field existed for this: v9's `<ChannelList>` created a manager of its own with
`client.createChannelManager(...)`. That method is gone. There is one `ChannelManager` per client, every
list shares it, and you read it as `client.channelManager`. Configure it through its own API
(`client.channelManager.setEventHandlers(...)`, `setOwnershipResolver(...)`).

## 18.5 Behavioral: channel-list ordering & watch defaults

- **No default "float to top" on events.** The manager no longer boosts a channel on any event —
  order is driven purely by `sort`. A new/edited message, an added-to-channel, or an unhidden channel
  now relocates by its sort key (e.g. `last_message_at`) instead of jumping to the very top. This also
  means a new message no longer overrides a pinned-first `sort` (pinned channels stay pinned). To keep
  the old jump-to-top, boost it yourself: `paginator.boost(channel.cid)`.
- **Watch-on-notification narrowed — but a watch that was *lost* comes back.** On `notification.*`
  events (e.g. added to a channel) v9 re-watched the routed channel unconditionally. v10 does two
  narrower things: it watches a channel it does not already know, and it restores a watch this client
  previously held and lost to a dropped socket (`watchStatus === 'wasWatching'` — see **§L.3**). A
  channel that was never watched, or that you explicitly `stopWatching()`d, stays unwatched, so the
  client's watch count can never exceed what it already had, and blanket auto-watch never risks the
  watch limit. To watch a specific channel yourself, call `channel.watch()`.

## 18.6 `<ChannelList>` takes an app-owned `paginator` (breaking)

`<ChannelList>` no longer creates its own `ChannelPaginator`. The app creates one, registers it on
`client.channelManager` and passes it as the required `paginator` prop. The props that configured the
SDK-created paginator are removed:

| Removed prop | On the app's `ChannelPaginator` |
|---|---|
| `filters` | `new ChannelPaginator({ filters })`, later `paginator.staticFilters = …` |
| `sort` | `new ChannelPaginator({ sort })`, later `paginator.sort = …` |
| `options` | `requestOptions` (`state`, `watch`, `presence`, `message_limit`, `predefined_filter`, `filter_values`, …); `options.limit` → `paginatorOptions.pageSize` |
| `lockChannelOrder` | `paginatorOptions.lockItemOrder`, later `paginator.updateConfig({ lockItemOrder })` |
| `queryChannelsOverride` | `paginatorOptions.doRequest` (§18.1) |

```tsx
// v9
<ChannelList filters={filters} sort={sort} options={options} onSelect={onSelect} />

// v10, next to `connectUser`: one paginator per connected user
const paginator = new ChannelPaginator({
  client,
  filters,
  id: 'channel-list',
  requestOptions: options,
  sort,
});
client.channelManager.insertPaginator({ paginator });
await client.connectUser(user, token);

<ChannelList onSelect={onSelect} paginator={paginator} />;

// on logout
client.channelManager.removePaginator(paginator);
paginator.dispose();
await client.disconnectUser();
```

Behaviour:

- **Registration is the app's job.** A paginator that is not inserted into `client.channelManager`
  loads, but receives no events, so the list does not update live.
- **The list loads the paginator's first page only when it has none** - on first mount, after
  `client.disconnectUser()` resets it, or when a different paginator is passed. A list that mounts
  again with the same paginator shows its channels without a query.
- **The list never removes or disposes the paginator.** Create it with the user, not in the list's
  screen, so the list keeps its channels when the screen unmounts (for example while search results
  replace it). Remove and dispose it on logout: `client.disconnectUser()` empties the registered
  lists but keeps them registered.
- **Changing the query is a paginator change.** Either set `staticFilters` / `sort` / `options` on it
  and call `paginator.reload()`, or create a new paginator with a new `id` and pass that instead. A
  prop change no longer re-queries by itself.
- **Use a unique `id` per list.** The manager keys its lists by it.

---

# Part K — Unified channel state (`channel.state`)

> **Who this affects.** Integrators who read `channel.state.*` fields directly (`members`, `read`,
> `typing`, `watchers`, `watcher_count`, `mutedUsers`), mutate `channel.data.member_count` /
> `own_capabilities` in place, or read `channel.disconnected`. Everything the SDK's own components read
> is already migrated. §2, §4 and §7 point here.

In v9 `channel.state` was a `ChannelState` class with mutable fields that you re-read after events. In
v10 it is a **single `StateStore<ChannelStateData>`** — subscribe with
`useStateStore(channel.state, selector)`, exactly like `thread.state`. The state is **flat**: `read`,
`typing`, `members`, `memberCount`, `watchers`, `watcherCount`, `ownCapabilities` (and the slices in §K.3)
are all top-level keys of the one store.

## K.1 Reading `channel.state` reactively

The v9 field names still exist as **getters** — `channel.state.members` / `.read` / `.typing` / `.watchers`
/ `.member_count` / `.watcher_count` — and return the current value, but reading them does not subscribe.
A component that rendered from them and relied on a `channel.on(...)` listener (or a parent re-render) to
refresh must subscribe instead:

```tsx
import { useChannelContext, useStateStore } from 'stream-chat-react-native';
import type { ReadState } from 'stream-chat';

const readSelector = (s: ReadState) => ({ read: s.read }); // module scope

// Before (v9): const read = channel.state.read; plus a 'message.read' listener to re-render
// After (v10):
const { channel } = useChannelContext();
const { read } = useStateStore(channel.state, readSelector);
```

Selector rules: define it at module scope, return an object (never a bare value), and return slice
references rather than freshly built arrays or objects. Per-concern selector types (`ReadState`,
`MembersState`, `ChannelWatchState`, `TypingUsersState`, `OwnCapabilitiesState`, all from `stream-chat`)
are assignable to `channel.state`'s full `ChannelStateData`.

## K.2 `channel.state.mutedUsers` removed → `client.mutedUsersStore`

Muted **users** are client-global, not per-channel. Read them with `useMutedUsers()` (§14), or
`client.mutedUsersStore` outside React. Muted **channel** status is a per-channel slice — see K.3.

## K.3 New reactive slices on `channel.state` (additive)

`channel.state` now also carries these — subscribe with `useStateStore(channel.state, selector)`:

| Slice | Shape | Notes |
|---|---|---|
| `data` | `Channel['data']` | The server channel data (name/image/frozen/hidden/blocked/config/…). Republished on `channel.updated` / `channel.hidden` / `channel.visible` and on query/watch. |
| `membership` | `ChannelMemberResponse` | The current user's own membership (role, `pinned_at`, `archived_at`). |
| `muteStatus` | `{ muted, createdAt, expiresAt }`: `muted` is a boolean; the two timestamps are `TimestampNS` or `null` | Is **this channel** muted for the current user — mirrors `client.mutedChannels`. `channel.muteStatus()` (imperative) is unchanged. |
| `initialized` / `offlineMode` / `pendingDisposal` | `boolean` | Lifecycle flags, now store-backed. `channel.initialized` etc. are transparent getters over these. `pendingDisposal` replaces `disconnected` — see §K.8. |
| `watchStatus` | `ChannelWatchStatus`: `'watching'`, `'wasWatching'` or `'notWatching'` | Whether this client holds a server-side watch (i.e. whether channel events are flowing) and, when it doesn't, whether the watch should be restored. `Watching` once a `watch: true` query succeeds; `WasWatching` when the WS connection drops (the server keys watches by connection ID, so a reconnect issues a new id and every watch is gone — this records that a re-query is wanted); `NotWatching` when never watched, when the consumer called `stopWatching()`, or on teardown — a deliberate stop is never resurrected by a reconnect. Also makes `channel.watch()`'s silent downgrade — it drops to a non-watching query when there is no connection ID — observable. Read via `channel.watchStatus` or `useStateStore(channel.state, (s) => ({ watchStatus: s.watchStatus }))`; the `ChannelWatchStatus` const is exported from `stream-chat`. |

```tsx
// e.g. react to a channel rename
const name = useStateStore(channel.state, s => ({ name: s.data?.custom?.name }))?.name;
```

## K.4 `channel.activate()` / `channel.active` (additive)

New refcounted lifecycle API mirroring `thread.activate()`. `activate()` **returns its release
function** — there is no `deactivate()` on a channel or a thread. `<Channel>` activates on mount and
releases on unmount for you; `channel.active` is a reactive boolean. While active, the channel
auto-marks messages read on focus and the channel-list hydration does not destructively re-seed the
open channel's message list on reconnect. Custom navigation that mounts a channel outside `<Channel>`
can do the same (it refcounts, so a shared instance stays active until the last holder releases):

```tsx
useEffect(() => channel.activate(), [channel]); // the returned release runs on unmount
```

## K.5 In-place mutation of `channel.data` does not notify (behavioral)

`channel.state` (and every SDK hook that reads it, such as the member count) updates only when the
store is written. Writing a field of `channel.data` in place changes the object but notifies nobody:
reassign `channel.data` instead.

```tsx
// Before (v9) — later reads of channel.data saw the new value
channel.data.member_count = 12;
// After (v10) — reassign so the store (and channel.state.memberCount) updates
channel.data = { ...channel.data, member_count: 12 };
```

`member_count` / `own_capabilities` stay sticky across data updates that omit them, and
`own_capabilities` stays `undefined` until first known. The same applies to `channel.state.membership`:
reassign it rather than mutating a nested field.

## K.6 Built-in hooks read `channel.state` (behavioral)

`useChannelName`, `useChannelImage`, `useChannelMemberCount`, `useChannelMembershipState`,
`useIsChannelMuted` and `useChannelMuteActive` keep their return shapes. No action unless your tests mock
`channel.state` as a plain object: it must be a real `StateStore`.

## K.7 AI-indicator state → `channel.state.aiState` (additive slice; soft-breaking enum)

The per-channel AI-indicator state (thinking / generating / …) is now a reactive slice on
`channel.state`, owned by `stream-chat` and driven by the `ai_indicator.update` / `.clear` / `.stop`
events. In v9 the SDK kept it in `useAIState` with local state and `channel.on('ai_indicator.*')`
listeners.

- **Subscribe:** `useStateStore(channel.state, s => ({ aiState: s.aiState }))`, seeded
  `AIStates.Idle`. If you ran your own `ai_indicator.*` listeners, drop them and read the slice.
- **`useAIState(channel)` is unchanged** — same `{ aiState }` return, now a thin `useStateStore`
  reader internally. It additionally honors `ai_indicator.stop` (→ `AIStates.Stop`), which the RN
  hook previously ignored.
- **`AIState` reconciled + `AIStates` const now exported from `stream-chat`** (soft-breaking):
  `AI_STATE_CHECKING_SOURCES` → `AI_STATE_EXTERNAL_SOURCES`, plus `AI_STATE_IDLE` and
  `AI_STATE_STOP` added. `(string & {})` keeps any string assignable, so this is a literal-set / DX
  change, not a hard compile break. Import `AIStates` from `stream-chat` (also re-exported from the
  SDK) instead of hand-writing the literals.
- **Connection-loss reset is automatic (LLC-owned).** `aiState` resets to `Idle` whenever the WS
  goes away — a transient / internet drop (via the channel cleaning sweep, gated on connection
  health) or a deliberate close such as mobile backgrounding (via `client.closeConnection()`) — so a
  stuck "Generating" can't outlive a lost socket. No app code needed; the terminal
  `ai_indicator.clear` / `.stop` that would otherwise be missed offline is not replayed on reconnect.

```tsx
// read the AI indicator anywhere (or just use useAIState)
const { aiState } = useStateStore(channel.state, (s) => ({ aiState: s.aiState }));
```

## K.8 `channel.disconnected` → `channel.pendingDisposal` (breaking)

The flag is one-way and terminal: `channel.disconnect()` (v9's `_disconnect()`) disposes the paginators
and unregisters the subscriptions, and the instance is never reconnected —
`client.channelManager.ensure(...)` gives a fresh instance for the cid. `disconnected` read like something
that could come back, so the state key and the getter/setter are now `pendingDisposal`.

```tsx
// Before
if (channel.disconnected) return;
// After
if (channel.pendingDisposal) return;
```

`channel.disconnected` is **removed outright** — no alias. Rename every read and write; if you subscribe to
the slice, the **key** changed too:
`useStateStore(channel.state, (s) => ({ pendingDisposal: s.pendingDisposal }))`.

---

# Part L — Connection recovery (`client.connectionRecovery`)

> **Who this affects.** Every app inherits the new behaviour, but almost none needs a code change.
> Reconnect recovery moved out of the UI SDK into `stream-chat`, so `<Chat>` / `<ChannelList>` /
> `<Channel>` get it for free. You have work to do only if you passed `recoverStateOnReconnect: false`
> and hand-rolled recovery, called `client.recoverState()` yourself, or listen for
> `connection.recovered`.

In v9 the RN SDK reimplemented reconnect recovery in three uncoordinated places, because the
client's own recovery was unusable and `<Chat>` switched it off (`client.recoverStateOnReconnect =
false`). v10 gives the client a `ConnectionRecoveryManager` — reachable as
`client.connectionRecovery` — that owns the whole flow, and the SDK's own listeners were deleted in
favour of it.

**What recovery does once the socket is back:**

1. **Every loaded channel list re-runs its own first-page query** — `client.channelManager.recover()`,
   i.e. `paginator.toTail({ keepPreviousItems: true, reset: 'yes' })` for each initialized paginator.
   Each list re-asserts its *own* `filters` / `sort` / `pageSize`, and since `queryChannels` watches
   by default, that page's watches come back as a side effect. Non-destructive — the list never
   blanks, unlike `channelManager.reload()`.
2. **Every `active` channel reloads itself** — `channel.reload()`. A list page carries far fewer
   messages per channel than an open channel's loaded window, so the open channel cannot be served by
   the list query. `<Channel>` marks its channel `active` on mount (§K.4).
3. **Every active thread reloads its replies** — `thread.reload()`, for threads registered in
   `client.threads` (the ones `client.threads.get(id)` resolves) whose `state.active` is set. Nothing
   else covers them: a channel reload refreshes the main message list, and `ThreadManager`'s own
   recovery refreshes the thread *list*, reusing thread instances without rehydrating them unless
   something separately marked them stale. A thread is registered as soon as `thread.activate()` or
   `client.threads.ensure(...)` runs, so a thread opened from a message list is covered from the
   moment `<Thread>` mounts. Registered threads that are not active are only flagged stale, and reload
   on their next `activate()`.
4. **Every other previously-watched channel self-heals on demand** — §L.3.

It is deliberately **not** a sweep over the channel store (`client.channelManager.values()`; v9's
`client.activeChannels`): watches are a bounded server resource, and after any scrolling that store
holds far more channels than a query page.

With offline support enabled, active-channel recovery is triggered off the offline DB's sync-status
edge, so the ordering `executePendingTasks()` → `sync()` → reload holds on every reconnect path —
including mobile backgrounding (`closeConnection()` → `openConnection()`), which v9's client-side
recovery never covered at all.

**No app code is required for any of this.** Do not add a listener that re-queries a list or
re-watches a channel on reconnect — that now duplicates the client. Note that `connection.changed` is
**no longer dispatched** at all: `client.on('connection.changed', …)` compiles and never fires. Connection
status lives on `client.wsConnection.state` and `client.networkConnection.state` (§R.2).

## L.1 `recoverStateOnReconnect` removed — configure recovery instead (breaking — `stream-chat`)

The client option and the `client.recoverStateOnReconnect` field are both gone. Recovery is
configured through the declarative configuration registry, like every other client-owned manager
(`reminders`, `threads`, `notifications`, `messageDelivery`):

```ts
// Before (v9)
const client = new StreamChat(apiKey, { recoverStateOnReconnect: false });

// After (v10) — at construction
const client = new StreamChat(apiKey, {
  client: { connectionRecovery: { enabled: false } },
});

// After (v10) — at any point afterwards; read when a recovery actually runs, so it takes effect
// from the next reconnect
client.config.set({ client: { connectionRecovery: { enabled: false } } });
```

Default is still `true`, and the flag still means "recover nothing, I will do it myself" — so an app
that never touched it needs no change. What it *gates* is different, though, and that part is
behavioural:

| | v9 | v10 |
|---|---|---|
| Gates | one `queryChannels({ cid: { $in: Object.keys(activeChannels) } }, [{ last_message_at: -1 }], { limit: 30 })` | the whole `client.connectionRecovery` flow above |
| Query shape | invented, unrelated to any list's `filters` / `sort` | each list's own first-page query |
| Coverage | the 30 most recently active channels, silently truncated | every loaded list page + every `active` channel |
| Fires on | `StableWSConnection._reconnect()` only | every reconnect path, backgrounding included |

**The RN SDK no longer disables client recovery for you** — v9's `<Chat>` set
`client.recoverStateOnReconnect = false` on your behalf, and it no longer does.

## L.2 `connection.recovered` now fires on every reconnect path (behavioral)

Same event, same (empty) payload, still exactly one dispatcher — but the dispatcher moved from
`client.recoverState()` to `ConnectionRecoveryManager`, and it is dispatched *after* the recovery
reload. In v9 `recoverState()` was called only by `StableWSConnection._reconnect()`, so a
`closeConnection()` → `openConnection()` cycle — mobile backgrounding, the dominant path on React
Native — produced no `connection.recovered` at all.

Consequences:

- A listener that was effectively dead on backgrounding now runs there. If it is expensive or not
  idempotent, check it.
- It is now a valid "recovery finished" hook while recovery is on: the channel reloads have settled
  by the time it fires. That is how the SDK sequences its own mark-read-on-catch-up (§L.4).
- With recovery off (`connectionRecovery: { enabled: false }`) it still fires on every reconnect, as
  in v9, but nothing was reloaded. `<Channel>` does not mark read on it then.

## L.3 A lost watch is restored on demand (behavioral — amends §18.5)

The server keys watches by connection ID, so a dropped socket ends every watch it held. Recovery
re-watches the first page of each list plus the active channel; everything else — pages 2+ of a
scrolled list, channels visited and navigated away from, channels matching no mounted list — is left
marked `ChannelWatchStatus.WasWatching` (§K.3).

`ChannelManager`'s default event pipeline now re-watches such a channel the moment an event routes it
into a list. Without this, a channel that lost its watch still receives member-level events (e.g.
`notification.message_new`) — enough to relocate its row, but carrying no message body — so its
preview would sit frozen until the channel was opened.

This is **narrower than v9, not a revert of §18.5's second bullet**: v9 re-watched any routed channel
unconditionally, whereas v10 only restores a watch this client previously *held and lost*. Skipped
for `channel.hidden` events, for a channel pending disposal, and for `NotWatching` — a channel never
watched, or one you explicitly `stopWatching()`d, stays unwatched. The client's watch count can
therefore never exceed what it already had. The re-watch runs after routing and is not awaited, so
the row still relocates immediately off the event; it is idempotent, and concurrent watches for the
same cid are deduped.

## L.4 `<Channel>` no longer runs any reconnect resync (behavioral)

`<Channel>` used to reload the channel on reconnect, and — when a thread was open — reload that
thread's replies. **Both are gone**; the component's only remaining part is declaring what is on
screen:

```tsx
// what <Channel> does now — the rest is client.connectionRecovery's job.
// activate() returns its release function, which runs on unmount.
useEffect(() => channel?.activate(), [channel]);
```

The open thread is declared the same way, but by **`<Thread>`**, which already did this before v10 —
`useEffect(() => thread?.activate(), [thread])` (`activate()` returns its release function; there is no
`deactivate()`). `<Thread>` renders on its own, next to `<Channel>`, so the channel and the thread are each
activated by their own component.

Neither reconnect handler was ever exported, so there is no symbol to migrate — this is here because
the behaviour relocated, and because the *capability* is unchanged: an integrator who relied on
`<Channel>` refreshing the channel (or the open thread) on reconnect still gets both, one layer down
and on more reconnect paths than before.

**If you render `<Channel>` and `<Thread>` you get this for free.** If you built your own views on the
contexts, call `channel.activate()` / `thread.activate()` and call the release function each returns
when the view goes away (there is no `deactivate()`), or those surfaces will not be recovered — being
active is the one thing recovery cannot infer.

One thing stays deliberately UI-side: **mark-read after the reload**, on `connection.recovered`. It
has to be post-reload so the "is the window at the newest?" check reflects the refreshed window. Read
policy is a UI decision (`useMarkRead`, §5); refreshing state is not.

**`<Channel>` holds no error state of its own, and neither does the client.** A load error belongs to
the paginator whose window failed to load, on `BasePaginator.lastQueryError` — set when a query fails,
cleared by the next one that succeeds, including the reconciling re-seed a reconnect reload performs.
Nothing outside the paginator writes that field. There is no channel-level or thread-level error field,
and `useChannelContext().error` is gone (§L.7).

A failed `watch()` simply rejects to whoever called it. The one caller that cannot propagate it is
`ConnectionRecoveryManager`, which runs the reloads inside a `Promise.allSettled` — **a failed
reconnect refresh is deliberately not surfaced.** The loaded window stays as it was until the next
reconnect, or until a query the consumer itself issues records its own error.

`<ChannelList>`'s own reconnect listener is gone for the same reason — the list re-query is item 1.

## L.5 Additive surface

- **`client.connectionRecovery`** — the `ConnectionRecoveryManager` instance. Public method:
  `recover()`, which runs a full recovery immediately without waiting for a connection event, plus the
  `config` / `configState` / `updateConfig` / `initializeConfig` surface every configurable class
  exposes.
- **`client.config`'s `client.connectionRecovery` key** — `{ enabled: boolean }`, default `true`. The
  replacement for the removed `recoverStateOnReconnect` option (§L.1).
- **`client.channelManager.recover()`** — re-runs every initialized list's first-page query,
  non-destructively. Sibling of the destructive `reload()`, which is unchanged.
- **`thread.activate()` is now refcounted and returns its release function**, matching
  `channel.activate()` (neither has a `deactivate()`), so a thread held by more than one mount stays
  active until the last holder releases it. `active` is what recovery filters on, so a release that
  never runs keeps the thread in every reconnect reload, and one that runs too early costs a missed
  reload as well as a missed auto-read.

There is deliberately **no** channel-level or thread-level error field. Read the paginator backing
whatever you are rendering — the thread's replies when one is open, the channel's messages otherwise:

```tsx
// surface a failed load in your own UI
const lastQueryErrorSelector = (state: { lastQueryError?: Error }) => ({
  lastQueryError: state.lastQueryError,
});

const { lastQueryError } = useStateStore(
  (thread ?? channel).messagePaginator.state,
  lastQueryErrorSelector,
);
```

## L.6 `client.recoverState()` removed (breaking — `stream-chat`)

Removed outright rather than left as a no-op, so a caller fails loudly instead of silently getting no
recovery. To force a recovery by hand:

```ts
// Before (v9)
await client.recoverState();
// After (v10)
await client.connectionRecovery.recover();
```

The two are not equivalent in shape — `recoverState()` ran the 30-channel bulk query described in
§L.1 — but `recover()` is the v10 way to say "bring everything I am reading back in line with the
server now". Most apps never called it: it was invoked automatically on reconnect, and it still is.

## L.7 `useChannelContext().error` removed (breaking — React Native)

`ChannelContext` no longer carries an `error`. A load failure belongs to the paginator that issued the
query, so read it from there instead:

```tsx
// Before (v9)
const { error } = useChannelContext();

// After (v10) — at module scope
const lastQueryErrorSelector = (state: { lastQueryError?: Error }) => ({
  lastQueryError: state.lastQueryError,
});

// After (v10) — in the component
const { channel } = useChannelContext();
const { thread } = useThreadContext();
const { lastQueryError } = useStateStore(
  (thread ?? channel).messagePaginator.state,
  lastQueryErrorSelector,
);
```

The built-in `NetworkDownIndicator` and `<Channel>`'s own error screen both do exactly this, so an app
that never read `error` itself needs no change.

**`NetworkDownIndicator` no longer reports load errors at all** — it reports the connection, and
nothing else. It renders "Waiting for network..." (`common.waitingForNetwork.text`, a new key) when the
device network is known to be offline, "Reconnecting..." (`common.reconnecting.text`) when the socket is
unhealthy for longer than `offlineNotificationDisplayDelayMs` (default 5000 ms, §R.2), and nothing
otherwise. In v9 it also showed "Error loading messages for this channel…", driven by a failed
`watch()`/resync and by a failed thread
reply pagination; that full-width, channel-wide message overstated what is usually one failed page of
history, with the messages you already have rendered fine underneath it.

A load failure that leaves nothing to show still gets the full-screen treatment: `<Channel>` renders
`LoadingErrorIndicator`, with its retry, when the paginator has an error and no items. A failed
reconnect refresh is not surfaced at all (§L.4) — the loaded window simply stays as it was.

If you want the old banner back, render your own from `lastQueryError` using the snippet above.

## L.8 Unsent messages survive a reconnect refresh

No action. A reconnect refresh (`channel.reload()` / `thread.reload()`) keeps failed (unsent) messages in the list, also in a thread built with `new Thread()`. Remove any code that re-adds failed messages after a reconnect.

## L.9 The reconnect refresh finds messages that arrived while offline

No action. A reconnect refresh requests at least one full page, so content that arrived while you were away appears, also in a channel or thread created in the current session.

## L.10 A thread with no replies is not an error

No action. Opening a thread whose parent has no replies does not raise an error and sends no mark-read; `thread.reload()` resolves for it. A thread that had replies and comes back not found still rejects.

---

# Part M — Optimistic edit, delete and unsent-message persistence

The message lifecycle moved out of `<Channel>` into `stream-chat`'s `channel.messageOperations`. Only
§M.2 changes what a user sees; §M.6 is additive; the rest need no action.

## M.1 Editing a message is optimistic and persisted

No action unless you added optimistic-edit code of your own (remove it). An edit shows at once, is written to the offline DB before the request and is never rolled back; with offline support a queued edit is not marked failed, otherwise a definitive failure sets `status: 'failed'`.

## M.2 Deleting a message is optimistic, and reverted if it definitively fails (behavioral)

`MessageOperations.delete` was the only operation that bypassed the optimistic lifecycle: it awaited
the request and then ingested the response. So a delete showed nothing until the server answered.

Now:

- A soft delete immediately marks the message `type: 'deleted'` with `deleted_at`, and
  `deleted_for_me` for a `delete_for_me` delete.
- A **hard delete removes the message** instead of marking it, matching what the `message.deleted` WS
  handler does for `hard_delete`. Previously the response message was ingested unconditionally, which
  put a message the server had just destroyed back into the list.
- A delete that fails definitively is **reverted** — unlike an edit there is no user input to lose, and
  a "Message deleted" placeholder on a message that still exists server-side only self-corrects on the
  next query. A queued (offline) delete keeps the optimistic state.

  In practice the trigger is **offline support disabled plus no connectivity**, not a permission
  rejection: the delete action is capability-gated in the UI (`deleteOwnMessage` / `deleteAnyMessage`),
  so a user without permission is never offered it. If the revert is ever wrong — the server did delete
  the message but the response was lost — the `message.deleted` event removes it again.
- Deleting a message nothing was displaying no longer inserts a phantom deleted row.

The revert is guarded on object identity against the copy the optimistic step wrote, so a WS update
landing mid-request is never clobbered by the rollback.

## M.3 Unsent messages survive closing the app

No action. Every send is written to the offline DB before the request (as `failed`, then `received` on success), so a message survives the app being killed mid-send and stays retryable across restarts.

## M.4 An empty request response no longer overwrites local state

No action. A custom `sendMessageRequest` / `updateMessageRequest` / `deleteMessageRequest` that resolves without a `message` leaves local state alone.

## M.5 Editing or deleting a thread parent from inside a thread works

No action. The change reaches every list that shows the parent message.

## M.6 Additive on `AbstractOfflineDB`

Both are **concrete** helpers composed from existing primitives, so a custom offline DB implementation
inherits them and has nothing new to implement:

- `getFailedMessages({ cid })` — the channel's locally failed (unsent) messages, read back through
  `getChannels`.
- `upsertMessageWithChannelGuard({ message })` — upserts one message, creating its channel row first
  when the DB has never seen that channel, so the optimistic write cannot fail on the foreign key.
  `updateMessage` cannot serve this: it is an UPDATE and no-ops when the row does not exist, which is
  exactly the write-ahead case.

## M.7 The offline channel guard works

No action. The offline DB stores WS events for channels it has no row for yet (it creates the row), and probes for the row only when a write fails.

---

# Part N — Offline channel-list cache

Four changes to how a channel list is cached offline and ordered. Three are only visible if you
implement `AbstractOfflineDB` yourself or read `syncManager` directly; the fourth (§N.4) changes
visible ordering for **every integrator who does not pass a `sort` prop**, so read that one even if
you do not use offline support.

## N.1 `OfflineDBApi.getChannelsForQuery` returns an object (breaking — `stream-chat`)

```diff
- getChannelsForQuery: (o) => Promise<Omit<ChannelStateResponseFields, 'duration'>[] | null>
+ getChannelsForQuery: (o) => Promise<DBGetChannelsForQueryResult | null>
```

where `DBGetChannelsForQueryResult` is `{ channels, predefinedFilter? }`. `DBUpsertCidsForQueryType`
gained a matching `predefinedFilter?: ParsedPredefinedFilterResponse`.

For a `predefined_filter` list the server decides the filter and the sort, and the client only learns
them from `QueryChannelsResponse.predefined_filter`. The offline cache used to store only the cid
order a query produced, not the rule that produced it — so a cache-seeded list matched against the
*local* filters and sorted by the backend default until the first query landed. Both are now stored
and restored together, in one read, because they are one cache row.

**Affects:** custom `AbstractOfflineDB` implementations, and anyone calling
`OfflineStoreApis.getChannelsForFilterSort` from `stream-chat-react-native`.

**→** read `.channels` instead of the array; accept `predefinedFilter` in `upsertCidsForQuery`, persist
it, and return it from `getChannelsForQuery`. If you persist nothing for it, the list still works — it
falls back to exactly the pre-v10 behaviour.

## N.2 `SqliteClient.dbVersion` 16 → 18 (not breaking; one-time cache loss)

v9 ships `dbVersion` 16; v10 ships 18. Two schema changes are behind it:

- every date column that holds server data (channels, messages, members, reads, reactions, polls,
  drafts, reminders, locations, users) changed `TEXT` (ISO string) → `INTEGER` (unix nanoseconds, §17.5).
  `pendingTasks.createdAt` and `userSyncStatus.lastSyncedAt` stay `TEXT`;
- the RN `channelQueries` table gained a `predefinedFilter TEXT` column for §N.1.

Schema versioning uses `PRAGMA user_version` and there are **no incremental migrations**, so the first
launch after upgrading reinitializes the database.

That is a one-time loss of the **offline cache**, not of user data: channels, messages and reads are
re-fetched from the server on the next query. Queued offline writes (pending tasks) are in the same
database, so an install that is upgraded while holding unsent messages loses them. Nothing to do,
but do not be surprised by a cold first launch.

## N.3 `OfflineDBSyncManager.syncStatus` → `isSynced` (breaking — `stream-chat`)

```diff
- client.offlineDb.syncManager.syncStatus   // boolean
+ client.offlineDb.syncManager.isSynced
```

`public`, so an integrator reading it directly is affected. The SDK itself never referenced it, so
there is no RN-side change.

The `SyncStatus` name family deliberately stays: `onSyncStatusChange`,
`scheduleSyncStatusChangeCallback`, `invokeSyncStatusListeners`. "Sync status" is the concept,
`isSynced` is its current value, and the listeners fire when that status changes.

## N.4 A list without `sort` is ordered by recency (behavioral — affects every default-sorted list)

A `ChannelPaginator` created without `sort` (or with `sort: []`) sorts by the backend default,
`[{ field: 'last_message_at', direction: -1 }, { field: 'updated_at', direction: -1 }]`, and re-sorts live
by it: a new message moves its channel up by recency. `paginator.sort` returns that array, not the `[]`
you passed, so a test asserting `toStrictEqual([])` on it fails.

**→** nothing to do if recency is what you want. Pass an explicit `sort` to pin a different order —
including a `pinned_at`-first sort if pinned channels must stay on top, which the backend default does
not do.

## N.5 `InternalSearchControllerState` removed (breaking — `stream-chat`, documented-unstable)

The exported type `InternalSearchControllerState` and the `SearchController._internalState` store it
typed (which held only `focusedMessage`) are gone. Both carried an explicit JSDoc disclaimer that they
were not for integrator use and could be removed without notice, so this is a documented-unstable
removal rather than a contract break. The RN SDK never referenced either.

**→** if you read `searchController._internalState.getLatestValue().focusedMessage`, track the focused
message in your own state; there is no replacement on `SearchController`.

---

# Part O — Message-list pruning (`maximumMessageLimit` → `maxLoadedItems`)

## O.1 `<Channel maximumMessageLimit>` removed; the cap is paginator configuration

```diff
- <Channel channel={channel} maximumMessageLimit={200}>
+ <Channel channel={channel}>
```

```diff
+ // any ONE of these
+ channel.messagePaginator.updateConfig({ maxLoadedItems: 200 });
+ client.config.set({ messagePaginator: { maxLoadedItems: 200 } });            // every message list
+ client.config.set({ channel: { messagePaginator: { maxLoadedItems: 200 } } }); // channel lists only
+ client.config.set({ thread:  { messagePaginator: { maxLoadedItems: 100 } } }); // thread replies only
```

Bounding the loaded window is state-layer work — it is the paginator that owns the loaded set, its
pagination cursors and its store membership — so in v10 it is paginator configuration rather than a
component prop. Same default (unset ⇒ unbounded) and the same purpose: a livestream channel that would
otherwise accumulate every message it has ever received.

Three things the prop could not give you, which the config route does:

- **Per-surface control.** The prop capped the channel list only. `thread.messagePaginator` can now be
  capped separately, or both together through the shared `messagePaginator` key.
- **Runtime changes.** `updateConfig` applies to an open channel immediately.
- **It works outside React.** Nothing has to render for the cap to be in force.

**Affects:** anyone passing `maximumMessageLimit`. The prop is **removed, not deprecated** — TypeScript
flags it, and there is no silent-fallback case to worry about.

## O.2 What a prune does (behavioural)

In v9 the cap was enforced by `channel.state.pruneOldest()`, which went away with `channel.state.messages`.
In v10 the paginator's `maxLoadedItems` enforces it.

What a prune does now, which is worth knowing if you build on the paginator:

- Drops the oldest messages from the loaded window and releases them from `client.messageStore`. A message
  another collection still holds — a pinned message, or a `show_in_channel` reply in an open thread —
  keeps its content; only this list's reference goes.
- Re-opens `hasMoreTail` and re-points `cursor.tailward`, so scrolling back re-fetches. This happens even
  if the list had already paginated to the very first message in the channel.
- Never drops an unsent or failed message, which sorts by the time it was composed and would otherwise be
  destroyed by a cap. The window sits slightly above the cap while one is pending.
- Never runs while the user has jumped away from the newest window, and never while the SDK's viewability
  tracking says the viewport is near the oldest loaded message.
- Does **not** touch the offline database. A pruned message is still in SQLite.

A value below the list's `pageSize` is raised to it: a cap smaller than a page would prune away the page a
"load older" query had just fetched, and the list would immediately ask for it again.

## O.3 `<Channel allowSendBeforeAttachmentsUpload>` removed; the switch is composer configuration

```diff
- <Channel channel={channel} allowSendBeforeAttachmentsUpload={false}>
+ <Channel channel={channel}>
```

```diff
+ // before handing the client to <Chat>
+ client.config.set({ messageComposer: { attachments: { pendingUploadsEnabled: false } } });
```

Whether a message can be sent while its attachments are still uploading is now
`stream-chat`'s own composer setting, `messageComposer.attachments.pendingUploadsEnabled`. The prop
only ever forwarded to it, and it did so with an imperative `updateConfig` on every composer, which
outranks `client.config`. So a value you registered on the client could never win.

Removed with it:

- `ChannelProps.allowSendBeforeAttachmentsUpload`
- `MessageInputContextValue.allowSendBeforeAttachmentsUpload`
- `ChannelProps.enableOfflineSupport`. It existed only to seed the prop's default, and it is read
  from `<Chat>`.

Read the value with `usePendingUploadsEnabled()` in a component inside `<Channel>` (it answers for
the current composer, so a thread composer answers for itself), or read
`messageComposer.config.attachments.pendingUploadsEnabled` directly. `MessageList` /
`MessageFlashList` take it as a `pendingUploadsEnabled` prop, which defaults to the composer's
value.

### The default

With `enableOfflineSupport` on, `<Chat>` writes `pendingUploadsEnabled: true` into `client.config`,
**only if nothing is registered there yet**. With it off, nothing is written and `stream-chat`'s own
default (`false`) applies. That's the same default the prop had. The write happens once and is
**never taken back**: if `enableOfflineSupport` later turns off, pending uploads stay on, because the
SDK cannot tell its own write from yours. If you toggle offline support at runtime, set
`pendingUploadsEnabled` yourself. A value anyone else registered is never overwritten.

### Turning it on or off for every channel

Register it on the client, ideally before the client reaches `<Chat>`, so the SDK never writes at
all:

```ts
client.config.set({ messageComposer: { attachments: { pendingUploadsEnabled: false } } });
// or at construction
new StreamChat(apiKey, {
  messageComposer: { attachments: { pendingUploadsEnabled: false } },
});
```

A `client.config.set` made after `<Chat>` has mounted also takes effect. It deep-merges over the
SDK's default, and live composers re-derive.

### Per channel (or per channel type): a `messageComposer` setup function

```ts
client.config.setSetupFunction('messageComposer', ({ composer }) => {
  if (composer.channel.type !== 'livestream') return; // everything else keeps the default
  composer.updateConfig({ attachments: { pendingUploadsEnabled: false } });
});
```

It runs against every composer the client has, existing and future: a channel's own composer, each
of its threads' composers, and message-scoped edit composers. `composer.channel` is the parent
channel for all of them, so one check covers a channel and its threads. Branch on
`composer.channel.cid` for a single channel, or on `composer.threadId` for threads only.
`updateConfig` is a retained imperative patch, so it wins over both `<Chat>`'s default and
`client.config`, whichever runs first.

- **One setup function per key.** Setting another replaces it. If you already use one (for
  example, to insert composition middleware), put this branch into that same function.
- `client.config.reset()` clears the setup function and every patch it made.
- `channel.messageComposer.updateConfig({ attachments: { pendingUploadsEnabled: false } })` from a
  channel screen also works, but only for that channel's own composer. It misses the channel's
  thread composers, and the patch stays on the cached channel after the screen unmounts.

**Affects:** anyone passing `allowSendBeforeAttachmentsUpload` or `enableOfflineSupport` to
`<Channel>`, or reading `allowSendBeforeAttachmentsUpload` from `useMessageInputContext()`. The
props are **removed, not deprecated**, so TypeScript flags them.

---

# Part P — UI state cleanup over the v10 state layer

The SDK no longer keeps its own copies of state that `stream-chat` v10 publishes reactively. This part
lists what that cleanup removed or renamed. Every entry names its replacement.

## P.1 Unused exports removed (breaking)

These had no callers left in the SDK and only existed for the pre-v10 state model:

| Removed                                                                   | Use instead                                                                                     |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `useSelectedChannelState({ channel, selector, stateChangeEventKeys })`     | `useStateStore(channel.state, selector)`. The old hook only updated on the events you listed.    |
| `reduceMessagesToString`, `findInMessagesById`, `findInMessagesByDate`     | `channel.messagePaginator.getItem(id)`, `jumpToMessage(id)`, `jumpToTheFirstUnreadMessage()`     |
| `getLastReceivedMessage(messages)`                                         | `messages.find((m) => m.status !== 'failed')`, which is what it did                              |
| `DebugContextProvider`, `useDebugContext`, `DebugContextValue`, `DebugDataType` | Nothing. It fed the Flipper plugin, which React Native dropped in 0.74.                     |

## P.2 `useIsOnline` → `useConnectionLifecycle` (breaking)

In v9 `useIsOnline(client)` returned `{ isOnline, connectionRecovering }`. In v10 it only installs the
NetInfo status reporter and closes/reopens the socket on background/foreground, and it returns nothing.
It is renamed to say so:

```diff
- useIsOnline(client, closeConnectionOnBackground);
+ useConnectionLifecycle(client, closeConnectionOnBackground);
```

`<Chat>` already calls it, so most apps never did. To read the status, use `useNetworkConnectionState()`
for the device's network or `useWSConnectionState()` for the socket.

## P.3 `useMutedChannels()` takes no argument (breaking)

It returns the current user's muted channels, a client-wide list. The `channel` argument was never used,
but without it the hook returned `undefined`.

```diff
- const mutedChannels = useMutedChannels(channel);
+ const mutedChannels = useMutedChannels();
```

For one channel's mute state use `useIsChannelMuted(channel)`.

## P.4 Context fields that nothing read (breaking, type-level)

| Removed                                            | Use instead                                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `useChannelContext().isChannelActive`              | `!useThreadContext().thread` for the old meaning; `useStateStore(channel.state, (s) => ({ active: s.active }))` for "is this channel being read" |
| `useChannelContext().scrollToFirstUnreadThreshold` | Nothing. It was always `0`.                                                                  |
| `useMessagesContext().initialScrollToFirstUnreadMessage` | The value you pass to `<Channel initialScrollToFirstUnreadMessage>`                    |
| `useMessagesContext().quotedMessage`               | It was never set. Read the composer: `useStateStore(messageComposer.state, (s) => ({ quotedMessage: s.quotedMessage }))` |
| `useThreadContext().parentMessagePreventPress`     | It was never set. Pass `parentMessagePreventPress` to `<ThreadFooterComponent>` (default `true`). |

## P.5 Props that did nothing (breaking, type-level)

- `<MessageList>` / `<MessageFlashList>`: `scrollToFirstUnreadThreshold` and `shouldShowUnreadUnderlay`.
  Rows read `shouldShowUnreadUnderlay` from `<Channel>`, so set it there.
- `<MessageFlashList FlatList>`: FlashList never used it.
- `<Channel isOnline>`: accepted by the props type and ignored.

## P.6 `OfflineStoreApis`: `currentUserId` → `userId` (breaking)

Every `OfflineStoreApis` function that took `currentUserId` now takes `userId`, matching
`AbstractOfflineDB`:

```diff
- OfflineStoreApis.getChannels({ channelIds, currentUserId });
+ OfflineStoreApis.getChannels({ channelIds, userId });
```

`OfflineStoreApis.deleteReactionsForMessage` is removed. Nothing called it and `AbstractOfflineDB` has no
slot for it; `deleteReaction` deletes one reaction.

## P.7 Message lists page their own paginator (breaking)

`<MessageList>` and `<MessageFlashList>` no longer take `loadMore`, `loadMoreRecent`, `hasMore`,
`loadingMore` or `loadingMoreRecent`. They page the paginator they render (the channel's, or the open
thread's in a thread list) with `toTail()` (older) and `toHead()` (newer), and track the two loading
flags themselves. The paginator already ignores a request while one is running or when that end has
nothing more.

```diff
- <MessageList loadMore={myLoadMore} loadMoreRecent={myLoadMoreRecent} />
+ <MessageList />
```

To change how a page is fetched, configure the paginator instead:
`client.config.set({ channel: { messagePaginator: { … } } })`, or a request handler. A custom
`FooterComponent` (`MessageList`) / `HeaderComponent` (`MessageFlashList`) still receives
`{ loadingMore }` (§12.1).

## P.8 `useMessageList` takes the paginator (breaking)

```diff
- const { processedMessageList } = useMessageList({ threadList: true });
+ const { processedMessageList } = useMessageList({ paginator: useMessagePaginator() });
```

## P.9 Unread state types (breaking, type-level)

| Removed                                    | Use instead                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `ChannelUnreadState` type                  | `UnreadSnapshotState` from `stream-chat` (`channel.messagePaginator.unreadStateSnapshot`) |
| `UnreadMessagesNotificationProps.unreadCount` | Nothing. It was never applied; the count comes from the unread snapshot.       |

## P.10 Message list behaviour fixes

No action. Thread lists page, mark read and show unread state from the thread's own paginator (closing a thread no longer leaves a stuck "new messages" separator in the channel); a failed page no longer stops pagination; removing a message no longer scrolls `MessageList` to the bottom.

## P.11 `ChatContext` holds only `client`, `getAppSettings` and `isMessageAIGenerated` (breaking)

The other fields were either never read or duplicated state the client already publishes. Each one
made `<Chat>` rebuild the context, and every component reading `useChatContext()` re-rendered with it.
The context value now only changes with the `client` or `isMessageAIGenerated` props.

| Removed | Use instead |
| --- | --- |
| `useChatContext().appSettings` | `await useChatContext().getAppSettings()` |
| `useChatContext().channel`, `.setActiveChannel` | Keep the open channel in your own navigation state and render `<Channel channel={…}>`. Inside a `<Channel>`, `useChannelContext().channel`. |
| `useChatContext().mutedUsers` | `useMutedUsers()` |
| `useChatContext().enableOfflineSupport` | `client.offlineDb !== undefined` |
| `useChatContext().isOnline` | `useNetworkConnectionState()?.isOnline === false` for the device, `useSettledWSConnectionHealth()` for the socket (§R.2) |
| `useChatContext().connectionRecovering` | `useSettledWSConnectionHealth()` / `useWSConnectionState()` (§R.2) |

`getAppSettings()` works like the one in `stream-chat-react`: the first call fetches the app settings
and later calls reuse them. `<Chat>` already calls it once the user is connected, so it usually
resolves immediately. With offline support, a successful fetch is copied to the offline database and a
failed one falls back to that copy. A failed fetch is not kept, so the next call tries again.

```diff
- const { appSettings, mutedUsers } = useChatContext();
+ const { getAppSettings } = useChatContext();
+ const mutedUsers = useMutedUsers();
+ const appSettings = await getAppSettings();
```

`useCreateChatContext` takes `{ client, getAppSettings, isMessageAIGenerated }` and memoizes on
exactly those three.

## P.12 Chat hooks removed (breaking)

| Removed | Use instead |
| --- | --- |
| `useClientMutedUsers(client)` | `useMutedUsers()`. Same store, same result. |
| `useAppSettings(client, isOnline, enableOfflineSupport, initialisedDatabase)` | `useChatContext().getAppSettings()` |

## P.13 `MessagePropsWithContext.chatContext` removed (breaking, type-level)

`Message` passed the whole chat context to its memoized inner component. The inner component now reads
`useChatContext()` itself, which is safe because the context no longer changes. Only code typed against
`MessagePropsWithContext` changes:

```diff
- const { chatContext } = props as MessagePropsWithContext;
- const { client } = chatContext;
+ const { client } = useChatContext();
```

A message row still updates when its author is muted: the row reads the mutes itself.

## P.14 `<Chat>` follows the connected user

No action. A `<Chat>` mounted before `connectUser()` resolves picks the user (and their offline database) up when the connection changes.

## P.15 `<Channel>` keeps rendering a deleted channel (breaking, behavioural)

`<Channel>` used to render nothing once its channel was deleted, through its own `channel.deleted`
listener. It no longer handles a gone channel at all, as in `stream-chat-react`: what to show is up to the
app. A channel instance is gone for good when the channel is deleted, when the user is removed from it,
or when the client disconnects, and its `pendingDisposal` state says so. To keep the old behaviour, or show
something else, read that state above `<Channel>`:

```tsx
const selector = (state: ChannelLifecycleState) => ({ pendingDisposal: state.pendingDisposal });

const { pendingDisposal } = useStateStore(channel.state, selector);
if (pendingDisposal) return null; // or your own "this channel is gone" view
return <Channel channel={channel}>…</Channel>;
```

The SampleApp's
[`useLeaveGoneChannel`](https://github.com/GetStream/stream-chat-react-native/blob/V10/examples/SampleApp/src/hooks/useLeaveGoneChannel.ts)
does this on the channel and thread screens, returning to the channel list.

Message rows no longer check `channel.pendingDisposal` each either, so a gone channel's messages stay
visible. A disposed instance is never revived. To open the same conversation again, get a new instance
with `client.channel(type, id)`.

## P.16 Channel behaviour fixes

No action unless you key on `channel.cid` where you mean the instance: `ChannelContext` rebuilds when the `channel` instance changes (a disposed channel comes back as a new instance under the same cid). `disabled` follows freeze state, changed `overrideOwnCapabilities` apply, and backgrounding sends `typing.stop` only while typing.

## P.17 The composer submits through `stream-chat` (breaking)

`useMessageInputContext().sendMessage()` now submits the composer: `messageComposer.update()` while a
message is being edited, `messageComposer.send()` otherwise. The SDK used to compose the message itself
and hand it to `<Channel>`'s own send and edit functions. What the user sees is unchanged: the input
clears at once, a poll keeps the rest of the draft, links are refused where they are not allowed, and an
edited bounced message is sent again as a new one.

| Removed | Use instead |
| --- | --- |
| `<Channel preSendMessageRequest>` | `client.config.set({ channel: { requestHandlers: { sendMessageRequest } } })` |
| `sendMessage` / `editMessage` in a custom `MessageInputProvider` `value` | the `sendMessageRequest` / `updateMessageRequest` handlers |
| `useMessageInputContext().editMessage` | `useMessageInputContext().sendMessage()` while editing |
| `patchMessageTextCommand` | nothing; the backend resolves the target from the mentioned users |

```diff
- <Channel preSendMessageRequest={async ({ localMessage }) => prepare(localMessage)}>
+ client.config.set({
+   channel: {
+     requestHandlers: {
+       sendMessageRequest: async (params, defaultRequest) => {
+         await prepare(params.localMessage);
+         return defaultRequest(params);
+       },
+     },
+   },
+ });
```

The handler runs at a different point than `preSendMessageRequest` did. It runs after the message
appears in the list and after its attachments finish uploading, not before. If it throws, the message
is marked failed, where it used to stay pending. It runs for the first send only; retries go through
`retrySendMessageRequest`.

A failed send or edit is reported by the composer through `client.notifications`, with the type
`CORE_NOTIFICATION_TYPE.messageSendFailed` or `messageUpdateFailed`. The toast copy is unchanged, and a
failed request is no longer logged as `Error while sending message`.

Moderation commands (`/mute`, `/unmute`, `/ban`, `/unban`) are sent as typed. The SDK used to rewrite
the mentioned name into the user id (`/mute @Jane Doe` → `/mute @jane-id`) to work around a backend bug
with names containing spaces. The backend now takes the target from the message's mentioned users, so the
rewrite is gone, and so is the `patchMessageTextCommand` export (breaking). To keep rewriting command
text, add a composition middleware through `client.config.setSetupFunction('messageComposer', fn)`
(§13.1; `client.setMessageComposerSetupFunction` is deprecated).

## P.18 Editing a message

No action. Re-editing after a cancelled edit starts from the message; saving or cancelling leaves edit mode by itself; `useMessageComposer()` returns the composer from context.

## P.19 Composer behaviour fixes

No action. See §16.3 for `SendMessageDisallowedIndicator`. The commands button, the attach button and the commands sheet follow capabilities and server config that arrive after mount.

## P.20 `ChannelsContext` holds the list's configuration, not its state (breaking)

`ChannelsContext` used to carry a copy of the list's query state next to its configuration, and every
channel row read it. Any list update re-rendered every row: a reorder, a new message in any channel, an
unread count, a presence change. The context now holds the configuration, the list's
`ChannelPaginator` and the stable `loadNextPage` / `refreshList` / `reloadList` functions. `ChannelList`
passes the query state to `ChannelListView` as props.

| Removed from `ChannelsContextValue` | Use instead |
| --- | --- |
| `channels`, `hasNextPage`, `error` | `useStateStore(useChannelsContext().paginator.state, selector)`: `items`, `hasMoreTail`, `lastQueryError` |
| `loadingChannels`, `channelListInitialized` | the same store: `items === undefined` |
| `loadingNextPage`, `refreshing` | `ChannelListView` props |
| `forceUpdate` | nothing; it was always `0` |

```tsx
const selector = (state: ChannelPaginatorState) => ({ channels: state.items });

const { paginator } = useChannelsContext();
const { channels } = useStateStore(paginator.state, selector);
```

`ChannelListViewProps` now requires the query state (`channels`, `channelListInitialized`, `error`,
`hasNextPage`, `loadingChannels`, `loadingNextPage`, `refreshing`).

A channel row now re-renders only when its own channel changes (the list's FlatList also sets
`strictMode`). A custom `ChannelPreview` that reads `channel.data` or `channel.state` directly, without
subscribing, no longer picks up changes through other rows' updates. Subscribe instead, for example with
`useChannelName(channel)` or `useStateStore(channel.state, selector)`.

## P.21 Channel list behaviour fixes

No action. Changed `ChannelList` props (`onSelect`, `getChannelActionItems`, `maxUnreadCount`, `additionalFlatListProps`, `loadMoreThreshold`, `numberOfSkeletons`, `setFlatListRef`) apply while mounted; a mounted list loads again after a user switch, and loads its first page even when an event already put channels into its paginator.

## P.22 Thread list behaviour fix

No action. A thread list row takes its latest reply from `thread.messagePaginator.aggregateState`.

---

# Part Q — Plural count keys, behaviour fixes, `isMessageAIGenerated`

## Q.1 Count strings are plural keys (breaking for translations)

Five strings that take a `{{count}}` read "1 new messages" for a count of 1. They are plural keys now,
like every other count string in the SDK. A translation dictionary has to provide the `_one` /
`_other` forms (plus `_few`, `_many` and so on where the language needs them). i18next looks up the
bundled English plural before an override of the bare key, so an override of the bare key no longer
applies.

| Key | Where |
| --- | --- |
| `messageList.newMessages.text` | the unread separator in a message list |
| `messageList.scrollToBottom.withCount.accessibilityLabel` | the scroll-to-bottom button |
| `channelPreview.unreadCount.accessibilityLabel` | a channel row's unread badge |
| `message.reactionList.more.accessibilityLabel` | the clustered reaction list |
| `avatar.channel.group.accessibilityLabel` | a group channel's avatar |

```ts
// Before
'messageList.newMessages.text': '{{count}} neue Nachrichten',
// After
'messageList.newMessages.text_one': '{{count}} neue Nachricht',
'messageList.newMessages.text_other': '{{count}} neue Nachrichten',
```

`TranslationDictionary` rejects the bare key, so a typed dictionary fails to compile until it is
updated.

## Q.2 Behaviour fixes

No action. Fixes in the reactions sheet, reminder header, `useHandleLiveLocationEvents`, poll vote/answer pagination, the thread list's "new threads" retry, the channel-list swipe sheet's online label, the sticky date header and `MessageFlashList`'s duplicate date.

## Q.3 `isMessageAIGenerated` lives on `<Chat>` only (breaking)

`<Chat isMessageAIGenerated>` is the only place to set it, and it defaults to a function that returns
`false`. `<Channel>` no longer accepts the prop: `<Chat>`'s value always overrode it, in v9 as well, so
it never had an effect. The message components read it from `useChatContext()`, and it is no longer on
the message contexts.

| Removed | Use instead |
| --- | --- |
| `<Channel isMessageAIGenerated={…}>` | `<Chat isMessageAIGenerated={…}>` |
| `useMessagesContext().isMessageAIGenerated` | `useChatContext().isMessageAIGenerated` |
| `useMessageContext().isMessageAIGenerated` | `useChatContext().isMessageAIGenerated` |
| `MessageContent`'s `isMessageAIGenerated` prop | `<Chat isMessageAIGenerated={…}>` |

```diff
- <Channel channel={channel} isMessageAIGenerated={isAIMessage}>
+ <Chat client={client} isMessageAIGenerated={isAIMessage}>
```

```diff
- const { isMessageAIGenerated } = useMessageContext();
+ const { isMessageAIGenerated } = useChatContext();
```

---

# Part R — Platform, connection status, receipts and other changes

Platform floors, connection status, delivery receipts, more removed props and context fields, and the
`stream-chat` calls RN apps make most. Detection greps are in §1; the quick-reference table has rows for the
common ones.

## R.1 Platform floors and packaging (breaking)

- **`react-native` peer `>=0.76` → `>=0.79`** in `stream-chat-react-native-core`, `stream-chat-react-native` and
  `stream-chat-expo`; **`expo` peer `>=52` → `>=53`** in `stream-chat-expo`. `@stream-io/i18n` and `stream-chat`
  resolve through package `exports` subpaths, which Metro enables by default only from metro-config 0.82, the version
  RN 0.79 pins. Upgrade React Native / Expo first.
- **`stream-chat` declares `engines.node >=22.18.0`** (v9: `>=18`). Yarn 1 enforces `engines` and fails the install
  on an older Node; npm and pnpm only warn. Node is not your app's runtime, but it is your install and CI runtime.
- **`StateStore` and `Unsubscribe` are no longer exported from `stream-chat`.** They come from
  `@stream-io/state-store`, which the SDK already depends on. Add it to the app if you build your own stores, and make
  sure **one copy** resolves: `StateStore` is compared nominally, so a second copy makes your stores unassignable to
  `useStateStore`.

  ```diff
  - import { StateStore, type Unsubscribe } from 'stream-chat';
  + import { StateStore, type Unsubscribe } from '@stream-io/state-store';
  ```

- **`dayjs` is `^1.11.23`** (v9 pinned `1.11.13` exactly) and must resolve to a single copy — see §19.

## R.2 Connection status: `ChatContext.isOnline` / `connectionRecovering` removed (breaking)

`useChatContext()` no longer returns `isOnline` or `connectionRecovering` (P.11). Status lives in two `stream-chat`
stores, and the SDK exports hooks over them:

- `useNetworkConnectionState()` — the **device** network (`client.networkConnection.state`). `isOnline` is
  **tri-state**: `undefined` means nobody has reported yet, so test `isOnline === false`, never `!isOnline`.
- `useWSConnectionState()` — the raw **socket** state (`client.wsConnection.state`: `isHealthy`, `lastHealthyAt`,
  …).
- `useSettledWSConnectionHealth()` — socket health for UI: a drop counts only once it outlasts
  `offlineNotificationDisplayDelayMs` (default 5000 ms; `0` disables the wait) or the device is known offline, a
  socket that has not connected yet counts as healthy until that delay runs out, and recovery counts at once.
- `netInfoStatusReporter` — the NetInfo reporter `<Chat>` installs. Building the client yourself, pass it at
  construction to skip the window before `<Chat>` mounts:
  `new StreamChat(apiKey, { client: { networkConnection: { statusReporter: netInfoStatusReporter } } })`.

```diff
- const { isOnline, connectionRecovering } = useChatContext();
- if (!isOnline) showBanner();
+ const isDeviceOffline = useNetworkConnectionState()?.isOnline === false;
+ const isSocketHealthy = useSettledWSConnectionHealth();
+ if (isDeviceOffline || !isSocketHealthy) showBanner();
```

Related changes:

- **`connection.changed` is no longer dispatched.** `client.on('connection.changed', …)` compiles and never fires.
  Subscribe to the stores above (`client.wsConnection.state.subscribe(…)` outside React). For "recovery finished" use
  `connection.recovered` (§L.2).
- **The banner delay is configuration**, not a fixed 5 s inside the client:
  `client.config.set({ client: { wsConnection: { offlineNotificationDisplayDelayMs: 3000 } } })`.
- **`<Chat>` registers `netInfoStatusReporter`** through
  `client.config.set({ client: { networkConnection: { statusReporter } } })` when no reporter is registered
  yet, with no teardown. A `statusReporter` you registered (at construction or with `client.config.set`) wins.
  `useCreateChatClient` passes `netInfoStatusReporter` at construction unless its `options` name one.
- **`OutputButtons` / `MessageComposer` `isOnline` prop** is `boolean` (settled socket health), not `boolean | null`
  from `ChatContext`.
- **`ChannelListHeaderNetworkDownIndicator`** shows when the device is offline or the settled socket health is false;
  **`NotificationAnnouncer`** follows settled socket health and announces "Offline" only when the device is known
  offline, "Reconnecting" otherwise; **`NetworkDownIndicator`** — see §L.7.
- **`useLoadingImage`** retries a failed image when the **device** network comes back (it followed `ChatContext`).

## R.3 Delivery receipts: `readBy` / `deliveredToCount` removed (breaking)

Removed from `MessageContextValue`, the `<Message>` props and `MessageStatus`'s props. `MessageStatus` now takes
booleans and works them out itself when you pass nothing:

```diff
- <MessageStatus message={message} readBy={readBy} deliveredToCount={deliveredToCount} />
+ <MessageStatus message={message} read={read} delivered={delivered} />
```

```diff
- const { readBy, deliveredToCount } = useMessageContext();
- const isRead = readBy === true || readBy > 1;
+ const { message } = useMessageContext();
+ const isRead = useIsMessageReadByOthers({ message });
+ const isDelivered = useIsMessageDeliveredToOthers({ message });
```

`useIsMessageReadByOthers` and `useIsMessageDeliveredToOthers` are new. For the counts, use the user lists v9 counted:
`useMessageReadData({ message }).length` / `useMessageDeliveredData({ message }).length`. All four need a channel in
context.

## R.4 More context fields and props removed or retyped (breaking, type-level)

Removed:

- `ChannelContextValue.maximumMessageLimit` — paginator configuration now, §O.1.
- `ChannelContextValue.uploadAbortControllerRef` — uploads belong to the composer's attachment manager; cancel by
  removing the attachment.
- `InputMessageInputContextValue.doFileUploadRequest` (a custom `MessageInputProvider` value) →
  `client.config.set({ messageComposer: { attachments: { doUploadRequest } } })`, §13.1.
- `ThreadContextValue.threadInstance` and `ThreadProps.threadInstance` — `thread` is the instance, §10.
- `ChannelPreviewProps.forceUpdate` and `useChannelPreviewData`'s third argument (`forceUpdateOverride`); preview data
  is reactive.
- `ChannelListViewProps.forceUpdate` (and `ChannelsContextValue.forceUpdate`, P.20).
- `useCreateMessageContext` params `members`, `readBy`, `deliveredToCount`, `isMessageAIGenerated` (§4, R.3, Q.3).

Retyped:

- `LoadingErrorProps.error` (`LoadingErrorIndicator`): `boolean | Error` → `Error`. `error={true}` no longer compiles.
- `InlineLoadingMoreIndicator` / `InlineLoadingMoreRecentIndicator` take `loadingMore` / `loadingMoreRecent` as
  props; they read context in v9. Rendered without the prop, they render nothing.
- `ChannelListViewProps`: `channels`, `channelListInitialized`, `hasNextPage`, `loadingChannels`, `loadingNextPage`
  and `refreshing` are required (`error` stays optional); new optional `paginator`.
- `CommandSuggestionItem` (`stream-chat`'s `CommandSuggestion`): `args`, `description`, `name` and `set` are required
  `string`s; `created_at` / `updated_at` are `TimestampNS`.
- `giphyVersion` (`Giphy`, `GiphyImage`, `OverlayProvider`, …) is typed `keyof Images`. `stream-chat`'s
  `GiphyVersions` is now an alias of it, with the same seven values.
- `URLPreview` / `URLPreviewCompact` / `Giphy` / `GiphyImage` `attachment` is `stream-chat` v10's `Attachment`
  (metadata under `custom`, §17.1).
- `TypingIndicatorContainer`: `thread` → `threadId` (§2.1).
- `AIStates` is a `const` object with literal values, so `[AIStates.Thinking, AIStates.Generating].includes(aiState)`
  no longer compiles. Compare with `===`:

  ```diff
  - const busy = [AIStates.Thinking, AIStates.Generating].includes(aiState);
  + const busy = aiState === AIStates.Thinking || aiState === AIStates.Generating;
  ```

- `ImageGalleryStateStore` `assets[]`: `created_at` is `Date | undefined` (converted from nanoseconds), `channelId`
  is `string`, `user` is `UserResponse`. Guard `created_at` in a custom gallery header or footer.

## R.5 `<Channel>` and `<Thread>` behaviour changes (behavioural)

`<Channel>`:

- **`initializeOnMount={false}` still queries** when the channel's paginator is empty: it skips `watch()` but runs
  `channel.messagePaginator.reload()`, a non-watching channel query. Seed the paginator yourself before mounting if no
  request may go out.
- **A provisional channel is not queried on mount.** A members-only channel with no id that is already initialized
  is created on its first send, not when `<Channel>` opens it. Call `channel.watch()` yourself if you relied on the
  open creating it.
- **`<Channel>` may render a different instance than you passed.** When `channel.supersededBy` is set (a
  members-only channel whose real cid another instance already holds), `<Channel>` renders the successor, unless the
  successor is open elsewhere and this composer has content. Inside `<Channel>`, read the channel from
  `useChannelContext()`, not from your own prop.
- **Sending no longer removes `type: 'error'` messages.** v9 ran `channel.state.filterErrorMessages()` on every send;
  remove an error message you want gone with `useMessageOperations().removeMessage(message)`.
- **`client.options.isLocalUnreadCountEnabled` is not read.** The local unread count with read events off is
  `client.config.set({ channel: { readEvents: { localUnreadCountEnabled: true } } })`.
- **`UnreadMessagesNotification` dismisses through its `markRead` prop.** A custom override that wraps the built-in
  must forward `markRead`, or dismissing stops marking the channel read.
- **The poll button can show before the server's `polls` flag arrives.** It follows
  `messageComposer.config.polls.enabled`, which defaults to `true` and turns off once the server config says no.
  Hide it with `client.config.set({ messageComposer: { polls: { enabled: false } } })`.
- **The input's `maxLength` follows `messageComposer.config.text.maxLengthOnSend`**, so a smaller registered value
  caps the input too (the channel type's `max_message_length` stays the upper bound).
- **Deleting a failed *edit* deletes the message on the server.** v9 removed every `failed` message locally only; v10
  does that only for a failed *send* (a failed message with no `message_text_updated_at`).
- **Initial page size is 25 unless you register one** through `client.config`: §16.1.
- **Reopening a channel left on an older page shows the newest messages** (also for `<Thread>`), unless a jump
  already landed or is loading, or `initializeOnMount={false}`: §8.

Message rows and previews:

- **`MessageFooter` shows the sender name when `memberCount !== 2`** (v9: more than two *loaded* members), so it now
  also shows when the count is 0 or 1.
- **The channel preview's typing indicator ignores typing in threads** (events with a `parent_id`).

`<Thread>`:

- **A failed first page replaces the thread UI.** When the reply paginator has a `lastQueryError` and no items,
  `<Thread>` renders `LoadingErrorIndicator` (with a retry) instead of the list and composer. Override
  `LoadingErrorIndicator` through `WithComponents` to change it.

## R.6 Channel list (breaking/behavioural)

The list's query now lives on the app-owned `ChannelPaginator` (§18.6); these are the ways its inputs differ from
v9's `<ChannelList>` props.

- **The paginator owns paging.** `requestOptions` (`ChannelPaginatorRequestOptions`) takes neither `offset` nor
  `limit`; set the page size with `paginatorOptions.pageSize`. v9's `options={{ offset }}` has no equivalent.
- **`filters` are `stream-chat` v10's generated filter types**: custom fields are `'custom.<field>'` keys, and each
  key takes one operator.

  ```diff
  - <ChannelList filters={{ type: 'messaging', members: { $in: [userId] }, myField: 'x' }} />
  + new ChannelPaginator({ client, filters: { type: 'messaging', members: { $in: [userId] }, 'custom.myField': 'x' } })
  ```

- **Channels can leave a list on events.** Every routed event (`message.new`, `member.updated`,
  `channel.updated`, …) re-checks the list's filters, so a channel that stops matching drops out until the next query.
- **`loadNextPage()` is a no-op before the first page has loaded** (§18.3).
- Sort is `SortParamRequest[]`, and an empty sort means the backend default (§17.5, §N.4).

## R.7 `stream-chat` state you may read directly (breaking — `stream-chat`)

v9 → v10:

- `channel.state.messages` → `useStateStore(channel.messagePaginator.state, (s) => ({ items: s.items }))`.
- `channel.state.latestMessages` / `channel.lastMessage()` → `channel.messagePaginator.latestMessage` (reactive through
  `messagePaginator.aggregateState`; `null` when there is none).
- `channel.state.threads[id]` → `client.threads.get(id)?.messagePaginator`.
- `channel.state.findMessage(id)` → `channel.messagePaginator.getItem(id)`, or `client.messageStore` for any loaded
  message.
- `channel.state.loadMessageIntoState(id)` → `channel.messagePaginator.jumpToMessage(id)`.
- `channel.state.isUpToDate` → `channel.messagePaginator.isActiveIntervalAtHead`.
- `channel.state.pinnedMessages` → `channel.pinnedMessagesPaginator`.
- `channel.state.mutedUsers` → `client.mutedUsersStore` (`useMutedUsers()`).
- `client.activeChannels` → `client.channelManager.get(cid)` / `client.channelManager.values()`. Channels are not
  evicted automatically; `client.channelManager.releaseUnusedChannels()` releases the ones nothing uses.
- `client.hydrateActiveChannels(…)` → `client.hydrateChannels(…)`.
- `client.threads.state` `threads` / `pagination` / `ready` and `client.threads.loadNextPage()` →
  `client.threads.paginator` (`state.items`, `isLoading`, `lastQueryError`; `toTail()`). `client.threads.threadsById`
  → `client.threads.get(id)`.
- `thread.state.replies` / `pagination`, `thread.loadNextPage()` / `loadPrevPage()` / `queryReplies()` →
  `thread.messagePaginator` (`state.items`, `toTail()` for older, `toHead()` for newer).

```diff
- const { replies } = useStateStore(thread.state, (s) => ({ replies: s.replies }));
+ const { replies } = useStateStore(thread.messagePaginator.state, (s) => ({ replies: s.items }));
```

Two request behaviours:

- **`channel.query(…)` no longer updates the message list.** It returns the page; only `watch()` places the page it
  fetches (`create()` places no messages). Page with `channel.messagePaginator.toTail()` / `toHead()` instead of
  `channel.query({ messages: { id_lt } })`. `watch()` and the paginator's own page requests do not go through
  `channel.query()`, so a spy on or an override of it does not see them; listen to `channels.queried` instead.
- **A request with `watch` or `presence` waits for a WebSocket connection id** — `channel.watch()`, `queryChannels*`,
  `queryUsers({ payload: { presence } })`. v9 silently downgraded it to a non-watching request. With no socket open
  or opening it throws `No connection id is available…`, so call `connectUser()` (or `openConnection()` after a
  `closeConnection()`) first.

## R.8 `stream-chat` client calls RN apps make (breaking — `stream-chat`)

The ones the v9 sample apps hit. The full list is `stream-chat`'s own (§17.5).

- **Push devices** — the device is no longer sent on connect, and the user comes from the connection:

  ```diff
  - await client.addDevice(token, 'firebase', userId, 'my-provider');
  + await client.createDevice({ id: token, push_provider: 'firebase', push_provider_name: 'my-provider' });
  - const { devices } = await client.getDevices(userId);
  + const { devices } = await client.listDevices();
  - await client.removeDevice(token, userId);
  + await client.deleteDevice({ id: token });
  ```

  `client.setLocalDevice` and the `device` client option are removed.

- **`client.queryChannels(request)` is the raw call**: it returns the response, creates no `Channel` instances and
  stores nothing. v9's behaviour is `client.queryChannelsAndHydrate({ filter_conditions, sort, ...options })`, which
  returns `Channel[]`.
- **Creating and updating channels** — custom fields under `custom`, members as objects:

  ```diff
  - client.channel('messaging', id, { name, members: [userA, userB] });
  + client.channel('messaging', id, { custom: { name }, members: [{ user_id: userA }, { user_id: userB }] });
  - await channel.update({ name });
  + await channel.updatePartial({ set: { name } }); // or channel.update({ data: { custom: { name } } })
  ```

- **Request objects** — `channel.sendMessage({ message, ...options })`, `client.search({ payload })`,
  `client.queryUsers({ payload })`, `channel.queryMembers({ payload })`. The `payload` carries `filter_conditions`,
  `sort` (an array), `limit`, `offset`, …
- **Moderation moved to `client.moderation`** — `client.muteUser(id)` →
  `client.moderation.mute({ target_ids: [id] })`, `client.banUser(id)` →
  `client.moderation.ban({ target_user_id: id })`, `flagMessage(id)` / `flagUser(id)` →
  `client.moderation.flagMessage({ message_id: id })` / `flagUser({ user_id: id })`.
- **Reminders** — `client.reminders.upsertReminder({ message_id }, { remind_at: date })` (`remind_at` is a `Date`;
  omit it to clear), sort as `[{ field: 'remind_at', direction: 1 }]`, `ReminderResponse` → `ReminderResponseData`.
- **Live location** — `channel.stopLiveLocationSharing({ message_id })` (it took the location object),
  `SharedLocationResponse` → `SharedLocationResponseData`. Call `LiveLocationManager.dispose()` when you are done with
  a manager you created.
- **Custom events** — `channel.sendEvent({ type, ...fields })` →
  `channel.sendEvent({ event: { type, custom: {…} } })`.
- **`connectUser` takes a `ClientUser`**: your own user fields go under `custom`. A `UserResponse` fixture no longer
  type-checks (it requires server-owned fields such as `created_at`); type it as `ClientUser`. Grep for extra top-level
  keys on the user you connect with (`imageUrl`, `avatar`, `nickname`, ...): TypeScript rejects them only in an object
  literal passed straight to `connectUser`, not in a user object built earlier (a `useMemo`, a variable). An avatar URL
  goes in `image`, which the SDK's avatars read; anything else app-owned goes in `custom`.

  ```ts
  // v9
  const user = { id, name, imageUrl: avatarUrl, team: 'red' };
  // v10
  const user: ClientUser = { id, name, image: avatarUrl, custom: { team: 'red' } };
  await client.connectUser(user, token);
  ```
- **Type renames the sample apps hit**: `MessageResponseBase` → `MessageResponse`; search results are
  `SearchResultMessage` and `result.message` is optional; `DeliveredMessageConfirmation` → `DeliveredMessagePayload`;
  `DraftFilters` / `DraftSort` / `Pager` → `QueryDraftsRequest`.
- **Same name, different meaning** — some names still compile but mean something else now, e.g. `User`, `Reaction`,
  `PollResponse` and `ChannelConfig`. Check what an annotation resolves to before keeping it.
- **Errors** — `ErrorFromResponse` → `StreamAPIError`. A request answered with HTTP 429 or `TOKEN_EXPIRED` is
  retried up to 10 times with backoff, then throws `RetryError`.
- **Logging** — the `logger` option and `client.logger` are replaced by the process-wide `chatLoggerSystem`, and it
  is **on by default**: a console sink at `info`. Quiet it with `chatLoggerSystem.configureLoggers({ default: { level:
  'warn' } })`.
- **`message.ai_generated` → `message.custom?.ai_generated`** — the usual body of `isMessageAIGenerated` (Q.3):

  ```diff
  - <Chat client={client} isMessageAIGenerated={(message) => !!message.ai_generated}>
  + <Chat client={client} isMessageAIGenerated={(message) => !!message.custom?.ai_generated}>
  ```

## R.9 Offline DB contract (breaking for custom offline code)

Only for a custom `AbstractOfflineDB`, a subclass of `OfflineDB`, or direct `OfflineStoreApis` / SQLite access.

- **`getChannelsForQuery` input** (`DBGetChannelsForQueryType`): `{ userId, filters, options, sort }` →
  `{ userId, options }`, with the filters in `options.filter_conditions` and the sort in `options.sort`. The return
  type changed too (§N.1).
- **`OfflineDB` lost `handleOfflineFailedUpdateMessagePendingTask` and
  `mergeFailedMessageUpdateIntoPendingSendMessage`.** New: `handleUpdateMessagePendingTask`, `hardDeleteMessages`,
  `queriesBehindChannelGuard`, `upsertMessageBehindChannelGuard`, plus the concrete helpers in §M.6. Port overrides
  of the removed hooks to the new pending-task handler.
- **`deleteMessagesForChannel({ truncated_at })`** takes a `TimestampNS` (v9: an ISO string), defaulting to `nowNs()`.
- **`insertReaction` / `updateReaction` skip a reaction whose message is not cached** (v9's write failed on the
  foreign key and aborted the batch).
- **`OfflineStoreApis` retyped** to `stream-chat` v10 types: sort is `SortParamRequest[]`, channel rows are
  `ChannelStateResponseFields` (was `ChannelAPIResponse`), polls `PollResponseData`, locations
  `SharedLocationResponseData`, app settings `GetApplicationResponse`. `currentUserId` → `userId` is P.6.
- **`SqliteClient.logger`** is a `stream-chat` `Sink` (was `Logger`); the call shape `(level, message, extra)` is
  unchanged.
- **v9's queued pending tasks are dropped** by the reinit that `dbVersion` 16 → 18 forces (§N.2).

## R.10 i18n gaps

Not covered by §19 or `i18n-v10-migration.md`:

- **`Streami18n.geti18Instance()` is removed** → the `i18n.i18nInstance` property. `getAvailableLanguages()` and
  `getTranslations()` (see the i18n guide) and `addOnTFunctionOverrideListener` are removed too; subscribe to
  `i18n.state` instead of the listener.
- **`TranslationContextValue.userLanguage` is `string`** (v9: `stream-chat`'s `TranslationLanguages`), and
  `DEFAULT_USER_LANGUAGE` is `'en'`. Narrow it before passing it to `stream-chat`'s translation API, whose `language`
  is a closed union: `client.translateMessage({ id }, { language })`.
- **`isDayOrMoment`** is re-exported from `@stream-io/i18n`: `(value) => value is DateTimeLike` (v9:
  `output is Dayjs | Moment`).
- **Four app-callable formatter keys left the catalog** and are not in the key map: `duration/Location end at`,
  `duration/Remind Me`, `timestamp/ReminderNotification`, `timestamp/MessageEditedTimestamp`. The SDK never rendered
  them, but v9 shipped them in `en.json`, so apps called them. Register the expression yourself, for every language
  you register (English included):

  ```ts
  import type { LooseTranslationDictionary } from 'stream-chat-react-native';

  const appFormatterExpressions: LooseTranslationDictionary = {
    'duration.locationEndAt': '{{ milliseconds | durationFormatter(withSuffix: false) }}',
    'duration.remindMe': '{{ milliseconds | durationFormatter(withSuffix: true) }}',
    'timestamp.reminderNotification': '{{ timestamp | timestampFormatter(calendar: true) }}',
  };
  streami18n.registerTranslation('en', appFormatterExpressions);
  ```

  The SampleApp's [`appKeys.ts`](https://github.com/GetStream/stream-chat-react-native/blob/V10/examples/SampleApp/src/i18n/appKeys.ts)
  does this. `duration/Message reminder` is still bundled, as
  `duration.messageReminder`.
- **`t()` only accepts catalog keys.** `TranslationContextValue.t` is `StreamTFunction`, so an app key needs
  `asDynamicKey('…')` (`timestamp.*` / `duration.*` keys are accepted as they are). See the i18n guide's "Custom keys
  of your own".
- **`SCROLL_TO_BOTTOM_ACCESSIBILITY_LABEL_KEY` / `SCROLL_TO_BOTTOM_WITH_COUNT_ACCESSIBILITY_LABEL_KEY` hold the dotted
  keys** (`messageList.scrollToBottom.accessibilityLabel`, `messageList.scrollToBottom.withCount.accessibilityLabel`),
  not `a11y/…`.

## R.11 Deep imports (low)

Only affects imports from `stream-chat-react-native-core/src/…` or `…/lib/…`. None of these was exported from the
package root in v9. Deleted, with no public replacement:

- `ChannelsStateProvider`, `useChannelsStateContext`, `useChannelState` (`contexts/channelsStateContext`)
- `ActiveChannelsRefContext` (`contexts/activeChannelsRefContext`)
- `useChannelDataState` (`components/Channel/hooks/useChannelDataState`)
- `ChannelUnreadStateStore` (`state-store/channel-unread-state`) — §7
- `MessagePreviousAndNextMessageStore` (`state-store/message-list-prev-next-state`)
- `ChannelList/hooks/utils` — the pin / archive sort helpers (`isChannelPinned`, `isChannelArchived`, …)
- `useCreateMessageComposer` (`contexts/messageInputContext/hooks`)
- the `utils/i18n/*` modules (`getDateString`, `predefinedFormatters`, `calendarFormats`, `types`) — their functions
  are root exports now (§19)

Still there but still deep-only, with changed signatures: `filterTypingUsers` (§2.1) and `MessageComposerContext` /
`useMessageComposerContext` (§10.2).

---

# Part S — i18n

## 19. English-only bundle, dotted keys, shared runtime

**The full guide is `i18n-v10-migration.md`** (see Companion documents). Fetch it when the app registers
translations, calls `t()` with its own keys, or constructs `Streami18n`. The three shapes of change:

1. **Keys are stable dotted identifiers**, not the English copy, with the English inline as i18next's
   `defaultValue`. The reviewed old→new table is `i18n-v10-key-map.json` (see Companion documents). Renaming is not
   optional and **it fails silently** — an old key simply never matches, so the override stops applying and
   English renders with no error. Type your dictionary as `TranslationDictionary` to turn that into a compile
   error.
2. **English is the only bundled language.** The 12 non-English dictionaries and the `*Translations` exports
   are gone. An integrator supplies their own, additively; a key they omit still renders English.
3. **The runtime moved to `@stream-io/i18n`**, shared with the React SDK. `Streami18n` is still exported from
   `stream-chat-react-native` / `stream-chat-expo` and keeps its name; the date helpers (`getDateString`,
   `predefinedFormatters`, …), deep imports in v9, are root exports now — but reactivity is a `StateStore`
   rather than listeners, `setLanguage` returns `void`, `getTranslators()` is now `init()`, and a few
   date-helper parameters were renamed to the one name both SDKs use. Nothing is kept as a deprecated alias.
   See the quick-reference rows above.

Two dependency rules that produce silent breakage rather than errors:

- **`dayjs` must resolve to a single copy.** Declare it compatibly with `@stream-io/i18n`'s range (`^1.11.23`)
  or not at all. A disagreeing exact pin installs a second copy, and an app's `import 'dayjs/locale/de'` then
  extends an instance the SDK never formats with — dates stay English, nothing throws.
- **Do not declare `i18next`.** It arrives through `@stream-io/i18n`, which registers dictionaries on its own
  `createInstance()` rather than a global — so unlike dayjs, a second copy would be harmless. Skip it anyway.

---

## Verification

**1. Static checks.** Run the app's own scripts (read `scripts` in `package.json`; typical names are
`typecheck`, `tsc`, `lint`, `test`). For a TypeScript app without a typecheck script, run `npx tsc --noEmit`.
Compare with the Phase 0 baseline. Removed symbols surface as "Property does not exist" / "Cannot find name" /
"has no exported member" errors: fix each per the section its name maps to (Ctrl-F the name in the
Quick reference). For a `stream-chat` error this guide does not cover, see Rule 8.

**2. Leftover v9 identifiers.** These commands list every v9 name that v10 removed or renamed. Outside comments
and changelogs they must return **zero** hits; this is the only check that catches them in plain JavaScript.
A hit inside a string or an unrelated identifier of the app's own is fine once you have confirmed it.
Names that still exist in v10 with a different meaning or on a different object (`banUser`, `muteUser`,
`doFileUploadRequest`, `readBy`) are not listed here; §R.8, §13.1 and §R.3 detect them.

```bash
# stream-chat-react-native / -expo / -core names removed or renamed in v10
rg -n -t js -t ts -g '!**/node_modules/**' '\b(useTypingContext|TypingProvider|TypingContextValue|useCreateTypingContext|usePaginatedMessageListContext|PaginatedMessageListProvider|PaginatedMessageListContextValue|useCreatePaginatedMessageListContext|useTargetedMessage|setTargetedMessage|channelUnreadStateStore|setChannelUnreadState|ChannelUnreadState|loadChannelAroundMessage|loadChannelAtFirstUnreadMessage|reloadChannel|highlightedMessageId|loadMoreThread|loadMoreRecentThread|reloadThread|threadMessages|setThreadMessages|threadHasMore|threadLoadingMore|threadLoadingMoreRecent|threadInstance|closeThreadOnDismount|ThreadMessageComposer|ThreadType|additionalMessageListProps|additionalMessageFlashListProps|additionalMessageComposerProps|shouldUseFlashList|shouldSyncChannel|MessageActionsHookProps|uploadAbortControllerRef|deliveredToCount|connectionRecovering)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' '\b(doMarkReadRequest|doSendMessageRequest|doUpdateMessageRequest|stateUpdateThrottleInterval|newMessageStateUpdateThrottleInterval|preSendMessageRequest|patchMessageTextCommand|maximumMessageLimit|allowSendBeforeAttachmentsUpload|useChannelUpdated|queryChannelsOverride|lockChannelOrder|onAddedToChannel|onRemovedFromChannel|onChannelDeleted|onChannelHidden|onChannelVisible|onChannelUpdated|onChannelTruncated|onChannelMemberUpdated|onNewMessage|onNewMessageNotification|useSelectedChannelState|reduceMessagesToString|findInMessagesById|findInMessagesByDate|getLastReceivedMessage|DebugContextProvider|useDebugContext|DebugContextValue|DebugDataType|useIsOnline|isChannelActive|scrollToFirstUnreadThreshold|deleteReactionsForMessage|useClientMutedUsers|useAppSettings|setupCommandUIMiddlewares|DefaultCommandData)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' '\b(geti18Instance|getAvailableLanguages|getTranslations|addOnTFunctionOverrideListener|addOnLanguageChangeListener|getTranslators|relativeCompactDateFormatter|getDateStringForA11y|(en|es|fr|he|hi|it|ja|ko|nl|ptBR|ru|tr)Translations)\b' .
rg -n -t js -t ts -t json -g '!**/node_modules/**' "'a11y/|\"a11y/" .
rg -n -t js -t ts -g '!**/node_modules/**' '\bthreadList\s*[=:,}]|\bhardDelete\s*:|\buse(MutedUsers|MutedChannels)\(\s*\w|\buse(MessageActions|MessageActionHandlers)\(\s*\{|\buseMessageList\(\{\s*threadList' .

# stream-chat names removed or renamed in v10 (the full list is the stream-chat type rename table)
rg -n -t js -t ts -g '!**/node_modules/**' '\b(activeChannels|hydrateActiveChannels|threadsById|recoverState|recoverStateOnReconnect|createChannelManager|setLocalDevice|addDevice|getDevices|removeDevice|shadowBan|ErrorFromResponse|moderation_details|FormatMessageResponse|EventTypes|AppSettingsAPIResponse|MessageResponseBase|TranslationLanguages|ReadResponse|DeliveredMessageConfirmation|createAbortControllerForNextRequest|sendFile|sendImage|StreamChatOptions|setMessageComposerSetupFunction|syncStatus|InternalSearchControllerState)\b' .
rg -n -t js -t ts -g '!**/node_modules/**' "connection\.changed|\.disconnected\b|\.lastMessage\(\)|\.getConfig\(\)|\bclient\.configs\b|channel\.state\.(messages|latestMessages|threads|pinnedMessages|isUpToDate|findMessage|loadMessageIntoState|mutedUsers)\b" .
```

**3. Runtime checks.** Builds cannot prove these; run the ones that match what the app uses, on a device or
simulator, and list the rest in the report as still to do.

- **Messages:** send, edit, delete (soft and hard) and react, online and offline; a failed send shows a retry;
  typing indicator; member and watcher counts; the unread separator, scroll-to-bottom button and unread banner;
  mark-read on reaching the bottom and on dismissing the banner; any custom `Message`, list loading indicator,
  thread footer or typing indicator override.
- **Message list:** pagination in both directions; jump to a quoted reply (highlight), jump to the first unread;
  a deep link to a message lands on it; reopening a channel after a jump shows the newest messages.
- **Threads:** open from a message, reply, close; open from the thread list; open from a push notification
  or deep link (`client.threads.ensure`).
- **Channel list:** first load and skeleton; pagination; new-message reordering; added to / removed from a
  channel, hide / unhide, delete, truncate, rename; pull-to-refresh; a pinned-first `sort` keeps pinned
  channels on top; log out and in as another user (the list reloads).
- **Connection recovery** (with offline support on and off): airplane mode with the list open and with a
  channel open (nothing blanks, content refreshes); background and foreground the app; send while offline,
  then reconnect (the message goes out); open a thread and reconnect (replies refresh).
- **Offline support:** the first launch after the upgrade reinitializes the database once (§N.2); with a
  `predefined_filter` list, a cold start restores the cached page in the server's order.
- **i18n:** every registered language renders translated, including dates and plural strings.

## Index of breaking changes

Maps each section of the RN reference,
[`v10-breaking-changes.md`](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md),
to the sections of this guide that cover it. `i18n guide` is `i18n-v10-migration.md` (Companion documents).

| Reference section | Covered in this guide |
| --- | --- |
| [1. Dependencies and platform](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#1-dependencies-and-platform) | §17, §R.1, §19, §N.2, §R.9, i18n guide |
| [2. Removed exports](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#2-removed-exports) | §2, §3, P.1, §15, §6, §18.2, P.2, §R.2, P.12, P.17, §17.6, §10.1, §7, P.9, §15.1, §19, i18n guide |
| [3 › `<Chat>`](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#chat) | §L.1, §17.7, §R.2 |
| [3 › `<Channel>`](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#channel) | §13, §8, §13.1, P.17, §O.1, §O.3, Q.3, P.5, §10.1, §10.2, §17.5, §R.10 |
| [3 › `<ChannelList>`](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#channellist) | §18.6, §18.1, §17.5, §N.4, §R.6, §18 |
| [3 › `<ChannelListView>`, `<ChannelPreview>`](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#channellistview-channelpreview) | §R.4, P.20 |
| [3 › `<Message>` and message components](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#message-and-message-components) | §R.3, §R.4, Q.3, P.13, §10.1, §9, §15.1, §10.2, §4, §17.1 |
| [3 › `<MessageList>` / `<MessageFlashList>`](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#messagelist--messageflashlist) | §12, P.5, P.7, §O.1, §10.2, §10.1, §12.1, §O.3, §7, §2.1, §R.4, §R.5 |
| [3 › `<Thread>` and thread components](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#thread-and-thread-components) | §10.1, §10.2 |
| [3 › Composer](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#composer) | §R.2, §R.10, §R.4 |
| [3 › Indicators, polls, misc](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#indicators-polls-misc) | §R.4, §17.5, §19 |
| [4 › Removed contexts](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#removed-contexts) | §2, §3, P.1 |
| [4 › `ChannelContext` (`useChannelContext()`)](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#channelcontext-usechannelcontext) | §10.2, §4, §5, §6, §7, §8, §L.7, P.4, §R.4 |
| [4 › `ChatContext` (`useChatContext()`)](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#chatcontext-usechatcontext) | §R.2, P.11 |
| [4 › `ChannelsContext` (`useChannelsContext()`)](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#channelscontext-usechannelscontext) | P.20, §18.3 |
| [4 › `MessagesContext` (`useMessagesContext()`)](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#messagescontext-usemessagescontext) | §9, §17.2, §6, P.4, Q.3, §10.2 |
| [4 › `MessageContext` (`useMessageContext()`)](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#messagecontext-usemessagecontext) | §4, §R.3, Q.3, §10.2, §10.1, §15.1 |
| [4 › `ThreadContext` (`useThreadContext()`)](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#threadcontext-usethreadcontext) | §10, §10.2, §10.1, §R.4 |
| [4 › `ThreadsContext`](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#threadscontext) | §10.1 |
| [4 › `MessageInputContext` (`useMessageInputContext()`)](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#messageinputcontext-usemessageinputcontext) | §11, P.17, §O.3, §R.4 |
| [4 › `TranslationContext` (`useTranslationContext()`)](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#translationcontext-usetranslationcontext) | §R.10, i18n guide |
| [5. Hooks — changed signatures](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#5-hooks--changed-signatures) | §14, P.3, §R.4, §17.5, §17.7, §R.8, P.8, §15.1, §9, §10.1, §15, §K.6 |
| [6. Utilities and functions — changed](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#6-utilities-and-functions--changed) | §17.6, §R.10, §17.4 |
| [7. Types](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#7-types) | §K.7, §R.4, §17.1, §17.6, §17.5, §19 |
| [8. Classes and state stores](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#8-classes-and-state-stores) | §19, §R.10, §R.9, §N.1, P.6, i18n guide |
| [9. Component slots, icons and theme](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#9-component-slots-icons-and-theme) | §10.2, §15.1, §L.7, §R.2 |
| [10. i18n and translations](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#10-i18n-and-translations) | §19, Q.1, §R.10, §17.5, i18n guide |
| [11. Offline storage](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#11-offline-storage) | §N.2, §17.5, §N.1, §N.3, §R.9, §M.7 |
| [12. `stream-chat` v10 changes an RN integrator hits](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#12-stream-chat-v10-changes-an-rn-integrator-hits) | Part K, §R.7, §K.1, §K.2, §K.8, P.15, §K.4, §L.4, Part L, §R.2, §L.1, §L.6, §L.2, §13.1, §17.7, §17.1, §17.4, §17.5, §R.8, §17.2, §17.3, §5, §9 |
| [13. Behavioural changes (no symbol changed)](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#13-behavioural-changes-no-symbol-changed) | §9.1, §16, Part M, §R.5, §16.2, §16.1, §15.1, §L.4, §8, §10.3, §L.10, §18.5, §N.4, §R.6, §18.6, P.21, §O.3, §13.1 |
| [14. Deep imports](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#14-deep-imports) | §R.11 |
| [17. No-action fixes: detail moved from the migration guide](https://github.com/GetStream/stream-chat-react-native/blob/V10/ai-docs/v10-breaking-changes.md#17-no-action-fixes-detail-moved-from-the-migration-guide) | the "No action" notes in L.8–L.10, M.1, M.3–M.5, M.7, P.10, P.14, P.16, P.18, P.19, P.21, P.22, Q.2 |
