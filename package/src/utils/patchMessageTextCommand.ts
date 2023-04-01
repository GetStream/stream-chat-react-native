/**
 * Converts a message text command to proper format
 * Example: "/mute @username" to "/mute @userId"
 * Supports "/ban", "/unban", "/mute", "/unmute"
 * @param messageText
 * @param mentionedUsers
 * @returns
 */
export function patchMessageTextCommand(messageText: string, mentionedUserIds: string[]): string {
  if (mentionedUserIds.length === 0) {
    return messageText;
  }
  const trimmedMessageText = messageText.trim();

  /**
   * The required formats are "/unban @userid" or "/mute @userid" or "/unmute @userid"
   */
  if (
    trimmedMessageText.startsWith('/mute ') ||
    trimmedMessageText.startsWith('/unmute ') ||
    trimmedMessageText.startsWith('/unban ')
  ) {
    return trimmedMessageText.replace(/@.+/, `@${mentionedUserIds[0]}`);
  }

  /**
   * The required format is "/ban @userid reason"
   */
  if (trimmedMessageText.startsWith('/ban ')) {
    const reasonText = trimmedMessageText.split(' ').pop() ?? '';
    return `/ban @${mentionedUserIds[0]} ${reasonText}`.trim();
  }

  return messageText;
}
