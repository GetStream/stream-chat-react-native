const AutoCompleteInputWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>() => {};

const ReplyWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
) => {
  const {
    FileAttachmentIcon,
    attachmentSize = 40,
    MessageAvatar,
    quotedMessage,
    styles: stylesProp = {},
    t,
  } = props;

  const [error, setError] = useState(false);

  const {
    theme: {
      colors: { blue_alice, border, grey, transparent, white },
      messageSimple: {
        content: { deletedText },
      },
      reply: {
        container,
        fileAttachmentContainer,
        imageAttachment,
        markdownStyles,
        messageContainer,
        textContainer,
      },
    },
  } = useTheme();

  if (typeof quotedMessage === 'boolean') return null;

  const lastAttachment = quotedMessage.attachments?.slice(-1)[0];

  const messageType = lastAttachment
    ? lastAttachment.type === 'file' || lastAttachment.type === 'audio'
      ? 'file'
      : lastAttachment.type === 'image' &&
        !lastAttachment.title_link &&
        !lastAttachment.og_scrape_url
      ? lastAttachment.image_url || lastAttachment.thumb_url
        ? 'image'
        : undefined
      : lastAttachment.type === 'giphy' || lastAttachment.type === 'imgur'
      ? 'giphy'
      : 'other'
    : undefined;

  const hasImage =
    !error &&
    lastAttachment &&
    messageType !== 'file' &&
    (lastAttachment.image_url || lastAttachment.thumb_url || lastAttachment.og_scrape_url);

  const onlyEmojis = !lastAttachment && !!quotedMessage.text && emojiRegex.test(quotedMessage.text);

  return (
    <View style={[styles.container, container, stylesProp.container]}>
      <MessageAvatar alignment={'left'} lastGroupMessage message={quotedMessage} size={24} />
      <View
        style={[
          styles.messageContainer,
          {
            backgroundColor:
              messageType === 'other' ? blue_alice : messageType === 'giphy' ? transparent : white,
            borderColor: border,
            borderWidth: messageType === 'other' ? 0 : 1,
          },
          messageContainer,
          stylesProp.messageContainer,
        ]}
      >
        {!error && lastAttachment ? (
          messageType === 'file' ? (
            <View
              style={[
                styles.fileAttachmentContainer,
                fileAttachmentContainer,
                stylesProp.fileAttachmentContainer,
              ]}
            >
              <FileAttachmentIcon mimeType={lastAttachment.mime_type} size={attachmentSize} />
            </View>
          ) : hasImage ? (
            <Image
              onError={() => setError(true)}
              source={{
                uri:
                  lastAttachment.image_url ||
                  lastAttachment.thumb_url ||
                  lastAttachment.og_scrape_url,
              }}
              style={[styles.imageAttachment, imageAttachment, stylesProp.imageAttachment]}
            />
          ) : null
        ) : null}
      </View>
    </View>
  );
};
