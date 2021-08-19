import RNFS from 'react-native-fs';

// Root dir for media storage
const getStreamRootDir = () => `${RNFS.DocumentDirectoryPath}/StreamStorage`;

/* 
  Avatars
*/
const getStreamAvatarsDir = () => `${getStreamRootDir()}/avatars`;
const getStreamChannelAvatarsDir = (cid: string) => `${getStreamAvatarsDir()}/${cid}`;

export const getStreamChannelAvatarDir = (cid: string, fileUrl: string) =>
  `${getStreamChannelAvatarsDir(cid)}/${fileUrl}`;

export const checkIfLocalAvatar = (cid: string, fileId: string) =>
  RNFS.exists(getStreamChannelAvatarDir(cid, fileId));

export async function saveAvatar(cid: string, fileId: string, fileUrl: string) {
  const avatarPath = getStreamChannelAvatarDir(cid, fileId);
  const avatarDir = avatarPath.substr(0, avatarPath.lastIndexOf('/'));

  if (!(await RNFS.exists(avatarDir))) {
    await RNFS.mkdir(avatarDir);
  }

  return RNFS.downloadFile({
    fromUrl: fileUrl,
    toFile: avatarPath,
  }).promise;
}

export function removeChannelAvatars(cid: string) {
  return RNFS.unlink(getStreamChannelAvatarsDir(cid)).catch(() =>
    console.log('Skipping already deleted cached image...'),
  );
}

/* 
  Attachments
*/

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
  return RNFS.unlink(getStreamChannelMessageAttachmentsDir(cid, mid)).catch(() =>
    console.log('Skipping already deleted cached image...'),
  );
}

export function removeChannelAttachments(cid: string) {
  return RNFS.unlink(getStreamChannelAttachmentsDir(cid));
}
