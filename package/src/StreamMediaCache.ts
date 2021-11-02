import RNFS from 'react-native-fs';

// Root dir for media storage
const getStreamRootDir = () => `${RNFS.DocumentDirectoryPath}/StreamStorage`;

/* 
  Avatars
*/
const getStreamAvatarsDir = () => `${getStreamRootDir()}/avatars`;
const getStreamChannelAvatarsDir = (cid: string) => `${getStreamAvatarsDir()}/${cid}`;

const getStreamChannelAvatarDir = (cid: string, filePathname: string) =>
  `${getStreamChannelAvatarsDir(cid)}/${filePathname}`;

const checkIfLocalAvatar = (cid: string, fileId: string) =>
  RNFS.exists(getStreamChannelAvatarDir(cid, fileId));

async function saveAvatar(cid: string, fileId: string, filePathname: string) {
  const avatarPath = getStreamChannelAvatarDir(cid, fileId);
  const avatarDir = avatarPath.substr(0, avatarPath.lastIndexOf('/'));

  if (!(await RNFS.exists(avatarDir))) {
    await RNFS.mkdir(avatarDir);
  }

  return RNFS.downloadFile({
    fromUrl: filePathname,
    toFile: avatarPath,
  }).promise;
}

async function removeChannelAvatars(cid: string) {
  try {
    return await RNFS.unlink(getStreamChannelAvatarsDir(cid));
  } catch (e) {
    return console.log('Skipping already deleted channel cached avatars...');
  }
}

/* 
  Attachments
*/

const getStreamAttachmentsDir = () => `${getStreamRootDir()}/attachments`;

const getStreamChannelAttachmentsDir = (cid: string) => `${getStreamAttachmentsDir()}/${cid}`;
const getStreamChannelMessageAttachmentsDir = (cid: string, mid: string) =>
  `${getStreamChannelAttachmentsDir(cid)}/${mid}`;

const getStreamChannelMessageAttachmentDir = (cid: string, mid: string, filePathname: string) =>
  `${getStreamChannelMessageAttachmentsDir(cid, mid)}/${filePathname}`;

const checkIfLocalAttachment = (cid: string, mid: string, fileId: string) =>
  RNFS.exists(getStreamChannelMessageAttachmentDir(cid, mid, fileId));

async function saveAttachment(cid: string, mid: string, fileId: string, filePathname: string) {
  const attachmentPath = getStreamChannelMessageAttachmentDir(cid, mid, fileId);
  const attachmentDir = attachmentPath.substr(0, attachmentPath.lastIndexOf('/'));

  if (!(await RNFS.exists(attachmentDir))) {
    await RNFS.mkdir(attachmentDir);
  }

  return RNFS.downloadFile({
    fromUrl: filePathname,
    toFile: attachmentPath,
  }).promise;
}

async function removeChannelAttachments(cid: string) {
  try {
    return await RNFS.unlink(getStreamChannelAttachmentsDir(cid));
  } catch (e) {
    return console.log('Skipping already deleted channel cached images...');
  }
}

async function removeMessageAttachments(cid: string, mid: string) {
  try {
    return await RNFS.unlink(getStreamChannelMessageAttachmentsDir(cid, mid));
  } catch (e) {
    return console.log('Skipping already deleted cached image...');
  }
}

async function clear() {
  try {
    return await RNFS.unlink(getStreamRootDir());
  } catch (e) {
    return console.log('Skipping already cleared media cache');
  }
}

export default {
  checkIfLocalAttachment,
  checkIfLocalAvatar,
  clear,
  getStreamChannelAvatarDir,
  getStreamChannelMessageAttachmentDir,
  removeChannelAttachments,
  removeChannelAvatars,
  removeMessageAttachments,
  saveAttachment,
  saveAvatar,
};
