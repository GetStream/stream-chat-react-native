import RNFS from 'react-native-fs';

const getStreamRootDir = () => `${RNFS.DocumentDirectoryPath}/StreamStorage`;
const getStreamAttachmentsDir = () => `${getStreamRootDir()}/attachments`;

const getStreamChannelAttachmentsDir = (cid: string) => `${getStreamAttachmentsDir()}/${cid}`;
const getStreamChannelMessageAttachmentsDir = (cid: string, mid: string) =>
  `${getStreamChannelAttachmentsDir(cid)}/${mid}`;

export const getStreamChannelMessageAttachmentDir = (cid: string, mid: string, fileUrl: string) =>
  `${getStreamChannelMessageAttachmentsDir(cid, mid)}/${fileUrl}`;

export const checkIfLocalAttachment = (cid: string, mid: string, fileId: string) =>
  RNFS.exists(getStreamChannelMessageAttachmentDir(cid, mid, fileId));

export async function saveAttachment(cid: string, mid: string, fileId: string, fileUrl: string) {
  const attachmentPath = getStreamChannelMessageAttachmentDir(cid, mid, fileId);
  const attachmentDir = attachmentPath.substr(0, attachmentPath.lastIndexOf('/'));

  if (!(await RNFS.exists(attachmentDir))) {
    await RNFS.mkdir(attachmentDir);
  }

  return RNFS.downloadFile({
    fromUrl: fileUrl,
    toFile: attachmentPath,
  }).promise;
}

export function removeMessageAttachments(cid: string, mid: string) {
  return RNFS.unlink(getStreamChannelMessageAttachmentsDir(cid, mid));
}

export function removeChannelAttachments(cid: string) {
  return RNFS.unlink(getStreamChannelAttachmentsDir(cid));
}
