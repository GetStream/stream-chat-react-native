import { patchMessageTextCommand } from '../patchMessageTextCommand';

describe('patchMessageTextCommand', () => {
  test.each<[string, string, string[]]>([
    ['/ban @santhosh vaiyapuri reason', '/ban @santhosh reason', ['santhosh']],
    ['/ban @santhosh vaiyapuri', '/ban @santhosh vaiyapuri', ['santhosh']],
    ['/ban @santhosh', '/ban @santhosh @santhosh', ['santhosh']],
    ['/ban @santhosh vaiyapuri @khushal reason', '/ban @santhosh reason', ['santhosh', 'khushal']],
    ['/mute @santhosh vaiyapuri', '/mute @santhosh', ['santhosh']],
    ['/mute @santhosh vaiyapuri @khushal reason', '/mute @santhosh', ['santhosh', 'khushal']],
  ])('Patch message with text:"%s" to "%s")', (input, expectedOutput, mentionedUserIds) => {
    expect(patchMessageTextCommand(input, mentionedUserIds)).toBe(expectedOutput);
  });
});
