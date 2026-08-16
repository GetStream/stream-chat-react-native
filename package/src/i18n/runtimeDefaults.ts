/**
 * The only translation data bundled with the SDK. Hand-maintained.
 *
 * Prose keys are not here — they pass their English copy inline at the call site
 * (`t('message.status.sent.text', 'Sent')`). These keys have no inline copy to fall back on:
 * they are formatter expressions, passed around as prop values and resolved by name at runtime
 * (`timestampTranslationKey`), so the extractor never sees a literal call site for them.
 *
 * The leaf segment is the consuming component's name and stays PascalCase, matching the web SDK
 * and the `timestamp/<Component>` values these keys replace. Every other namespace is lower
 * camelCase.
 *
 * Unlike the web SDK this catalog has no `language.*` namespace (React Native never rendered ISO
 * language names) and no `translationBuilderTopic.*` — there is no i18next postProcessor here; the
 * formatter registry in `utils/i18n/predefinedFormatters.ts` is the whole extension surface.
 *
 * `yarn build-translations` joins this file with the inline defaults to generate
 * `src/i18n/keys.ts`; `yarn i18n:export` writes the joined catalog as JSON.
 *
 * Two entries carry English day words inside their `calendarFormats` argument —
 * `timestamp.ChannelPreviewStatus` and `timestamp.ThreadListItem`. Integrators translate those by
 * overriding the key; `dayjsLocaleConfigForLanguage` does not reach them, because `getDateString`
 * short-circuits to `t()` before the Day.js calendar path and `timestampFormatter` then parses the
 * calendar config out of the translation value itself. Adding a third fails a guard in
 * `__tests__/Streami18n.test.ts` that keeps `ai-docs/i18n-v15-migration.md` in sync.
 */
