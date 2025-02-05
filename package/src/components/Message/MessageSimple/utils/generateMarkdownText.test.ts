import { generateMarkdownText } from './generateMarkdownText';

describe('generateMarkdownText', () => {
  it.each([
    ['', null],
    ['  test message  ', 'test message'],
    ['https://www.getstream.io', '[https://www.getstream.io](https://www.getstream.io)'],
    [
      'https://getstream-production.s3-accelerate.amazonaws.com/N336903591601695/33e78ef89e64642862a75c5cca2541eaf6b1c924/trimmedVideos/alert/2_270_881/outputVideo.mp4?AWSAccessKeyId=AKIAVJAW2AD2SQVQCBXV&Expires=1699998768&Signature=zdEMCGzf4Pq++16YkPprvN5NAds=',
      '[https://getstream-production.s3-accelerate.amazonaws.com/N336903591601695/33e78ef89e64642862a75c5cca2541eaf6b1c924/trimmedVideos/alert/2_270_881/outputVideo.mp4?AWSAccessKeyId=AKIAVJAW2AD2SQVQCBXV&...](https://getstream-production.s3-accelerate.amazonaws.com/N336903591601695/33e78ef89e64642862a75c5cca2541eaf6b1c924/trimmedVideos/alert/2_270_881/outputVideo.mp4?AWSAccessKeyId=AKIAVJAW2AD2SQVQCBXV&Expires=1699998768&Signature=zdEMCGzf4Pq++16YkPprvN5NAds=)',
    ],
    ['Hi @getstream.io', 'Hi @getstream.io'],
    [
      'Hi test@gmail.com @test@gmail.com',
      'Hi [test@gmail.com](mailto:test@gmail.com) @test@gmail.com',
    ],
    ['Hi @getstream.io getstream.io', 'Hi @getstream.io [getstream.io](http://getstream.io)'],
    ['Hi <Stream>', 'Hi \\<Stream>'],
  ])('Returns the generated markdown text for %p and %p', (text, expected) => {
    const result = generateMarkdownText(text);
    expect(result).toBe(expected);
  });
});