export const runtimeDefaults = {
  'duration.messageReminder': '{{ milliseconds | durationFormatter(withSuffix: true) }}',
  'timestamp.ChannelPreviewStatus':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Yesterday]", "lastWeek":"dddd", "nextDay":"[Tomorrow]", "nextWeek":"dddd [at] LT", "sameDay":"LT", "sameElse":"L"}) }}',
  'timestamp.FileAttachmentListSection': '{{ timestamp | timestampFormatter(format: MMMM YYYY) }}',
  'timestamp.ImageGalleryHeader': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.InlineDateSeparator': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.MessageSystem': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.MessageTimestamp': '{{ timestamp | timestampFormatter(format: LT) }}',
  'timestamp.PollVote': '{{ timestamp | relativeCompactDateFormatter }}',
  'timestamp.StickyHeader': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.ThreadListItem':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Yesterday]", "lastWeek":"dddd", "nextDay":"[Tomorrow]", "nextWeek":"dddd [at] LT", "sameDay":"LT", "sameElse":"L"}) }}',
  'timestamp.UserActivityStatus': 'Last seen {{ timestamp | fromNowFormatter }}',

  // Screen-reader labels and lookup-table entries. These reach `t()` as runtime values — from a
  // JSX prop, a ternary branch, or a table keyed by something other than the copy — so there is no
  // call site at which an inline default could be written.
  'attachment.gallery.doubleTapToOpen.accessibilityLabel': 'Double tap to open',
  'attachment.gallery.image.accessibilityLabel': 'Gallery image',
  'attachment.gallery.video.accessibilityLabel': 'Gallery video',
  'attachmentPicker.image.deselect.accessibilityLabel': 'Deselect image',
  'attachmentPicker.image.select.accessibilityLabel': 'Select image',
  'attachmentPicker.typeButton.camera.accessibilityLabel': 'Open camera',
  'attachmentPicker.typeButton.commands.accessibilityLabel': 'Open commands',
  'attachmentPicker.typeButton.files.accessibilityLabel': 'Open file picker',
  'attachmentPicker.typeButton.images.accessibilityLabel': 'Open photo picker',
  'attachmentPicker.typeButton.poll.accessibilityLabel': 'Open poll creation',
  'attachmentPicker.typeButton.videoRecorder.accessibilityLabel': 'Open video recorder',
  'attachmentPicker.video.deselect.accessibilityLabel': 'Deselect video',
  'attachmentPicker.video.select.accessibilityLabel': 'Select video',
  'autoCompleteInput.mention.channel.description': 'Notify everyone in this channel',
  'autoCompleteInput.mention.here.description': 'Notify every online member in this channel',
  'autoCompleteInput.suggestions.commandsAvailable.accessibilityLabel':
    'Command suggestions available',
  'autoCompleteInput.suggestions.emojisAvailable.accessibilityLabel': 'Emoji suggestions available',
  'autoCompleteInput.suggestions.mentionsAvailable.accessibilityLabel':
    'Mention suggestions available',
  'avatar.accessibilityLabel': 'Avatar of {{name}}',
  'avatar.channel.direct.accessibilityLabel': 'Direct chat with {{name}}',
  'avatar.channel.group.accessibilityLabel': 'Channel with {{count}} members',
  'channelDetails.addMembers.accessibilityLabel': 'Add members',
  'channelDetails.editChannel.accessibilityLabel': 'Edit channel',
  'channelDetails.editChannel.upload.accessibilityLabel': 'Upload channel image',
  'channelDetails.editImageSheet.close.accessibilityLabel': 'Close edit picture sheet',
  'channelDetails.header.back.accessibilityLabel': 'Back',
  'channelDetails.navigation.files.label': 'Files',
  'channelDetails.navigation.photosAndVideos.label': 'Photos & Videos',
  'channelDetails.navigation.pinnedMessages.label': 'Pinned Messages',
  'channelPreview.deliveryStatus.delivered.accessibilityLabel': 'Delivered, sent by you',
  'channelPreview.deliveryStatus.read.accessibilityLabel': 'Read, sent by you',
  'channelPreview.deliveryStatus.sent.accessibilityLabel': 'Sent by you',
  'channelPreview.lastMessage.accessibilityLabel': 'Last message {{date}}',
  'channelPreview.muted.accessibilityLabel': 'Muted',
  'channelPreview.pinned.accessibilityLabel': 'Pinned',
  'channelPreview.unreadCount.accessibilityLabel': '{{count}} unread messages',
  'common.close.accessibilityLabel': 'Close',
  'common.messageOverlay.swipeHint.accessibilityLabel':
    'Swipe right to go through different actions',
  'imageGallery.footer.grid.accessibilityLabel': 'Grid Icon',
  'imageGallery.footer.share.accessibilityLabel': 'Share Button',
  'imageGallery.header.hideOverlay.accessibilityLabel': 'Hide Overlay',
  'imageGallery.position.accessibilityLabel': '{{position}} of {{count}}',
  'imageGallery.videoControl.playPause.accessibilityLabel': 'Play Pause Button',
  'message.content.contextMenuHint.accessibilityLabel':
    'Double tap and hold to activate contextual menu',
  'message.content.fromSender.accessibilityLabel': 'Message from {{sender}}',
  'message.content.fromYou.accessibilityLabel': 'Message from you',
  'message.reactionList.more.accessibilityLabel': 'and {{count}} more reactions',
  'message.reactionList.viewHint.accessibilityLabel': 'Double tap to view reactions',
  'message.reactionList.youReacted.accessibilityLabel': 'you reacted',
  'message.status.delivered.accessibilityLabel': 'Delivered',
  'message.status.read.accessibilityLabel': 'Read',
  'message.status.sending.accessibilityLabel': 'Sending',
  'message.status.sent.accessibilityLabel': 'Sent',
  'messageInput.addAttachment.accessibilityLabel': 'Add attachment',
  'messageInput.audioRecorder.delete.accessibilityLabel': 'Delete voice recording',
  'messageInput.audioRecorder.holdToRecord.text': 'Hold to record. Release to save.',
  'messageInput.audioRecorder.permissionDenied.text': 'Please allow Audio permissions in settings.',
  'messageInput.audioRecorder.send.accessibilityLabel': 'Send voice recording',
  'messageInput.audioRecorder.start.accessibilityLabel': 'Start voice recording',
  'messageInput.audioRecorder.stop.accessibilityLabel': 'Stop voice recording',
  'messageInput.closeAttachments.accessibilityLabel': 'Close attachments',
  'messageInput.removeAttachment.accessibilityLabel': 'Remove Attachment',
  'messageInput.saveEdit.accessibilityLabel': 'Save edited message',
  'messageInput.sendMessage.accessibilityLabel': 'Send message',
  'messageList.dismissUnread.accessibilityLabel': 'Dismiss unread messages',
  'messageList.scrollToBottom.accessibilityLabel': 'Scroll to bottom',
  'messageList.scrollToBottom.withCount.accessibilityLabel':
    'Scroll to bottom, {{count}} new messages',
  'messageMenu.actionList.accessibilityLabel': 'Message actions',
  'messageMenu.reactionPicker.moreReactions.accessibilityLabel': 'Open more reactions',
  'notifications.commandUnavailable.error': 'Command not available',
  'notifications.attachmentUploadFailed.error': 'Error uploading attachment',
  'notifications.attachmentUploadFailed.withReason.error':
    'Attachment upload failed due to {{reason}}',
  'notifications.pollCreateFailed.error': 'Failed to create the poll',
  'notifications.pollCreateFailed.withReason.error': 'Failed to create the poll due to {{reason}}',
  'notifications.pollEndFailed.withReason.error': 'Failed to end the poll due to {{reason}}',
  // Emitted by `stream-chat`'s poll composer and mapped in `externalStrings.ts`. They arrive as
  // English at runtime, so there is no call site to carry the copy.
  'poll.createPoll.maxVotes.range.error': 'Type a number from 2 to 10',
  'poll.createPoll.options.duplicate.error': 'Option already exists',
  'poll.createPoll.close.accessibilityLabel': 'Close poll creation',
  'poll.createPoll.maxVotes.decrease.accessibilityLabel': 'Decrease maximum votes',
  'poll.createPoll.maxVotes.increase.accessibilityLabel': 'Increase maximum votes',
  'poll.createPoll.submit.accessibilityLabel': 'Create poll',
  'poll.endVote.error': 'Failed to end the poll',
  'poll.modalHeader.close.accessibilityLabel': 'Close poll',
  'reply.removeEdit.accessibilityLabel': 'Remove edit',
  'reply.removeReply.accessibilityLabel': 'Remove reply',
  'uiComponents.bottomSheetModal.opened.accessibilityLabel':
    'Bottom sheet opened. Activate the close action or use the escape gesture to dismiss.',
};
